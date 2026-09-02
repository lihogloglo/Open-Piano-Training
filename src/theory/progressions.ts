import { keyScaleNotes, type KeyContext } from './keys';
import type { ChordQuality } from './chords';

export interface RomanChord {
  roman: string;
  degree: number; // 1..7
  root: string;
  quality: ChordQuality;
}

const ROMAN_DEGREES: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
};

/**
 * Parse a roman-numeral chord in a key. Supports triads by case (I / ii),
 * ° for diminished, and 7th suffixes: V7, ii7, Imaj7, viiø7 / vii°7.
 */
export function parseRoman(roman: string, key: KeyContext): RomanChord {
  const m = /^(b|#)?([ivIV]+)(°|ø|o)?(maj7|7)?$/.exec(roman.trim());
  if (!m) throw new Error(`Unparseable roman numeral: ${roman}`);
  const [, accidental, numeral, dim, seventh] = m;
  const lower = (numeral ?? '').toLowerCase();
  const degree = ROMAN_DEGREES[lower];
  if (!degree) throw new Error(`Unknown roman numeral: ${roman}`);
  const isMinorCase = numeral === lower;

  const scale = keyScaleNotes(key);
  let root = scale[degree - 1] ?? key.tonic;
  if (accidental === 'b') root = `${root}b`;
  if (accidental === '#') root = `${root}#`;

  let quality: ChordQuality;
  if (dim === 'ø') quality = 'm7b5';
  else if (dim) quality = seventh ? 'dim7' : 'dim';
  else if (seventh === 'maj7') quality = 'maj7';
  else if (seventh === '7') quality = isMinorCase ? 'm7' : '7';
  else quality = isMinorCase ? 'min' : 'maj';
  // Major-case + maj7 on I/IV reads Imaj7; major-case + 7 is a dominant (V7, or secondary).
  if (!isMinorCase && !dim && !seventh) quality = 'maj';
  return { roman, degree, root, quality };
}

export function progressionChords(romans: readonly string[], key: KeyContext): RomanChord[] {
  return romans.map((r) => parseRoman(r, key));
}

export interface NamedProgression {
  id: string;
  name: string;
  romans: string[];
  mode: 'major' | 'minor';
}

/** The catalog the curriculum draws from (see 06-curriculum-content). */
export const PROGRESSION_CATALOG: NamedProgression[] = [
  { id: 'i-iv-v', name: 'The three chords', romans: ['I', 'IV', 'V'], mode: 'major' },
  { id: 'i-v-vi-iv', name: 'The Axis', romans: ['I', 'V', 'vi', 'IV'], mode: 'major' },
  { id: 'i-vi-iv-v', name: 'The 50s', romans: ['I', 'vi', 'IV', 'V'], mode: 'major' },
  { id: 'vi-iv-i-v', name: 'Axis, rotated', romans: ['vi', 'IV', 'I', 'V'], mode: 'major' },
  { id: 'i-ii-v', name: 'Two-five turnaround', romans: ['I', 'ii', 'V'], mode: 'major' },
  { id: 'ii-v-i', name: 'ii–V–I', romans: ['ii7', 'V7', 'Imaj7'], mode: 'major' },
  { id: 'i-iii-iv-v', name: 'Climbing ballad', romans: ['I', 'iii', 'IV', 'V'], mode: 'major' },
  { id: 'min-i-vi-iii-vii', name: 'Minor anthem', romans: ['i', 'VI', 'III', 'VII'], mode: 'minor' },
  { id: 'min-i-iv-v', name: 'Minor three chords', romans: ['i', 'iv', 'v'], mode: 'minor' },
];
