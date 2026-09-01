import type { MidiAdapter, MidiDeviceInfo, MidiEvent, MidiInitResult } from './types';

export interface FakeScriptNote {
  midi: number;
  /** ms after play() is called */
  at: number;
  /** ms */
  dur: number;
  vel?: number;
}

export interface FakeMidiControls {
  play(script: FakeScriptNote[]): void;
  pressNow(midi: number, vel?: number): void;
  release(midi: number): void;
  releaseAll(): void;
}

declare global {
  interface Window {
    __fakeMidi?: FakeMidiControls;
  }
}

/** Scripted adapter for E2E tests and development (`?midi=fake`). */
export class FakeAdapter implements MidiAdapter {
  private eventCbs = new Set<(e: MidiEvent) => void>();
  private heldNotes = new Set<number>();
  private timers = new Set<ReturnType<typeof setTimeout>>();

  init(): Promise<MidiInitResult> {
    window.__fakeMidi = {
      play: (script) => this.playScript(script),
      pressNow: (midi, vel = 0.8) => this.noteOn(midi, vel),
      release: (midi) => this.noteOff(midi),
      releaseAll: () => {
        for (const midi of [...this.heldNotes]) this.noteOff(midi);
      },
    };
    return Promise.resolve('ok');
  }

  listInputs(): MidiDeviceInfo[] {
    return [{ id: 'fake', name: 'Fake MIDI (test)', manufacturer: 'keysense' }];
  }

  select(): void {
    /* single virtual device */
  }

  onEvent(cb: (e: MidiEvent) => void): () => void {
    this.eventCbs.add(cb);
    return () => this.eventCbs.delete(cb);
  }

  onDevicesChanged(cb: (inputs: MidiDeviceInfo[]) => void): () => void {
    cb(this.listInputs());
    return () => {};
  }

  dispose(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    this.eventCbs.clear();
    delete window.__fakeMidi;
  }

  private emit(e: MidiEvent): void {
    for (const cb of this.eventCbs) cb(e);
  }

  private noteOn(midi: number, vel: number): void {
    this.heldNotes.add(midi);
    this.emit({ kind: 'noteon', midi, velocity: vel, tPerf: performance.now(), channel: 1 });
  }

  private noteOff(midi: number): void {
    this.heldNotes.delete(midi);
    this.emit({ kind: 'noteoff', midi, velocity: 0, tPerf: performance.now(), channel: 1 });
  }

  private playScript(script: FakeScriptNote[]): void {
    for (const n of script) {
      const on = setTimeout(() => this.noteOn(n.midi, n.vel ?? 0.8), n.at);
      const off = setTimeout(() => this.noteOff(n.midi), n.at + n.dur);
      this.timers.add(on);
      this.timers.add(off);
    }
  }
}
