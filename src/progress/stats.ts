import type { Take } from '@/engine/replay';
import { localDateString } from './sessionBuilder';
import type { AtomProgressRow, RatingRow } from './db';
import { ATOMS } from './atoms';
import { findThenVsNowPairs } from './badges';

export interface StreakInfo {
  /** Current streak length in days (today counts once practiced). */
  streak: number;
  /** Banked freezes remaining (earned 1 per 7 consecutive days, max 2). */
  freezes: number;
  /** Dates a freeze silently covered. */
  frozenDates: string[];
  practicedToday: boolean;
}

function addDays(date: string, n: number): string {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return localDateString(dt);
}

/**
 * Streak with rest-day freezes (07): a practiced day extends the streak; every
 * 7th consecutive day banks a freeze (max 2); a missed day spends a freeze if
 * one is banked, else resets. Today never breaks the streak while unpracticed.
 */
export function computeStreak(practiced: ReadonlySet<string>, today: string): StreakInfo {
  if (practiced.size === 0) return { streak: 0, freezes: 0, frozenDates: [], practicedToday: false };
  const first = [...practiced].sort()[0]!;
  let streak = 0;
  let freezes = 0;
  const frozenDates: string[] = [];
  for (let day = first; day <= today; day = addDays(day, 1)) {
    if (practiced.has(day)) {
      streak += 1;
      if (streak > 0 && streak % 7 === 0) freezes = Math.min(2, freezes + 1);
    } else if (day === today) {
      break; // today is still pending
    } else if (freezes > 0) {
      freezes -= 1;
      frozenDates.push(day);
    } else {
      streak = 0;
      freezes = 0;
    }
  }
  return { streak, freezes, frozenDates, practicedToday: practiced.has(today) };
}

/** Sunday-of-week key a recap is filed under (07: computed Sunday). */
export function weekEndingSunday(today: string): string {
  const [y = 0, m = 1, d = 1] = today.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0 = Sunday
  return dow === 0 ? today : addDays(today, 7 - dow);
}

export interface WeeklyRecap {
  /** The Sunday this recap covers, and its Monday..Sunday window. */
  weekEnding: string;
  from: string;
  minutes: number;
  sessions: number;
  newAtoms: string[];
  wentFluent: string[];
  ratingDeltas: { strand: string; from: number; to: number }[];
  highlight: { atomId: string; label: string; daysApart: number } | null;
  dismissed: boolean;
}

export interface RecapInputs {
  today: string;
  practiceMinutes: Readonly<Record<string, number>>;
  sessionDates: readonly string[];
  atoms: readonly AtomProgressRow[];
  ratings: readonly RatingRow[];
  takes: readonly Take[];
}

function inWindow(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

/**
 * The week's honest summary (07): what actually happened, no projections and
 * no shame — an unpractised week simply reports small numbers.
 */
export function computeRecap(input: RecapInputs): WeeklyRecap {
  const weekEnding = weekEndingSunday(input.today);
  const from = addDays(weekEnding, -6);
  const inWeek = (d: string): boolean => inWindow(d, from, weekEnding);

  const minutes = Object.entries(input.practiceMinutes)
    .filter(([d]) => inWeek(d))
    .reduce((sum, [, m]) => sum + m, 0);

  const fromMs = Date.parse(`${from}T00:00:00`);
  const toMs = Date.parse(`${weekEnding}T23:59:59`);
  const introducedThisWeek = input.atoms.filter(
    (a) => a.introducedAt >= fromMs && a.introducedAt <= toMs,
  );

  const ratingDeltas = input.ratings.flatMap((r) => {
    const before = [...r.history].reverse().find((h) => h.date < from);
    const last = [...r.history].reverse().find((h) => inWeek(h.date));
    if (!last) return [];
    return [{ strand: r.strand, from: before?.level ?? last.level, to: last.level }];
  });

  const pair = findThenVsNowPairs(input.takes.filter((t) => t.startedAt <= toMs))[0];

  return {
    weekEnding,
    from,
    minutes,
    sessions: input.sessionDates.filter(inWeek).length,
    newAtoms: introducedThisWeek.map((a) => a.atomId),
    wentFluent: input.atoms
      .filter((a) => a.fluent && a.lastSeenAt >= fromMs && a.lastSeenAt <= toMs)
      .map((a) => ATOMS.get(a.atomId)?.label ?? a.atomId),
    ratingDeltas,
    highlight: pair ? { atomId: pair.atomId, label: pair.label, daysApart: pair.daysApart } : null,
    dismissed: false,
  };
}

/** Mon..Sun of the week containing `today` with practice flags (Today header dots). */
export function weekDots(practiced: ReadonlySet<string>, today: string): { date: string; done: boolean }[] {
  const [y = 0, m = 1, d = 1] = today.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const monOffset = (dt.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - monOffset);
    return { date, done: practiced.has(date) };
  });
}
