import type { Take } from '@/engine/replay';
import type { AtomProgressRow, UnitProgressRow } from './db';
import { ATOMS } from './atoms';

/**
 * Badges (07 §Streaks, badges, recap). Every criterion is a pure function of
 * data already in Dexie — badges add no state of their own, so importing a
 * backup restores the wall exactly.
 */
export interface BadgeDef {
  id: string;
  title: string;
  /** Shown on the wall, earned or not — it's a goal, not a spoiler. */
  criterion: string;
}

export const BADGES: readonly BadgeDef[] = [
  { id: 'first-note', title: 'First note', criterion: 'Finish setup and play your first note' },
  { id: 'first-song', title: 'First song', criterion: 'Pass any song chart' },
  { id: 'spelling-bee', title: 'Spelling bee', criterion: 'Land 20 chord grips in under 3 seconds each' },
  { id: 'circle-complete', title: 'Circle complete', criterion: 'Reach all 12 key signatures' },
  { id: 'smooth-operator', title: 'Smooth operator', criterion: 'Three stars on a voice-led progression' },
  { id: 'all-twelve', title: 'All twelve', criterion: 'Pass ii-V-I in all 12 keys' },
  { id: 'chart-slayer', title: 'Chart slayer', criterion: 'Pass an unseen chart on the first try' },
  { id: 'bluesman', title: 'Bluesman', criterion: 'Pass the blues form' },
  { id: 'by-ear', title: 'By ear', criterion: 'Transcribe a song by ear' },
  { id: 'deep-groove', title: 'Deep groove', criterion: 'Make a comping pattern fluent' },
  { id: 'centurion', title: 'Centurion', criterion: 'Practise 100 sessions' },
  { id: 'then-vs-now', title: 'Then vs now', criterion: 'Compare a take with one from a month earlier' },
];

export const BADGE_BY_ID: ReadonlyMap<string, BadgeDef> = new Map(BADGES.map((b) => [b.id, b]));

export interface BadgeInputs {
  takes: readonly Take[];
  units: readonly UnitProgressRow[];
  atoms: readonly AtomProgressRow[];
  sessionCount: number;
  onboarded: boolean;
  /** Set by the Progress screen the first time a then-vs-now pair is opened. */
  viewedThenVsNow: boolean;
}

/** Grip cards answered in under 3s, counted across every spelling-style take. */
const FAST_GRIP_MS = 3000;

function fastGripCount(takes: readonly Take[]): number {
  let n = 0;
  for (const take of takes) {
    const gen = take.exercise.generator;
    if (gen !== 'flashcard' && gen !== 'chord-grip' && gen !== 'grip-interleave') continue;
    if (!take.result.passed) continue;
    // Judgments are ordered; a target's span is the gap between first hits.
    const firsts = new Map<number, number>();
    for (const j of take.result.judgments) {
      if (j.targetIndex < 0 || j.deltaMs === null) continue;
      if (!firsts.has(j.targetIndex)) firsts.set(j.targetIndex, j.deltaMs);
    }
    const stamps = [...firsts.entries()].sort((a, b) => a[0] - b[0]).map(([, ms]) => ms);
    for (let i = 1; i < stamps.length; i++) {
      if (stamps[i]! - stamps[i - 1]! <= FAST_GRIP_MS) n += 1;
    }
    // Wait-mode grips carry no timing; credit a passed take by its target count.
    if (stamps.length === 0 && take.bpm === null) n += take.result.judgments.length > 0 ? 1 : 0;
  }
  return n;
}

function passedUnit(units: readonly UnitProgressRow[], unitId: string): boolean {
  return units.some((u) => u.unitId === unitId && u.status === 'passed');
}

function passedTakeFor(takes: readonly Take[], pred: (t: Take) => boolean): boolean {
  return takes.some((t) => t.result.passed && pred(t));
}

/** The set of badge ids earned by the current database state. */
export function earnedBadges(input: BadgeInputs): Set<string> {
  const earned = new Set<string>();
  const { takes, units, atoms, sessionCount } = input;

  if (input.onboarded && takes.length > 0) earned.add('first-note');
  if (passedTakeFor(takes, (t) => t.exercise.generator === 'chart-play')) earned.add('first-song');
  if (fastGripCount(takes) >= 20) earned.add('spelling-bee');

  const keysigTracked = atoms.filter((a) => a.atomId.startsWith('keysig:')).length;
  if (keysigTracked >= 12) earned.add('circle-complete');

  if (passedTakeFor(takes, (t) => t.result.stars === 3 && t.exercise.params['voiceLead'] === 'smooth')) {
    earned.add('smooth-operator');
  }

  if (atoms.some((a) => a.atomId === 'prog:ii-v-i:all' && a.bestScore >= 0.8)) earned.add('all-twelve');

  if (
    passedTakeFor(
      takes,
      (t) => t.exercise.generator === 'unseen-chart' && t.result.passed && t.result.stars >= 2,
    )
  ) {
    earned.add('chart-slayer');
  }

  if (passedUnit(units, 's7.u4')) earned.add('bluesman');
  if (passedUnit(units, 's7.u7')) earned.add('by-ear');

  if (atoms.some((a) => a.atomId.startsWith('comp:') && a.fluent)) earned.add('deep-groove');
  if (sessionCount >= 100) earned.add('centurion');
  if (input.viewedThenVsNow) earned.add('then-vs-now');

  return earned;
}

/** Badges newly earned since a previous snapshot (drives the toast). */
export function newlyEarned(before: ReadonlySet<string>, after: ReadonlySet<string>): BadgeDef[] {
  return BADGES.filter((b) => after.has(b.id) && !before.has(b.id));
}

// ── then vs now ────────────────────────────────────────────────────────────

export const THEN_VS_NOW_MIN_DAYS = 28;

export interface ReplayPair {
  atomId: string;
  label: string;
  then: Take;
  now: Take;
  daysApart: number;
}

/**
 * The "look what you couldn't do" pairing: the same atom, takes at least four
 * weeks apart, oldest against newest. One pair per atom, best gap first.
 */
export function findThenVsNowPairs(takes: readonly Take[]): ReplayPair[] {
  const byAtom = new Map<string, Take[]>();
  for (const take of takes) {
    for (const atomId of take.atomIds) {
      const list = byAtom.get(atomId);
      if (list) list.push(take);
      else byAtom.set(atomId, [take]);
    }
  }
  const pairs: ReplayPair[] = [];
  for (const [atomId, list] of byAtom) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.startedAt - b.startedAt);
    const then = sorted[0]!;
    const now = sorted[sorted.length - 1]!;
    const daysApart = Math.floor((now.startedAt - then.startedAt) / 86_400_000);
    if (daysApart < THEN_VS_NOW_MIN_DAYS) continue;
    pairs.push({ atomId, label: ATOMS.get(atomId)?.label ?? atomId, then, now, daysApart });
  }
  return pairs.sort((a, b) => b.daysApart - a.daysApart);
}
