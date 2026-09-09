import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { MidiEvent } from '@/midi/types';
const mock = vi.hoisted(() => ({
  midi: null as ((e: MidiEvent) => void) | null,
  start: vi.fn(() => ({ t0Perf: performance.now() + 2000 })),
  stop: vi.fn(),
  play: vi.fn(),
  unlock: vi.fn(async () => {}),
}));
vi.mock('@/audio/metronome', () => ({
  startMetronome: mock.start,
  stopMetronome: mock.stop,
  onBeat: () => () => {},
}));
vi.mock('@/audio/clock', () => ({ unlockAudio: mock.unlock }));
vi.mock('@/audio/sampler', () => ({
  playNote: mock.play,
  stopNote: vi.fn(),
  ensureSamplerLoaded: vi.fn(async () => {}),
}));
vi.mock('./midiStore', () => ({
  subscribeMidiEvents: (fn: (e: MidiEvent) => void) => {
    mock.midi = fn;
  },
}));
vi.mock('./settingsStore', () => ({
  useSettingsStore: { getState: () => ({ metronomeVolume: 0.7, latencyOffsetMs: 0 }) },
}));
import { useRunStore } from './runStore';
import type { ExerciseInstance } from '@/engine/types';
const inst: ExerciseInstance = {
  def: {
    generator: 'test',
    params: {},
    mode: 'tempo',
    bpm: 120,
    rung: 'keys-lit',
    hand: 'rh',
    seedPolicy: 'fixed',
  },
  seed: 42,
  targets: [
    { kind: 'note', midi: 60, atBeat: 0 },
    { kind: 'note', midi: 64, atBeat: 1 },
  ],
  prompt: { title: 'Test' },
  beatsPerBar: 3,
};
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  vi.clearAllMocks();
  useRunStore.getState().abortRun();
});
afterEach(() => {
  useRunStore.getState().abortRun();
  vi.useRealTimers();
});
it('demonstrates exactly the take, ignores MIDI, then starts a fresh count-in', async () => {
  const started = useRunStore.getState().startRun(inst);
  await vi.advanceTimersByTimeAsync(200);
  expect(useRunStore.getState().phase).toBe('preview');
  expect(mock.start).not.toHaveBeenCalled();
  mock.midi?.({ kind: 'noteon', midi: 61, velocity: 0.8, tPerf: performance.now() } as MidiEvent);
  expect(useRunStore.getState().result).toBeNull();
  await vi.advanceTimersByTimeAsync(1500);
  await started;
  expect(mock.play.mock.calls.map((c) => c[0])).toEqual([60, 64]);
  expect(useRunStore.getState().phase).toBe('count-in');
  expect(useRunStore.getState().targetIndex).toBe(0);
  expect(useRunStore.getState().judgments.size).toBe(0);
  expect(mock.start).toHaveBeenCalledWith(expect.objectContaining({ timeSig: [3, 4] }));
});
it('cancels every demo timer when leaving, including the pending count-in', async () => {
  const started = useRunStore.getState().startRun(inst);
  await vi.advanceTimersByTimeAsync(200);
  useRunStore.getState().abortRun();
  await started;
  await vi.advanceTimersByTimeAsync(5000);
  expect(useRunStore.getState().phase).toBe('idle');
  expect(mock.start).not.toHaveBeenCalled();
  expect(mock.play).toHaveBeenCalledTimes(1);
});
it('restarting during a demonstration cannot start the abandoned take', async () => {
  const old = useRunStore.getState().startRun(inst);
  await vi.advanceTimersByTimeAsync(200);
  const next = useRunStore.getState().startRun({ ...inst, seed: 99, targets: [{ kind: 'note', midi: 67 }] });
  await vi.advanceTimersByTimeAsync(2000);
  await Promise.all([old, next]);
  expect(useRunStore.getState().instance?.seed).toBe(99);
  expect(mock.start).toHaveBeenCalledTimes(1);
  expect(mock.play.mock.calls.map((c) => c[0])).toEqual([60, 67]);
});
