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
  sections: { name: string; bars: Bar[] }[];
  /** Roman numeral per bar (flattened over sections) for free transposition. */
  romanized: string[];
  /** Earliest stage it appears in. */
  stage: number;
}

/** Catalog fills in from Phase 5 (06-curriculum-content lists the set). */
export const SONGS: Song[] = [];

export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}
