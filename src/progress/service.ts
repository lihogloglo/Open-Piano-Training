import type { Unit } from '@/curriculum/schema';
import { getUnitProgressMap, markUnitPassed, db, type AtomProgressRow } from './db';
import { ATOMS, READ_STRAND_ATOMS } from './atoms';
import { isFluent, newCard, reviewCard, type StoredCard } from './fsrs';
import {
  buildSession,
  buildWorkout,
  localDateString,
  type AtomState,
  type SessionPlan,
} from './sessionBuilder';
import { nextUnit } from '@/curriculum/path';
import { STAGES, getUnit } from '@/curriculum/content';
import { earnedBadges, newlyEarned, type BadgeDef, type BadgeInputs } from './badges';
import { computeRecap, weekEndingSunday, type WeeklyRecap } from './stats';

/**
 * Start tracking a unit's concept atoms. Idempotent per atom, so it is safe to
 * call for a unit that is already passed — which keeps the invariant "a passed
 * unit's atoms are tracked" true no matter which route marked it passed.
 */
async function trackAtoms(unit: Unit, score: number, flagged: boolean): Promise<void> {
  const now = new Date();
  for (const atomId of unit.concepts) {
    if (!ATOMS.has(atomId)) continue;
    const existing = await db.atomProgress.get(atomId);
    if (existing) continue;
    // Flagged units schedule their atoms as struggling from the start.
    const card = flagged ? reviewCard(newCard(now), 0.5, now) : newCard(now);
    await db.atomProgress.put({
      atomId,
      fsrs: card,
      introducedAt: now.getTime(),
      lastSeenAt: now.getTime(),
      bestScore: flagged ? 0 : score,
      attempts: 1,
      fluent: false,
    });
  }
}

/** Unit passed: persist status and start tracking its concept atoms. */
export async function completeUnit(unit: Unit, score: number, flagged: boolean): Promise<void> {
  await markUnitPassed(unit.id, score, flagged);
  await trackAtoms(unit, score, flagged);
  // Checkpoint pass ⇒ the whole stage counts as passed (placement path) and
  // the next stage unlocks via the checkpoint prerequisite chain (07 §Gates).
  if (unit.kind === 'checkpoint') {
    const stage = STAGES.find((s) => s.id === unit.stageId);
    for (const unitId of stage?.unitIds ?? []) {
      if (unitId === unit.id) continue;
      const stageUnit = getUnit(unitId);
      if (!stageUnit) continue;
      const existing = await db.unitProgress.get(unitId);
      if (existing?.status === 'passed') {
        // Keep its real score, but make sure its atoms are on the schedule.
        await trackAtoms(stageUnit, existing.bestScore, existing.flagged ?? false);
        continue;
      }
      await completeUnit(stageUnit, score, false);
    }
  }
}

/** A review/warmup drill finished: grade the atom's card. */
export async function gradeAtom(atomId: string, score: number, now = new Date()): Promise<void> {
  const row = await db.atomProgress.get(atomId);
  if (!row) return;
  const card = reviewCard(row.fsrs as StoredCard, score, now);
  const bestScore = Math.max(row.bestScore, score);
  await db.atomProgress.put({
    ...row,
    fsrs: card,
    lastSeenAt: now.getTime(),
    bestScore,
    attempts: row.attempts + 1,
    fluent: isFluent(card, bestScore),
  });
}

export async function loadAtomStates(): Promise<AtomState[]> {
  const rows = await db.atomProgress.toArray();
  return rows.map((r: AtomProgressRow) => ({
    atomId: r.atomId,
    fsrs: r.fsrs as StoredCard,
    bestScore: r.bestScore,
    fluent: r.fluent,
  }));
}

/** Read-only view of today's plan (safe inside Dexie liveQuery). */
export async function readTodaySession(now = new Date()): Promise<SessionPlan | null> {
  const stored = await db.sessions.get(`session-${localDateString(now)}`);
  return stored ? (stored.plan as SessionPlan) : null;
}

/** Today's session: load the stored plan or build (and persist) a fresh one. NOT liveQuery-safe. */
export async function getTodaySession(now = new Date()): Promise<SessionPlan> {
  const date = localDateString(now);
  const stored = await db.sessions.get(`session-${date}`);
  if (stored) return stored.plan as SessionPlan;

  const progress = await getUnitProgressMap();
  const next = nextUnit(progress);
  const stageOrdinal = next ? (STAGES.find((s) => s.id === next.stageId)?.ordinal ?? 0) : STAGES.length;
  const settingsRow = localStorage.getItem('ks.settings.v1');
  const dailyMinutes = settingsRow
    ? ((JSON.parse(settingsRow) as { dailyMinutes?: number }).dailyMinutes ?? 20)
    : 20;
  const plan = buildSession({
    date,
    dailyMinutes,
    next,
    stageOrdinal,
    atomStates: await loadAtomStates(),
    now,
  });
  await db.sessions.put({ id: plan.id, date, plan, state: 'fresh' });
  return plan;
}

export async function startWorkout(now = new Date()): Promise<SessionPlan> {
  const plan = buildWorkout({ date: localDateString(now), atomStates: await loadAtomStates(), now });
  await db.sessions.put({ id: plan.id, date: plan.date, plan, state: 'fresh' });
  return plan;
}

export async function getSession(sessionId: string): Promise<SessionPlan | null> {
  const row = await db.sessions.get(sessionId);
  return row ? (row.plan as SessionPlan) : null;
}

export async function markBlockComplete(sessionId: string, blockIdx: number, minutes: number): Promise<void> {
  const row = await db.sessions.get(sessionId);
  if (!row) return;
  const plan = row.plan as SessionPlan;
  if (!plan.completedBlocks.includes(blockIdx)) plan.completedBlocks.push(blockIdx);
  const state = plan.completedBlocks.length >= plan.blocks.length ? 'done' : 'partial';
  await db.sessions.put({ ...row, plan, state });
  await addPracticeMinutes(plan.date, minutes);
  // Refresh the plan's unit pointer: a completed 'new' block may unlock the next unit
  // tomorrow; today's plan stays as-is by design.
}

export async function addPracticeMinutes(date: string, minutes: number): Promise<void> {
  const row = await db.meta.get('practiceDays');
  const days = (row?.value as Record<string, number> | undefined) ?? {};
  days[date] = (days[date] ?? 0) + minutes;
  await db.meta.put({ key: 'practiceDays', value: days });
}

/** Dates with ≥5 practiced minutes (the streak threshold in 07). */
export async function getPracticedDates(): Promise<Set<string>> {
  const row = await db.meta.get('practiceDays');
  const days = (row?.value as Record<string, number> | undefined) ?? {};
  return new Set(
    Object.entries(days)
      .filter(([, mins]) => mins >= 5)
      .map(([d]) => d),
  );
}

/** Resolve the unit for a 'new' block (content may have shifted between builds). */
export function resolveUnit(unitId: string): Unit | undefined {
  return getUnit(unitId);
}

/**
 * Turning the notation strand on starts tracking its atoms; turning it off
 * stops scheduling them. Progress already made is kept, so toggling back on
 * does not reset anyone — it only removes them from the review queue.
 */
export async function syncReadStrand(enabled: boolean): Promise<void> {
  if (!enabled) {
    await db.atomProgress.where('atomId').startsWith('read:staff:').delete();
    return;
  }
  const now = new Date();
  for (const atomId of READ_STRAND_ATOMS) {
    if (await db.atomProgress.get(atomId)) continue;
    await db.atomProgress.put({
      atomId,
      fsrs: newCard(now),
      introducedAt: now.getTime(),
      lastSeenAt: now.getTime(),
      bestScore: 0,
      attempts: 0,
      fluent: false,
    });
  }
}

// ── badges & recap ─────────────────────────────────────────────────────────

const BADGE_SNAPSHOT_KEY = 'badgesSeen';
const THEN_VS_NOW_KEY = 'viewedThenVsNow';
const RECAP_KEY = 'weeklyRecap';

async function badgeInputs(): Promise<BadgeInputs> {
  const [takes, units, atoms, sessionCount, viewed] = await Promise.all([
    db.takes.toArray(),
    db.unitProgress.toArray(),
    db.atomProgress.toArray(),
    db.sessions.count(),
    db.meta.get(THEN_VS_NOW_KEY),
  ]);
  const settingsRow = localStorage.getItem('ks.settings.v1');
  const onboarded = settingsRow
    ? ((JSON.parse(settingsRow) as { onboarded?: boolean }).onboarded ?? false)
    : false;
  return { takes, units, atoms, sessionCount, onboarded, viewedThenVsNow: viewed?.value === true };
}

export async function loadBadges(): Promise<Set<string>> {
  return earnedBadges(await badgeInputs());
}

/**
 * Recompute badges and return the ones earned since the last check, so the
 * caller can toast them. Badges themselves stay derived — only the "already
 * celebrated" snapshot is stored.
 */
export async function refreshBadges(): Promise<BadgeDef[]> {
  const earned = await loadBadges();
  const seenRow = await db.meta.get(BADGE_SNAPSHOT_KEY);
  const seen = new Set((seenRow?.value as string[] | undefined) ?? []);
  const fresh = newlyEarned(seen, earned);
  if (fresh.length > 0) await db.meta.put({ key: BADGE_SNAPSHOT_KEY, value: [...earned] });
  else if (!seenRow) await db.meta.put({ key: BADGE_SNAPSHOT_KEY, value: [...earned] });
  return fresh;
}

export async function markThenVsNowViewed(): Promise<void> {
  await db.meta.put({ key: THEN_VS_NOW_KEY, value: true });
}

/**
 * Read-only view of the stored recap (safe inside liveQuery). Returns null
 * until `getRecap` has computed this week's — same split as sessions.
 */
export async function readRecap(now = new Date()): Promise<WeeklyRecap | null> {
  const stored = (await db.meta.get(RECAP_KEY))?.value as WeeklyRecap | undefined;
  const weekEnding = weekEndingSunday(localDateString(now));
  return stored?.weekEnding === weekEnding ? stored : null;
}

/** This week's recap card, computed once per week and cached in `meta`. NOT liveQuery-safe. */
export async function getRecap(now = new Date()): Promise<WeeklyRecap> {
  const today = localDateString(now);
  const weekEnding = weekEndingSunday(today);
  const stored = (await db.meta.get(RECAP_KEY))?.value as WeeklyRecap | undefined;
  if (stored?.weekEnding === weekEnding) return stored;

  const [minutesRow, sessions, atoms, ratings, takes] = await Promise.all([
    db.meta.get('practiceDays'),
    db.sessions.toArray(),
    db.atomProgress.toArray(),
    db.ratings.toArray(),
    db.takes.toArray(),
  ]);
  const recap = computeRecap({
    today,
    practiceMinutes: (minutesRow?.value as Record<string, number> | undefined) ?? {},
    sessionDates: sessions.map((s) => s.date),
    atoms,
    ratings,
    takes,
  });
  await db.meta.put({ key: RECAP_KEY, value: recap });
  return recap;
}

export async function dismissRecap(): Promise<void> {
  const stored = (await db.meta.get(RECAP_KEY))?.value as WeeklyRecap | undefined;
  if (stored) await db.meta.put({ key: RECAP_KEY, value: { ...stored, dismissed: true } });
}
