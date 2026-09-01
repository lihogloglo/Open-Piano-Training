import type { MidiAdapter, MidiDeviceInfo, MidiEvent, MidiInitResult } from './types';
import { ComputerKeyboardAdapter } from './computerKeyboardAdapter';
import { FakeAdapter } from './fakeAdapter';
import { WebmidiAdapter } from './webmidiAdapter';

export type * from './types';

export type PrimaryKind = 'fake' | 'webmidi' | 'none';

/** Layers the QWERTY fallback on top of the primary adapter (fake or real). */
class CompositeAdapter implements MidiAdapter {
  readonly kind: PrimaryKind;
  private primary: MidiAdapter | null;
  private keyboard = new ComputerKeyboardAdapter();

  constructor(primary: MidiAdapter | null, kind: PrimaryKind) {
    this.primary = primary;
    this.kind = kind;
  }

  async init(): Promise<MidiInitResult> {
    await this.keyboard.init();
    if (!this.primary) return 'unsupported';
    const result = await this.primary.init();
    if (result !== 'ok') this.primary = null;
    return result;
  }

  listInputs(): MidiDeviceInfo[] {
    return this.primary?.listInputs() ?? [];
  }

  select(deviceId: string | null): void {
    this.primary?.select(deviceId);
  }

  onEvent(cb: (e: MidiEvent) => void): () => void {
    const un1 = this.primary?.onEvent(cb) ?? (() => {});
    const un2 = this.keyboard.onEvent(cb);
    return () => {
      un1();
      un2();
    };
  }

  onDevicesChanged(cb: (inputs: MidiDeviceInfo[]) => void): () => void {
    return this.primary?.onDevicesChanged(cb) ?? (() => {});
  }

  dispose(): void {
    this.primary?.dispose();
    this.keyboard.dispose();
  }
}

export function createMidiAdapter(): CompositeAdapter {
  const params = new URLSearchParams(window.location.search);
  if (params.get('midi') === 'fake') return new CompositeAdapter(new FakeAdapter(), 'fake');
  if ('requestMIDIAccess' in navigator) return new CompositeAdapter(new WebmidiAdapter(), 'webmidi');
  return new CompositeAdapter(null, 'none');
}
