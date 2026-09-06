import { create } from 'zustand';
import { createMidiAdapter, type PrimaryKind } from '@/midi';
import type { MidiDeviceInfo, MidiEvent, MidiNumber } from '@/midi/types';
import { echo } from '@/audio/sampler';
import { toast } from '@/ui/Toast';
import { useSettingsStore } from './settingsStore';

export type MidiStatus =
  'uninitialized' | 'initializing' | 'unsupported' | 'denied' | 'no-device' | 'connected';

interface MidiState {
  computerBase: number;
  status: MidiStatus;
  kind: PrimaryKind;
  devices: MidiDeviceInfo[];
  selectedId: string | null;
  /** Snapshot; a new Set reference per animation-frame batch. */
  activeNotes: ReadonlySet<MidiNumber>;
  pedalDown: boolean;
  /** Bumped once per rAF batch of note changes (cheap subscription key). */
  noteVersion: number;
  lastEventAt: number | null;
  init(): Promise<void>;
  select(deviceId: string | null): void;
}

type RawListener = (e: MidiEvent) => void;
const rawListeners = new Set<RawListener>();

/** Engine-facing subscription: every normalized event, no React involved. */
export function subscribeMidiEvents(cb: RawListener): () => void {
  rawListeners.add(cb);
  return () => rawListeners.delete(cb);
}

let adapter: ReturnType<typeof createMidiAdapter> | null = null;

// Mutable working state, flushed to the store at most once per animation frame.
const held = new Set<MidiNumber>();
let flushQueued = false;
const lastSeen = new Map<string, number>(); // dedupe key -> tPerf

function queueFlush(set: (partial: Partial<MidiState>) => void): void {
  if (flushQueued) return;
  flushQueued = true;
  requestAnimationFrame(() => {
    flushQueued = false;
    set({
      activeNotes: new Set(held),
      noteVersion: useMidiStore.getState().noteVersion + 1,
      lastEventAt: performance.now(),
    });
  });
}

export const useMidiStore = create<MidiState>((set, get) => ({
  computerBase: 60,
  status: 'uninitialized',
  kind: 'none',
  devices: [],
  selectedId: null,
  activeNotes: new Set<MidiNumber>(),
  pedalDown: false,
  noteVersion: 0,
  lastEventAt: null,

  async init() {
    if (get().status !== 'uninitialized') return;
    set({ status: 'initializing' });
    window.addEventListener('keysense:octave', (event) =>
      set({ computerBase: (event as CustomEvent<number>).detail }),
    );
    adapter = createMidiAdapter();
    set({ kind: adapter.kind });

    adapter.onEvent((e) => ingest(e, set));
    adapter.onDevicesChanged((devices) => {
      const { selectedId, status } = get();
      if (get().devices.some((old) => !devices.some((device) => device.id === old.id))) releaseAllInput();
      if (selectedId && !devices.some((d) => d.id === selectedId)) {
        releaseAllInput();
        set({ selectedId: null });
        useSettingsStore.getState().setDeviceId(null);
        toast('Keyboard disconnected. Listening to all devices', 'warn');
      }
      set({ devices });
      if (status === 'connected' || status === 'no-device') {
        set({ status: devices.length > 0 ? 'connected' : 'no-device' });
      }
    });

    const result = await adapter.init();
    if (result === 'unsupported') {
      set({ status: 'unsupported' });
      return;
    }
    if (result === 'denied') {
      set({ status: 'denied' });
      return;
    }
    const devices = adapter.listInputs();
    const storedId = useSettingsStore.getState().deviceId;
    const selectedId = storedId && devices.some((d) => d.id === storedId) ? storedId : null;
    adapter.select(selectedId);
    set({ devices, selectedId, status: devices.length > 0 ? 'connected' : 'no-device' });
  },

  select(deviceId) {
    adapter?.select(deviceId);
    set({ selectedId: deviceId });
    useSettingsStore.getState().setDeviceId(deviceId);
  },
}));

function ingest(e: MidiEvent, set: (partial: Partial<MidiState>) => void): void {
  // Dedupe identical events within 3ms (MIDI-thru double delivery).
  const key = e.kind === 'pedal' ? `pedal:${e.down}` : `${e.kind}:${e.midi}`;
  const prev = lastSeen.get(key);
  if (prev !== undefined && e.tPerf - prev < 3) return;
  lastSeen.set(key, e.tPerf);
  if (e.kind !== 'pedal') lastSeen.delete(`${e.kind === 'noteon' ? 'noteoff' : 'noteon'}:${e.midi}`);

  if (useSettingsStore.getState().audioEnabled) echo(e);

  if (e.kind === 'pedal') {
    set({ pedalDown: e.down });
  } else {
    if (e.kind === 'noteon') held.add(e.midi);
    else held.delete(e.midi);
    queueFlush(set);
  }

  for (const cb of rawListeners) cb(e);
}

/** Pointer input uses the same timestamped path as physical and computer keys. */
export function inputNoteOn(midi: number): void {
  ingest(
    { kind: 'noteon', midi, velocity: 0.7, tPerf: performance.now(), channel: 1 },
    useMidiStore.setState,
  );
}
export function inputNoteOff(midi: number): void {
  ingest({ kind: 'noteoff', midi, velocity: 0, tPerf: performance.now(), channel: 1 }, useMidiStore.setState);
}
export function releaseAllInput(): void {
  for (const midi of [...held]) inputNoteOff(midi);
  ingest({ kind: 'pedal', down: false, value: 0, tPerf: performance.now() }, useMidiStore.setState);
  lastSeen.clear();
}
