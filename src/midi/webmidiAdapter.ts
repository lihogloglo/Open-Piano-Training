import type { Input } from 'webmidi';
import type { MidiAdapter, MidiDeviceInfo, MidiEvent, MidiInitResult } from './types';

type WebMidiModule = typeof import('webmidi').WebMidi;

/** Real Web MIDI implementation over the webmidi.js wrapper. Lazy-loads the library. */
export class WebmidiAdapter implements MidiAdapter {
  private webmidi: WebMidiModule | null = null;
  private eventCbs = new Set<(e: MidiEvent) => void>();
  private deviceCbs = new Set<(inputs: MidiDeviceInfo[]) => void>();
  private selectedId: string | null = null;
  private wired = new Set<Input>();
  private pedalDown = false;

  async init(): Promise<MidiInitResult> {
    if (!('requestMIDIAccess' in navigator)) return 'unsupported';
    try {
      const { WebMidi } = await import('webmidi');
      this.webmidi = WebMidi;
      if (!WebMidi.enabled) await WebMidi.enable({ sysex: false });
    } catch {
      return 'denied';
    }
    const wm = this.webmidi;
    wm.addListener('connected', () => this.rewire());
    wm.addListener('disconnected', () => this.rewire());
    this.rewire();
    return 'ok';
  }

  listInputs(): MidiDeviceInfo[] {
    if (!this.webmidi) return [];
    return this.webmidi.inputs.map((i) => ({
      id: i.id,
      name: i.name,
      manufacturer: i.manufacturer,
    }));
  }

  select(deviceId: string | null): void {
    this.selectedId = deviceId;
    this.rewire();
  }

  onEvent(cb: (e: MidiEvent) => void): () => void {
    this.eventCbs.add(cb);
    return () => this.eventCbs.delete(cb);
  }

  onDevicesChanged(cb: (inputs: MidiDeviceInfo[]) => void): () => void {
    this.deviceCbs.add(cb);
    return () => this.deviceCbs.delete(cb);
  }

  dispose(): void {
    for (const input of this.wired) input.removeListener();
    this.wired.clear();
    this.eventCbs.clear();
    this.deviceCbs.clear();
  }

  private emit(e: MidiEvent): void {
    for (const cb of this.eventCbs) cb(e);
  }

  private rewire(): void {
    if (!this.webmidi) return;
    for (const input of this.wired) input.removeListener();
    this.wired.clear();

    // Selected device gone? Fall back to all inputs.
    const inputs = this.webmidi.inputs;
    const selected = this.selectedId ? inputs.find((i) => i.id === this.selectedId) : undefined;
    const active = selected ? [selected] : inputs;

    for (const input of active) {
      input.addListener('noteon', (e) => {
        const tPerf = e.timestamp || performance.now();
        const velocity = e.note.attack ?? 0;
        if (velocity === 0) {
          // Raw noteon with velocity 0 is a noteoff by MIDI convention.
          this.emit({ kind: 'noteoff', midi: e.note.number, velocity: 0, tPerf, channel: e.message.channel });
        } else {
          this.emit({ kind: 'noteon', midi: e.note.number, velocity, tPerf, channel: e.message.channel });
        }
      });
      input.addListener('noteoff', (e) => {
        this.emit({
          kind: 'noteoff',
          midi: e.note.number,
          velocity: e.note.release ?? 0,
          tPerf: e.timestamp || performance.now(),
          channel: e.message.channel,
        });
      });
      input.addListener('controlchange', (e) => {
        if (e.controller.number !== 64) return;
        const raw = typeof e.rawValue === 'number' ? e.rawValue : 0;
        const down = raw >= 64;
        if (down === this.pedalDown) return; // only emit transitions
        this.pedalDown = down;
        this.emit({ kind: 'pedal', down, value: raw, tPerf: e.timestamp || performance.now() });
      });
      this.wired.add(input);
    }

    const list = this.listInputs();
    for (const cb of this.deviceCbs) cb(list);
  }
}
