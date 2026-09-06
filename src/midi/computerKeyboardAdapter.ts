import type { MidiAdapter, MidiDeviceInfo, MidiEvent, MidiInitResult } from './types';

// a..k white keys C4..C5, w/e/t/y/u the black keys between them; z/x shift octave.
const KEY_TO_OFFSET: Record<string, number> = {
  a: 0, // C
  w: 1,
  s: 2,
  e: 3,
  d: 4,
  f: 5,
  t: 6,
  g: 7,
  y: 8,
  h: 9,
  u: 10,
  j: 11,
  k: 12,
};

const MIN_MIDI = 21;
const MAX_MIDI = 108;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

/** QWERTY fallback so the app is usable (and demoable) without a MIDI device. */
export class ComputerKeyboardAdapter implements MidiAdapter {
  private eventCbs = new Set<(e: MidiEvent) => void>();
  private held = new Map<string, number>(); // physical key -> midi it triggered
  private baseC = 60; // C4
  private keydown = (e: KeyboardEvent) => this.onKeydown(e);
  private keyup = (e: KeyboardEvent) => this.onKeyup(e);

  private release = () => {
    for (const midi of this.held.values())
      this.emit({ kind: 'noteoff', midi, velocity: 0, tPerf: performance.now(), channel: 1 });
    this.held.clear();
  };

  init(): Promise<MidiInitResult> {
    window.addEventListener('blur', this.release);
    window.dispatchEvent(new CustomEvent('keysense:octave', { detail: this.baseC }));
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
    return Promise.resolve('ok');
  }

  listInputs(): MidiDeviceInfo[] {
    return []; // a supplement, not a selectable device
  }

  select(): void {
    /* nothing to select */
  }

  onEvent(cb: (e: MidiEvent) => void): () => void {
    this.eventCbs.add(cb);
    return () => this.eventCbs.delete(cb);
  }

  onDevicesChanged(): () => void {
    return () => {};
  }

  dispose(): void {
    this.release();
    window.removeEventListener('blur', this.release);
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    this.eventCbs.clear();
  }

  private emit(e: MidiEvent): void {
    for (const cb of this.eventCbs) cb(e);
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
    const key = e.key.toLowerCase();
    if (key === 'z') {
      this.baseC = Math.max(MIN_MIDI + 3, this.baseC - 12);
      window.dispatchEvent(new CustomEvent('keysense:octave', { detail: this.baseC }));
      return;
    }
    if (key === 'x') {
      this.baseC = Math.min(MAX_MIDI - 12, this.baseC + 12);
      window.dispatchEvent(new CustomEvent('keysense:octave', { detail: this.baseC }));
      return;
    }
    const offset = KEY_TO_OFFSET[key];
    if (offset === undefined || this.held.has(key)) return;
    const midi = this.baseC + offset;
    if (midi < MIN_MIDI || midi > MAX_MIDI) return;
    this.held.set(key, midi);
    this.emit({
      kind: 'noteon',
      midi,
      velocity: e.shiftKey ? 1 : 0.7,
      tPerf: performance.now(),
      channel: 1,
    });
  }

  private onKeyup(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    const midi = this.held.get(key);
    if (midi === undefined) return;
    this.held.delete(key);
    this.emit({ kind: 'noteoff', midi, velocity: 0, tPerf: performance.now(), channel: 1 });
  }
}
