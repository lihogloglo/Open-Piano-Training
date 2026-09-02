import { keyScaleNotes, type KeyContext } from './keys';
import { namePc, pcOf, type MidiNumber } from './notes';

export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** CSS custom-property name per degree (defined in styles/tokens.css). */
export const DEGREE_COLOR_VARS: Record<Degree, string> = {
  1: '--deg-1',
  2: '--deg-2',
  3: '--deg-3',
  4: '--deg-4',
  5: '--deg-5',
  6: '--deg-6',
  7: '--deg-7',
};

export const DEGREE_NAMES: Record<Degree, string> = {
  1: 'tonic',
  2: 'supertonic',
  3: 'mediant',
  4: 'subdominant',
  5: 'dominant',
  6: 'submediant',
  7: 'leading tone',
};

/** Scale degree of a midi note in the key (its diatonic scale), or null if non-diatonic. */
export function degreeOf(midi: MidiNumber, key: KeyContext): Degree | null {
  const pcs = keyScaleNotes(key).map((n) => namePc(n));
  const idx = pcs.indexOf(pcOf(midi));
  return idx === -1 ? null : ((idx + 1) as Degree);
}

/** Midi of a degree near a reference octave (tonic placed at that octave). */
export function degreeToMidi(degree: Degree, key: KeyContext, tonicMidi: MidiNumber): MidiNumber {
  const pcs = keyScaleNotes(key).map((n) => namePc(n) ?? 0);
  const tonicPc = pcs[0] ?? 0;
  const target = pcs[degree - 1] ?? tonicPc;
  const up = (target - tonicPc + 12) % 12;
  return tonicMidi + up;
}
