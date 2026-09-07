import type { ExerciseDef } from '@/engine/types';
import { createRng } from '@/engine/rng';
import { ATOMS, type SkillAtom } from './atoms';
import { db, type RatingRow } from './db';
import { localDateString } from './sessionBuilder';
import { isTourist } from './tourist';

/**
 * The SASR-style rating ladder (07 §Ratings).
 *
 * A rating proves what the path has already taught: challenges draw ONLY from
 * tracked atoms, so a level can never outrun the curriculum. `read` arrives
 * with the notation strand; `create` is never numerically rated (07 invariant).
 */
export type RatingStrand = 'keys' | 'theory' | 'ear' | 'read';

/** Always-on strands. `create` is never numerically rated (07 invariant 3). */
export const RATED_STRANDS: readonly RatingStrand[] = ['keys', 'theory', 'ear'];

/** The optional notation strand, shown only when the learner opts in (08). */
export const READ_STRAND: RatingStrand = 'read';

export function ratedStrands(readEnabled: boolean): readonly RatingStrand[] {
  return readEnabled ? [...RATED_STRANDS, READ_STRAND] : RATED_STRANDS;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 99;
/** Items per challenge (07). */
export const CHALLENGE_ITEMS = 10;
/** An item passes at score ≥ 0.8. */
export const ITEM_PASS_SCORE = 0.8;
/** Difficulty band around the level: d ∈ [level−5, level+5]. */
export const BAND = 5;
/** A band needs this many distinct atoms to be a usable challenge level. */
const MIN_BAND_ATOMS = 2;
/** Today suggests a challenge per strand at most this often. */
export const CHALLENGE_COOLDOWN_DAYS = 7;

export const STRAND_LABEL: Record<RatingStrand, string> = {
  keys: 'Keys',
  theory: 'Theory',
  ear: 'Ear',
  read: 'Read',
};

/** Label for a strand id that may come from stored data (recap rows, exports). */
export function strandLabel(strand: string): string {
  return STRAND_LABEL[strand as RatingStrand] ?? strand;
}

/** Display number reads like an ELO: level 34 shows as 340. */
export function levelDisplay(level: number): number {
  return level * 10;
}

/** Atoms a challenge may draw from: this strand, tracked, and actually playable. */
export function eligibleAtoms(strand: RatingStrand, tracked: ReadonlySet<string>): SkillAtom[] {
  const out: SkillAtom[] = [];
  for (const atom of ATOMS.values()) {
    if (atom.strand === strand && atom.drill !== null && tracked.has(atom.id)) out.push(atom);
  }
  return out.sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
}

/** The atoms sitting inside `level`'s difficulty band. */
export function bandAtoms(strand: RatingStrand, level: number, tracked: ReadonlySet<string>): SkillAtom[] {
  return eligibleAtoms(strand, tracked).filter(
    (a) => a.difficulty >= level - BAND && a.difficulty <= level + BAND,
  );
}

/**
 * The levels a challenge can actually be built at, given what's been taught.
 * `null` when the strand has too little tracked material to challenge at all.
 */
export function supportedLevelRange(
  strand: RatingStrand,
  tracked: ReadonlySet<string>,
): { min: number; max: number } | null {
  const atoms = eligibleAtoms(strand, tracked);
  if (atoms.length < MIN_BAND_ATOMS) return null;
  let min = -1;
  let max = -1;
  for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
    const count = atoms.filter((a) => a.difficulty >= level - BAND && a.difficulty <= level + BAND).length;
    if (count >= MIN_BAND_ATOMS) {
      if (min === -1) min = level;
      max = level;
    }
  }
  return min === -1 ? null : { min, max };
}

/** Clamp a level into the supported range (the ceiling is "what the path taught"). */
export function clampLevel(level: number, strand: RatingStrand, tracked: ReadonlySet<string>): number {
  const range = supportedLevelRange(strand, tracked);
  if (!range) return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.round(level)));
  return Math.max(range.min, Math.min(range.max, Math.round(level)));
}

/** A fresh learner enters at the bottom of what they can actually be tested on. */
export function initialLevel(strand: RatingStrand, tracked: ReadonlySet<string>): number {
  return supportedLevelRange(strand, tracked)?.min ?? MIN_LEVEL;
}

export interface ChallengeItem {
  atomId: string;
  label: string;
  def: ExerciseDef;
}

/**
 * Ten fresh items at the level's band. Atoms are drawn round-robin from a
 * shuffled band so a small band still yields a varied, repeat-free-ish run.
 */
export function buildChallenge(
  strand: RatingStrand,
  level: number,
  tracked: ReadonlySet<string>,
  seed: number,
): ChallengeItem[] {
  const pool = bandAtoms(strand, level, tracked);
  if (pool.length === 0) return [];
  const rng = createRng(seed);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const a = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = a;
  }
  return Array.from({ length: CHALLENGE_ITEMS }, (_, i) => {
    const atom = shuffled[i % shuffled.length]!;
    return {
      atomId: atom.id,
      label: atom.label,
      // Always fresh material: challenges never reuse a fixed seed.
      def: { ...atom.drill!, seedPolicy: 'random' as const },
    };
  });
}

export type ChallengeVerdict = 'up' | 'hold' | 'down';

export interface ChallengeOutcome {
  strand: RatingStrand;
  before: number;
  after: number;
  delta: number;
  passedCount: number;
  total: number;
  verdict: ChallengeVerdict;
}

/** The ladder step (07): ≥8 → +2 · 6–7 → +1 · 4–5 → hold · ≤3 → −1. */
export function levelDelta(passedCount: number): number {
  if (passedCount >= 8) return 2;
  if (passedCount >= 6) return 1;
  if (passedCount >= 4) return 0;
  return -1;
}

export function applyChallengeResult(
  strand: RatingStrand,
  before: number,
  passedCount: number,
  tracked: ReadonlySet<string>,
): ChallengeOutcome {
  const delta = levelDelta(passedCount);
  const after = clampLevel(before + delta, strand, tracked);
  const realDelta = after - before;
  return {
    strand,
    before,
    after,
    delta: realDelta,
    passedCount,
    total: CHALLENGE_ITEMS,
    verdict: realDelta > 0 ? 'up' : realDelta < 0 ? 'down' : 'hold',
  };
}

/** Whether an item's take counts as a pass. */
export function itemPassed(score: number): boolean {
  return score >= ITEM_PASS_SCORE;
}

// ── persistence ────────────────────────────────────────────────────────────

export async function loadRatings(): Promise<Map<string, RatingRow>> {
  const rows = await db.ratings.toArray();
  return new Map(rows.map((r) => [r.strand, r]));
}

export async function getLevel(strand: RatingStrand, tracked: ReadonlySet<string>): Promise<number> {
  const row = await db.ratings.get(strand);
  return row ? clampLevel(row.level, strand, tracked) : initialLevel(strand, tracked);
}

/** Persist a finished challenge: new level + a history point for the sparkline. */
export async function recordChallenge(
  strand: RatingStrand,
  passedCount: number,
  tracked: ReadonlySet<string>,
  now = new Date(),
): Promise<ChallengeOutcome> {
  const existing = await db.ratings.get(strand);
  const before = existing ? clampLevel(existing.level, strand, tracked) : initialLevel(strand, tracked);
  const outcome = applyChallengeResult(strand, before, passedCount, tracked);
  const date = localDateString(now);
  // A tourist still sees the result screen. The level just does not move.
  if (!isTourist())
    await db.ratings.put({
      strand,
      level: outcome.after,
      history: [...(existing?.history ?? []), { date, level: outcome.after }].slice(-52),
    });
  return outcome;
}

function daysBetween(a: string, b: string): number {
  const [ay = 0, am = 1, ad = 1] = a.split('-').map(Number);
  const [by = 0, bm = 1, bd = 1] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/**
 * Strands worth suggesting on Today: challengeable, and not challenged within
 * the cooldown. Never required — the suggestion is an invitation (07).
 */
export function suggestedStrands(
  ratings: ReadonlyMap<string, RatingRow>,
  today: string,
  trackedByStrand: (strand: RatingStrand) => ReadonlySet<string>,
): RatingStrand[] {
  const strands = [...RATED_STRANDS, READ_STRAND];
  return strands.filter((strand) => {
    if (!supportedLevelRange(strand, trackedByStrand(strand))) return false;
    const last = ratings.get(strand)?.history.at(-1);
    return !last || daysBetween(last.date, today) >= CHALLENGE_COOLDOWN_DAYS;
  });
}
