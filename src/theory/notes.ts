import { Note } from 'tonal';
import { keyUsesSharps, type KeyContext } from './keys';

export type MidiNumber = number;

export function pcOf(midi: MidiNumber): number {
  return ((midi % 12) + 12) % 12;
}

/** 'C4' | 'F#3' | 'Bb2' → midi, or null. Accepts ♯/♭ glyphs too. */
export function nameToMidi(name: string): MidiNumber | null {
  const normalized = name.replace(/♯/g, '#').replace(/♭/g, 'b');
  const m = Note.midi(normalized);
  return m ?? null;
}

/** Pitch class of a note name without octave ('Eb' → 3), or null. */
export function namePc(name: string): number | null {
  const normalized = name.replace(/♯/g, '#').replace(/♭/g, 'b');
  const chroma = Note.chroma(normalized);
  return typeof chroma === 'number' ? chroma : null;
}

/** Spell a midi note for display; flats/sharps follow the key context (default sharps). */
export function midiToName(midi: MidiNumber, key?: KeyContext): string {
  const sharps = key ? keyUsesSharps(key) : true;
  const name = sharps ? Note.fromMidiSharps(midi) : Note.fromMidi(midi);
  return name.replace(/#/g, '♯').replace(/b(?=-?\d)/g, '♭');
}

/** Note letter+accidental only, no octave. */
export function midiToPcName(midi: MidiNumber, key?: KeyContext): string {
  return midiToName(midi, key).replace(/-?\d+$/, '');
}
