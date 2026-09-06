import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MidiDeviceInfo, MidiEvent } from '@/midi/types';

const mock = vi.hoisted(() => ({
  event: (_e: MidiEvent) => {},
  devices: (_d: MidiDeviceInfo[]) => {},
  echo: vi.fn(),
}));
vi.mock('@/audio/sampler', () => ({ echo: mock.echo }));
vi.mock('@/ui/Toast', () => ({ toast: vi.fn() }));
vi.mock('@/midi', () => ({
  createMidiAdapter: () => ({
    kind: 'web',
    init: async () => 'ok',
    select: vi.fn(),
    listInputs: () => [{ id: 'piano', name: 'Piano' }],
    onEvent: (cb: typeof mock.event) => {
      mock.event = cb;
    },
    onDevicesChanged: (cb: typeof mock.devices) => {
      mock.devices = cb;
    },
  }),
}));
import { inputNoteOn, inputNoteOff, releaseAllInput, subscribeMidiEvents, useMidiStore } from './midiStore';

beforeEach(() => {
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
    cb();
    return 1;
  });
  releaseAllInput();
  mock.echo.mockClear();
  useMidiStore.setState({ status: 'uninitialized', selectedId: null, devices: [] });
});

afterEach(() => vi.unstubAllGlobals());

describe('input lifecycle', () => {
  it('keeps rapid note-on/off repetitions but suppresses duplicate delivery', () => {
    const events: MidiEvent[] = [];
    const off = subscribeMidiEvents((e) => events.push(e));
    inputNoteOn(60);
    inputNoteOff(60);
    inputNoteOn(60);
    inputNoteOff(60);
    expect(events.map((e) => e.kind)).toEqual(['noteon', 'noteoff', 'noteon', 'noteoff']);
    expect(useMidiStore.getState().activeNotes.size).toBe(0);
    off();
  });
  it('clears notes and sustain when any connected input disappears, then accepts reconnection', async () => {
    await useMidiStore.getState().init();
    mock.event({ kind: 'noteon', midi: 60, velocity: 0.8, tPerf: 100, channel: 1 });
    mock.event({ kind: 'pedal', down: true, value: 127, tPerf: 110 });
    expect(useMidiStore.getState().pedalDown).toBe(true);
    mock.devices([]);
    expect(useMidiStore.getState().status).toBe('no-device');
    expect(useMidiStore.getState().activeNotes.size).toBe(0);
    expect(useMidiStore.getState().pedalDown).toBe(false);
    expect(mock.echo.mock.calls.some(([e]) => e.kind === 'pedal' && !e.down)).toBe(true);
    mock.devices([{ id: 'piano', name: 'Piano', manufacturer: 'Test' }]);
    mock.event({ kind: 'noteon', midi: 62, velocity: 0.8, tPerf: 200, channel: 1 });
    expect(useMidiStore.getState().status).toBe('connected');
    expect(useMidiStore.getState().activeNotes.has(62)).toBe(true);
  });
  it('ignores identical messages arriving twice without suppressing the next real press', async () => {
    await useMidiStore.getState().init();
    const events: MidiEvent[] = [];
    const off = subscribeMidiEvents((e) => events.push(e));
    mock.event({ kind: 'noteon', midi: 60, velocity: 0.7, tPerf: 100, channel: 1 });
    mock.event({ kind: 'noteon', midi: 60, velocity: 0.7, tPerf: 101, channel: 1 });
    mock.event({ kind: 'noteoff', midi: 60, velocity: 0, tPerf: 102, channel: 1 });
    mock.event({ kind: 'noteon', midi: 60, velocity: 0.7, tPerf: 102.5, channel: 1 });
    expect(events).toHaveLength(3);
    off();
  });
});
