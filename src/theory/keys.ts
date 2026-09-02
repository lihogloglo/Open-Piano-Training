import { Key, Note } from 'tonal';

export interface KeyContext {
  /** 'C', 'F#', 'Eb', ... */
  tonic: string;
  mode: 'major' | 'minor';
}

export type ChordQualityBasic = 'maj' | 'min' | 'dim' | 'aug';

/** Circle of fifths, sharps clockwise from C. */
export const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'] as const;

export interface KeySignature {
  /** Positive = sharps, negative = flats. */
  alteration: number;
  /** e.g. ['F#', 'C#'] or ['Bb', 'Eb'] in order of appearance. */
  accidentals: string[];
}

export function keySignature(key: KeyContext): KeySignature {
  const k = key.mode === 'major' ? Key.majorKey(key.tonic) : Key.minorKey(key.tonic);
  const alteration = k.alteration;
  const order =
    alteration >= 0 ? ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'] : ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];
  return { alteration, accidentals: order.slice(0, Math.abs(alteration)) };
}

export function keyUsesSharps(key: KeyContext): boolean {
  return keySignature(key).alteration >= 0;
}

/** The seven diatonic scale-note names of the key ('A minor' → natural minor). */
export function keyScaleNotes(key: KeyContext): string[] {
  if (key.mode === 'major') return [...Key.majorKey(key.tonic).scale];
  return [...Key.minorKey(key.tonic).natural.scale];
}

/** Major-key diatonic triad quality pattern, a transposable fact. */
export const MAJOR_DIATONIC_QUALITIES: readonly ChordQualityBasic[] = [
  'maj',
  'min',
  'min',
  'maj',
  'maj',
  'min',
  'dim',
];
export const MINOR_DIATONIC_QUALITIES: readonly ChordQualityBasic[] = [
  'min',
  'dim',
  'maj',
  'min',
  'min',
  'maj',
  'maj',
];

export interface DiatonicTriad {
  degree: number; // 1..7
  root: string;
  quality: ChordQualityBasic;
  roman: string;
}

const MAJOR_ROMANS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const;
const MINOR_ROMANS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] as const;

export function diatonicTriads(key: KeyContext): DiatonicTriad[] {
  const scale = keyScaleNotes(key);
  const qualities = key.mode === 'major' ? MAJOR_DIATONIC_QUALITIES : MINOR_DIATONIC_QUALITIES;
  const romans = key.mode === 'major' ? MAJOR_ROMANS : MINOR_ROMANS;
  return scale.map((root, i) => ({
    degree: i + 1,
    root,
    quality: qualities[i] ?? 'maj',
    roman: romans[i] ?? 'I',
  }));
}

/** Relative minor tonic of a major key (and vice versa). */
export function relativeKey(key: KeyContext): KeyContext {
  if (key.mode === 'major') {
    const scale = Key.majorKey(key.tonic).scale;
    return { tonic: scale[5] ?? 'A', mode: 'minor' };
  }
  const third = Note.transpose(key.tonic, '3m');
  return { tonic: third, mode: 'major' };
}
