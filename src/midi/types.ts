/** MIDI note number, 21 (A0) .. 108 (C8). */
export type MidiNumber = number;

export interface NoteEvent {
  kind: 'noteon' | 'noteoff';
  midi: MidiNumber;
  /** 0..1 normalized. A raw noteon with velocity 0 MUST be emitted as kind 'noteoff'. */
  velocity: number;
  /** performance.now() clock domain, ms. */
  tPerf: number;
  channel: number;
}

export interface PedalEvent {
  kind: 'pedal';
  down: boolean;
  /** Raw CC64 value 0..127. */
  value: number;
  tPerf: number;
}

export type MidiEvent = NoteEvent | PedalEvent;

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
}

export type MidiInitResult = 'ok' | 'unsupported' | 'denied';

export interface MidiAdapter {
  init(): Promise<MidiInitResult>;
  listInputs(): MidiDeviceInfo[];
  /** null = listen to all inputs. */
  select(deviceId: string | null): void;
  /** Returns an unsubscribe function. */
  onEvent(cb: (e: MidiEvent) => void): () => void;
  onDevicesChanged(cb: (inputs: MidiDeviceInfo[]) => void): () => void;
  dispose(): void;
}
