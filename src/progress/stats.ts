import { localDateString } from './sessionBuilder';

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
