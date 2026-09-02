import type { KeyContext } from '@/theory/keys';

export interface Bar {
  chords: { symbol: string; beats: number }[];
}

export interface Song {
  id: string;
  title: string;
  /** Genre/era description, never a real artist's song. */
  styleRef: string;
  key: KeyContext;
  bpm: number;
  timeSig: [number, number];
  sections: { name: string; bars: number }[];
  /** Roman numeral per bar (flattened over sections) — makes transposition free. */
  romanized: string[];
  /** Earliest stage it appears in. */
  stage: number;
}

export const SONGS: Song[] = [
  {
    id: 'first-light',
    title: 'First Light',
    styleRef: 'Warm four-chord pop, the kind that opens a festival set',
    key: { tonic: 'C', mode: 'major' },
    bpm: 72,
    timeSig: [4, 4],
    sections: [
      { name: 'Verse', bars: 8 },
      { name: 'Chorus', bars: 8 },
    ],
    romanized: [
      // Verse: home and back, twice
      'I',
      'V',
      'vi',
      'IV',
      'I',
      'V',
      'vi',
      'IV',
      // Chorus: the 50s turn
      'I',
      'vi',
      'IV',
      'V',
      'I',
      'vi',
      'IV',
      'V',
    ],
    stage: 1,
  },
  {
    id: 'northline',
    title: 'Northline',
    styleRef: 'Slow-burn piano ballad with a climbing middle',
    key: { tonic: 'G', mode: 'major' },
    bpm: 66,
    timeSig: [4, 4],
    sections: [
      { name: 'Verse', bars: 8 },
      { name: 'Lift', bars: 4 },
    ],
    romanized: ['I', 'iii', 'IV', 'V', 'I', 'iii', 'IV', 'V', 'vi', 'IV', 'I', 'V'],
    stage: 3,
  },
  {
    id: 'paper-sun',
    title: 'Paper Sun',
    styleRef: 'Breezy soul-pop with a turnaround',
    key: { tonic: 'F', mode: 'major' },
    bpm: 84,
    timeSig: [4, 4],
    sections: [{ name: 'Groove', bars: 8 }],
    romanized: ['I', 'vi', 'ii', 'V', 'I', 'vi', 'ii', 'V'],
    stage: 3,
  },
];

export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}
