import { Scale } from 'tonal';
import { nameToMidi, type MidiNumber } from './notes';

export type ScaleType =
  'major' | 'natural-minor' | 'harmonic-minor' | 'major-pentatonic' | 'minor-pentatonic' | 'blues';

const TONAL_NAMES: Record<ScaleType, string> = {
  major: 'major',
  'natural-minor': 'minor',
  'harmonic-minor': 'harmonic minor',
  'major-pentatonic': 'major pentatonic',
  'minor-pentatonic': 'minor pentatonic',
  blues: 'minor blues',
};

/** Ascending midi notes: `octaves` octaves plus the top tonic. */
export function scaleMidis(
  tonic: string,
  type: ScaleType,
  octaves: 1 | 2 = 1,
  startOctave = 4,
): MidiNumber[] {
  const { notes } = Scale.get(`${tonic}${startOctave} ${TONAL_NAMES[type]}`);
  if (notes.length === 0) throw new Error(`Unknown scale: ${tonic} ${type}`);
  const base = notes.map((n) => nameToMidi(n)).filter((m): m is number => m !== null);
  const first = base[0];
  if (first === undefined) throw new Error(`Unresolvable scale: ${tonic} ${type}`);
  const out: MidiNumber[] = [];
  for (let o = 0; o < octaves; o++) out.push(...base.map((m) => m + 12 * o));
  out.push(first + 12 * octaves); // top tonic
  return out;
}

export type Hand = 'rh' | 'lh';

/**
 * Standard one-octave fingerings (ascending, 8 values incl. top tonic),
 * following common published conventions (pianoscales.org). Descending is the
 * reverse. Pentatonic/blues scales carry no fingering annotation.
 */
const MAJOR_RH: Record<string, readonly number[]> = {
  C: [1, 2, 3, 1, 2, 3, 4, 5],
  G: [1, 2, 3, 1, 2, 3, 4, 5],
  D: [1, 2, 3, 1, 2, 3, 4, 5],
  A: [1, 2, 3, 1, 2, 3, 4, 5],
  E: [1, 2, 3, 1, 2, 3, 4, 5],
  B: [1, 2, 3, 1, 2, 3, 4, 5],
  F: [1, 2, 3, 4, 1, 2, 3, 4],
  'F#': [2, 3, 4, 1, 2, 3, 1, 2],
  Gb: [2, 3, 4, 1, 2, 3, 1, 2],
  Bb: [4, 1, 2, 3, 1, 2, 3, 4],
  Eb: [3, 1, 2, 3, 4, 1, 2, 3],
  Ab: [3, 4, 1, 2, 3, 1, 2, 3],
  Db: [2, 3, 1, 2, 3, 4, 1, 2],
  'C#': [2, 3, 1, 2, 3, 4, 1, 2],
};

const MAJOR_LH: Record<string, readonly number[]> = {
  C: [5, 4, 3, 2, 1, 3, 2, 1],
  G: [5, 4, 3, 2, 1, 3, 2, 1],
  D: [5, 4, 3, 2, 1, 3, 2, 1],
  A: [5, 4, 3, 2, 1, 3, 2, 1],
  E: [5, 4, 3, 2, 1, 3, 2, 1],
  F: [5, 4, 3, 2, 1, 3, 2, 1],
  B: [4, 3, 2, 1, 4, 3, 2, 1],
  'F#': [4, 3, 2, 1, 3, 2, 1, 4],
  Gb: [4, 3, 2, 1, 3, 2, 1, 4],
  Bb: [3, 2, 1, 4, 3, 2, 1, 3],
  Eb: [3, 2, 1, 4, 3, 2, 1, 3],
  Ab: [3, 2, 1, 4, 3, 2, 1, 3],
  Db: [3, 2, 1, 4, 3, 2, 1, 3],
  'C#': [3, 2, 1, 4, 3, 2, 1, 3],
};

const MINOR_RH: Record<string, readonly number[]> = {
  A: [1, 2, 3, 1, 2, 3, 4, 5],
  E: [1, 2, 3, 1, 2, 3, 4, 5],
  D: [1, 2, 3, 1, 2, 3, 4, 5],
  G: [1, 2, 3, 1, 2, 3, 4, 5],
  C: [1, 2, 3, 1, 2, 3, 4, 5],
  B: [1, 2, 3, 1, 2, 3, 4, 5],
  F: [1, 2, 3, 4, 1, 2, 3, 4],
  'F#': [3, 4, 1, 2, 3, 1, 2, 3],
  'C#': [3, 4, 1, 2, 3, 1, 2, 3],
  'G#': [3, 4, 1, 2, 3, 1, 2, 3],
  Bb: [4, 1, 2, 3, 1, 2, 3, 4],
  Eb: [3, 1, 2, 3, 4, 1, 2, 3],
  'D#': [3, 1, 2, 3, 4, 1, 2, 3],
  Ab: [3, 4, 1, 2, 3, 1, 2, 3],
};

const MINOR_LH: Record<string, readonly number[]> = {
  A: [5, 4, 3, 2, 1, 3, 2, 1],
  E: [5, 4, 3, 2, 1, 3, 2, 1],
  D: [5, 4, 3, 2, 1, 3, 2, 1],
  G: [5, 4, 3, 2, 1, 3, 2, 1],
  C: [5, 4, 3, 2, 1, 3, 2, 1],
  F: [5, 4, 3, 2, 1, 3, 2, 1],
  B: [4, 3, 2, 1, 4, 3, 2, 1],
  'F#': [4, 3, 2, 1, 3, 2, 1, 4],
  'C#': [3, 2, 1, 4, 3, 2, 1, 3],
  'G#': [3, 2, 1, 4, 3, 2, 1, 3],
  Bb: [3, 2, 1, 4, 3, 2, 1, 3],
  Eb: [3, 2, 1, 4, 3, 2, 1, 3],
  'D#': [3, 2, 1, 4, 3, 2, 1, 3],
  Ab: [3, 2, 1, 4, 3, 2, 1, 3],
};

/**
 * Fingering for an ascending scale, aligned with scaleMidis(). Multi-octave:
 * the per-octave pattern repeats, the final note takes the top-tonic finger.
 * Returns null when no standard fingering is defined (pentatonics, blues).
 */
export function scaleFingering(
  tonic: string,
  type: ScaleType,
  hand: Hand,
  octaves: 1 | 2 = 1,
): number[] | null {
  let table: Record<string, readonly number[]> | null = null;
  if (type === 'major') table = hand === 'rh' ? MAJOR_RH : MAJOR_LH;
  if (type === 'natural-minor' || type === 'harmonic-minor') {
    table = hand === 'rh' ? MINOR_RH : MINOR_LH;
  }
  const one = table?.[tonic];
  if (!one) return null;
  const body = one.slice(0, 7);
  const top = one[7] ?? 5;
  const out: number[] = [];
  for (let o = 0; o < octaves; o++) out.push(...body);
  out.push(top);
  return out;
}
