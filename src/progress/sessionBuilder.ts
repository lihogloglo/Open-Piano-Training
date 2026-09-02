import type { ExerciseDef } from '@/engine/types';
import type { Unit } from '@/curriculum/schema';
import { ATOMS } from './atoms';
import { overdueDays, type StoredCard } from './fsrs';

export interface AtomState {
  atomId: string;
  fsrs: StoredCard;
  bestScore: number;
  fluent: boolean;
}

export type SessionBlock =
  | { kind: 'warmup'; exercises: { atomId: string; def: ExerciseDef }[]; minutes: number }
  | { kind: 'new'; unitId: string; title: string; minutes: number }
  | { kind: 'review'; atomIds: string[]; minutes: number }
  | { kind: 'create'; prompt: string; minutes: number };

export interface SessionPlan {
  id: string;
  date: string; // YYYY-MM-DD local
  blocks: SessionBlock[];
  completedBlocks: number[];
  catchUp: boolean;
}

export interface SessionInputs {
  date: string;
  dailyMinutes: number;
  /** Next unit on the path, or null when fully caught up. */
  next: Unit | null;
  /** Current stage ordinal (warmup skipped in stages 0–1). */
  stageOrdinal: number;
  atomStates: AtomState[];
  now: Date;
}

const CREATE_PROMPTS = [
  'Two minutes of free play. Pick three notes you can name and build a tiny riff.',
  'Play something that sounds like rain. No rules — just listen while you do it.',
  'Take the last pattern you practiced and change one note. Better or worse? Why?',
  'Play the lowest note you know by name, then the highest. Fill the middle with anything.',
];

const REVIEW_CAP = 10;
const CATCH_UP_THRESHOLD = 20;

/** Deterministic daily session plan (07-progress-scheduling §Session builder). */
export function buildSession(inputs: SessionInputs): SessionPlan {
  const { date, dailyMinutes, next, stageOrdinal, atomStates, now } = inputs;
  const blocks: SessionBlock[] = [];

  const due = atomStates
    .filter((a) => overdueDays(a.fsrs, now) > 0 || new Date(a.fsrs.due).getTime() <= now.getTime())
    .filter((a) => ATOMS.get(a.atomId)?.drill != null);
  const catchUp = due.length > CATCH_UP_THRESHOLD;

  // 1. Warmup — 2 easy exercises from fluent atoms; skipped in stages 0–1.
  const tight = dailyMinutes <= 10;
  if (stageOrdinal >= 2 && !tight) {
    const fluent = atomStates.filter((a) => a.fluent && ATOMS.get(a.atomId)?.drill != null).slice(0, 2);
    if (fluent.length > 0) {
      blocks.push({
        kind: 'warmup',
        exercises: fluent.map((a) => ({ atomId: a.atomId, def: ATOMS.get(a.atomId)!.drill! })),
        minutes: 2,
      });
    }
  }

  // 2. New — the next unit on the path.
  if (next) {
    blocks.push({ kind: 'new', unitId: next.id, title: next.title, minutes: next.minutes });
  }

  // 3. Review — due atoms by overdueness × difficulty, capped.
  const ranked = [...due].sort((a, b) => {
    const wa = (overdueDays(a.fsrs, now) + 0.5) * (ATOMS.get(a.atomId)?.difficulty ?? 20);
    const wb = (overdueDays(b.fsrs, now) + 0.5) * (ATOMS.get(b.atomId)?.difficulty ?? 20);
    return wb - wa;
  });
  const usedMinutes = blocks.reduce((m, b) => m + b.minutes, 0);
  const reviewMinutes = Math.min(6, Math.max(2, dailyMinutes - usedMinutes - 2));
  const perDrillMin = 0.75;
  const reviewCount = Math.min(REVIEW_CAP, ranked.length, Math.floor(reviewMinutes / perDrillMin));
  if (reviewCount > 0) {
    blocks.push({
      kind: 'review',
      atomIds: ranked.slice(0, reviewCount).map((a) => a.atomId),
      minutes: Math.max(2, Math.ceil(reviewCount * perDrillMin)),
    });
  }

  // 4. Create — skipped on the 10-minute budget.
  if (!tight) {
    const promptIdx = hashDate(date) % CREATE_PROMPTS.length;
    blocks.push({ kind: 'create', prompt: CREATE_PROMPTS[promptIdx] ?? CREATE_PROMPTS[0]!, minutes: 2 });
  }

  return { id: `session-${date}`, date, blocks, completedBlocks: [], catchUp };
}

/** Review-only plan (the 5-minute workout / catch-up mode). */
export function buildWorkout(inputs: Pick<SessionInputs, 'date' | 'atomStates' | 'now'>): SessionPlan {
  const due = inputs.atomStates
    .filter((a) => new Date(a.fsrs.due).getTime() <= inputs.now.getTime())
    .filter((a) => ATOMS.get(a.atomId)?.drill != null)
    .sort((a, b) => overdueDays(b.fsrs, inputs.now) - overdueDays(a.fsrs, inputs.now));
  const atomIds = due.slice(0, 8).map((a) => a.atomId);
  return {
    id: `workout-${inputs.date}-${Date.now()}`,
    date: inputs.date,
    blocks: atomIds.length > 0 ? [{ kind: 'review', atomIds, minutes: 5 }] : [],
    completedBlocks: [],
    catchUp: false,
  };
}

function hashDate(date: string): number {
  let h = 0;
  for (const ch of date) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
