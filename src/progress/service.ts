import type { Unit } from '@/curriculum/schema';
import { getUnitProgressMap, markUnitPassed, db, type AtomProgressRow } from './db';
import { ATOMS } from './atoms';
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

/** Unit passed: persist status and start tracking its concept atoms. */
export async function completeUnit(unit: Unit, score: number, flagged: boolean): Promise<void> {
  await markUnitPassed(unit.id, score, flagged);
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
