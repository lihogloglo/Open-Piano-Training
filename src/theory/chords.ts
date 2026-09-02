import { namePc, pcOf, type MidiNumber } from './notes';

export type ChordQuality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'maj7'
  | 'm7'
  | '7'
  | 'm7b5'
  | 'dim7'
  | 'sus2'
  | 'sus4'
  | '6'
  | 'm6'
  | 'add9';

export type Inversion = 0 | 1 | 2 | 3;

export const QUALITY_INTERVALS: Record<ChordQuality, readonly number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  '7': [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14],
};

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  maj7: 'maj7',
  m7: 'm7',
  '7': '7',
  m7b5: 'm7♭5',
  dim7: 'dim7',
  sus2: 'sus2',
  sus4: 'sus4',
  '6': '6',
  m6: 'm6',
  add9: 'add9',
};

/** 'Eb' + 'm7' → 'E♭m7' (display glyphs). */
export function chordSymbol(root: string, quality: ChordQuality): string {
  const displayRoot = root.replace(/#/g, '♯').replace(/(?<=.)b/g, '♭');
  return `${displayRoot}${QUALITY_SUFFIX[quality]}`;
}

export interface ChordSpec {
  root: string;
  quality: ChordQuality;
  inversion: Inversion;
}

/**
 * Concrete voicing: close position, the given inversion, bass placed at or
 * above `minBassMidi` (default 48 = C3).
 */
export function buildChord(spec: ChordSpec, minBassMidi: MidiNumber = 48): MidiNumber[] {
  const rootPc = namePc(spec.root);
  if (rootPc === null) throw new Error(`Bad chord root: ${spec.root}`);
  const intervals = QUALITY_INTERVALS[spec.quality];
  const inv = Math.min(spec.inversion, intervals.length - 1);
  // Rotate: bottom note becomes the inversion-th chord member.
  const rotated = [...intervals.slice(inv), ...intervals.slice(0, inv).map((i) => i + 12)];
  const bassOffset = rotated[0] ?? 0;
  const bassPcTarget = (rootPc + bassOffset) % 12;
  let bass = minBassMidi;
  while (pcOf(bass) !== bassPcTarget) bass++;
  return rotated.map((i) => bass + (i - bassOffset));
}

/** Pitch classes of the chord (root position), as a sorted unique array. */
export function chordPcs(root: string, quality: ChordQuality): number[] {
  const rootPc = namePc(root);
  if (rootPc === null) throw new Error(`Bad chord root: ${root}`);
  return [...new Set(QUALITY_INTERVALS[quality].map((i) => (rootPc + i) % 12))].sort((a, b) => a - b);
}

/** The pitch class expected in the bass for a given inversion. */
export function bassPcForInversion(root: string, quality: ChordQuality, inversion: Inversion): number {
  const rootPc = namePc(root);
  if (rootPc === null) throw new Error(`Bad chord root: ${root}`);
  const intervals = QUALITY_INTERVALS[quality];
  const member = intervals[Math.min(inversion, intervals.length - 1)] ?? 0;
  return (rootPc + member) % 12;
}

/**
 * Does the played set of midi notes sound this chord in this inversion?
 * Any octave arrangement passes as long as the pitch-class set matches exactly
 * and the lowest played note carries the inversion's bass pitch class.
 */
export function matchesChordInversion(
  played: readonly MidiNumber[],
  root: string,
  quality: ChordQuality,
  inversion: Inversion,
): boolean {
  if (played.length === 0) return false;
  const playedPcs = [...new Set(played.map(pcOf))].sort((a, b) => a - b);
  const wanted = chordPcs(root, quality);
  if (playedPcs.length !== wanted.length || !playedPcs.every((pc, i) => pc === wanted[i])) return false;
  const bass = Math.min(...played);
  return pcOf(bass) === bassPcForInversion(root, quality, inversion);
}

export interface DetectedChord {
  root: string;
  quality: ChordQuality;
  inversion: Inversion;
  symbol: string;
}

/**
 * Inversion-aware detection over our quality dictionary. Deterministic and
 * dependency-free (tonal's Chord.detect returns names our engine would have to
 * re-parse; matching against our own dictionary keeps engine and UI agreed).
 */
export function detectChord(played: readonly MidiNumber[]): DetectedChord | null {
  if (played.length < 3) return null;
  const playedPcs = [...new Set(played.map(pcOf))].sort((a, b) => a - b);
  const bassPc = pcOf(Math.min(...played));
  const PC_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  // Prefer a root-position reading (bass = root), then simpler qualities.
  const rootCandidates = [bassPc, ...playedPcs.filter((pc) => pc !== bassPc)];
  for (const rootPc of rootCandidates) {
    for (const quality of Object.keys(QUALITY_INTERVALS) as ChordQuality[]) {
      const root = PC_NAMES[rootPc] ?? 'C';
      const wanted = chordPcs(root, quality);
      if (wanted.length !== playedPcs.length || !wanted.every((pc, i) => pc === playedPcs[i])) continue;
      const intervals = QUALITY_INTERVALS[quality];
      const memberIdx = intervals.findIndex((iv) => (rootPc + iv) % 12 === bassPc);
      if (memberIdx === -1) continue;
      return {
        root,
        quality,
        inversion: Math.min(memberIdx, 3) as Inversion,
        symbol: chordSymbol(root, quality),
      };
    }
  }
  return null;
}
