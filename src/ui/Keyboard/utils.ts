import type { ExerciseInstance } from '@/engine/types';
import { targetMidis } from '@/engine/matcher/setMatch';
export const WHITE_W = 24;
export const BLACK_W = 14;
export const BLACK_H_RATIO = 0.62;

const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
/**
 * White-key boundary after the key to the left, measured from the octave's C.
 * Each black key is centred on that boundary below in `layoutKeys`.
 */
const BLACK_BOUNDARIES: Record<number, number> = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };
/** White keys among pitch classes 0..pc-1. */
const WHITES_BELOW_PC = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6] as const;

export function isWhite(midi: number): boolean {
  return WHITE_PCS.has(((midi % 12) + 12) % 12);
}

/** Number of white keys with midi' < midi, counting from midi 0. */
function whitesBelow(midi: number): number {
  const octave = Math.floor(midi / 12);
  return octave * 7 + (WHITES_BELOW_PC[((midi % 12) + 12) % 12] ?? 0);
}

export interface KeyGeometry {
  midi: number;
  white: boolean;
  x: number;
  width: number;
}

export interface KeyboardLayout {
  keys: KeyGeometry[];
  totalWidth: number;
  /** Range possibly widened so it starts and ends on white keys. */
  lo: number;
  hi: number;
}

export function layoutKeys(rangeLo: number, rangeHi: number): KeyboardLayout {
  const lo = isWhite(rangeLo) ? rangeLo : rangeLo - 1;
  const hi = isWhite(rangeHi) ? rangeHi : rangeHi + 1;
  const base = whitesBelow(lo);
  const keys: KeyGeometry[] = [];
  for (let midi = lo; midi <= hi; midi++) {
    if (isWhite(midi)) {
      keys.push({ midi, white: true, x: (whitesBelow(midi) - base) * WHITE_W, width: WHITE_W });
    } else {
      const pc = ((midi % 12) + 12) % 12;
      const octaveC = midi - pc;
      const octaveStartX = (whitesBelow(octaveC) - base) * WHITE_W;
      const boundary = BLACK_BOUNDARIES[pc] ?? 0;
      keys.push({
        midi,
        white: false,
        x: octaveStartX + boundary * WHITE_W - BLACK_W / 2,
        width: BLACK_W,
      });
    }
  }
  const totalWidth = (whitesBelow(hi) - base + 1) * WHITE_W;
  return { keys, totalWidth, lo, hi };
}

const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

/** Display-only note name (sharp spelling); key-context spelling comes from theory/ later. */
export function displayName(midi: number): string {
  return `${SHARP_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

const LETTER_PCS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11] as const;

/** Pitch class of a tonic name like 'Eb' or 'F#'. */
export function tonicPc(tonic: string): number {
  const letter = tonic[0]?.toUpperCase() ?? 'C';
  let pc = LETTER_PCS[letter] ?? 0;
  for (const ch of tonic.slice(1)) {
    if (ch === '#' || ch === '♯') pc += 1;
    if (ch === 'b' || ch === '♭') pc -= 1;
  }
  return ((pc % 12) + 12) % 12;
}

/** Major-scale degree (1..7) of a midi note in the given key, or null if non-diatonic. */
export function majorDegreeOf(midi: number, tonic: string): number | null {
  const rel = (((midi - tonicPc(tonic)) % 12) + 12) % 12;
  const idx = MAJOR_STEPS.indexOf(rel as (typeof MAJOR_STEPS)[number]);
  return idx === -1 ? null : idx + 1;
}

export function exerciseRange(instance: ExerciseInstance | null): [number, number] {
  const notes = instance?.targets.flatMap(targetMidis) ?? [];
  return [Math.max(21, Math.min(48, ...notes)), Math.min(108, Math.max(84, ...notes))];
}
