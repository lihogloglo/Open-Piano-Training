import { sourceText, tr } from '@/i18n';
import { getUnit } from '@/curriculum/content';
import type { ExerciseDef } from '@/engine/types';
import type { Unit } from '@/curriculum/schema';
import { ATOMS } from './atoms';
import { overdueDays, type StoredCard } from './fsrs';

export interface AtomState {
  atomId: string;
  fsrs: StoredCard;
  bestScore: number;
  lastScore?: number;
  fluent: boolean;
}

export type SessionBlock =
  | { kind: 'warmup'; exercises: { atomId: string; def: ExerciseDef }[]; minutes: number }
  | { kind: 'new'; unitId: string; title: string; minutes: number; endStep?: number }
  | {
      kind: 'review';
      atomIds: string[];
      minutes: number;
      retests?: { key: string; unitId: string; stepId: string; exercise: ExerciseDef }[];
    }
  | {
      kind: 'create';
      title: string;
      prompt: string;
      basePrompt?: string;
      reviewAtomId?: string;
      minutes: number;
    };

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
  nextStep?: number;
  creativeFocus?: string;
  learnedUnitIds?: string[];
  /** Current stage ordinal (warmup skipped in stages 0–1). */
  stageOrdinal: number;
  retests?: { key: string; unitId: string; stepId: string; exercise: ExerciseDef }[];
  atomStates: AtomState[];
  now: Date;
}

/** Rotate among create tasks from lessons the learner has completed. */
function creativeChallenge(
  inputs: SessionInputs,
): Omit<Extract<SessionBlock, { kind: 'create' }>, 'kind' | 'minutes'> {
  const candidates = (inputs.learnedUnitIds ?? []).flatMap((id) => {
    const unit = getUnit(id);
    return (
      unit?.steps.flatMap((step) =>
        step.kind === 'create' ? [{ title: unit.title, prompt: step.prompt }] : [],
      ) ?? []
    );
  });
  const focus = inputs.creativeFocus ?? 'melody';
  const preferred = candidates.filter((c) =>
    (focus === 'rhythm'
      ? /rhythm|beat|pulse/i
      : focus === 'harmony'
        ? /chord|progression|harmony/i
        : /melody|phrase|song/i
    ).test(sourceText(c.prompt)),
  );
  const pool = preferred.length ? preferred : candidates;
  const dayIndex = Math.floor(
    Date.UTC(
      ...(inputs.date
        .split('-')
        .map(Number)
        .map((n, i) => (i === 1 ? n - 1 : n)) as [number, number, number]),
    ) / 86_400_000,
  );
  const fallback = [
    {
      title: tr('Two small phrases'),
      prompt: tr(
        'Choose any two nearby white keys. Play a short question, leave a silence, then play an answer.',
      ),
    },
    {
      title: tr('Make a rhythm'),
      prompt: tr(
        'Choose one white key. Tap a steady beat with your foot. Play twice, leave two beats of silence, and repeat.',
      ),
    },
    {
      title: tr('Listen and change'),
      prompt: tr(
        'Choose one white key. Play it gently three times. Try a different spacing between the notes and listen to the change.',
      ),
    },
  ];
  const challenge = (pool.length ? pool : fallback)[dayIndex % (pool.length || fallback.length)]!;
  const weak = [...inputs.atomStates]
    .filter((a) => (a.lastScore ?? a.bestScore) < 0.8)
    .sort((a, b) => (a.lastScore ?? a.bestScore) - (b.lastScore ?? b.bestScore))[0];
  const label = weak ? ATOMS.get(weak.atomId)?.label : undefined;
  return {
    title: sourceText(challenge.title),
    basePrompt: sourceText(challenge.prompt),
    ...(weak && label ? { reviewAtomId: weak.atomId } : {}),
    prompt: label
      ? tr('{v0} Finish with one slow review of {v1}.', { v0: challenge.prompt, v1: label })
      : challenge.prompt,
  };
}

const REVIEW_CAP = 10;
const CATCH_UP_THRESHOLD = 20;

/** Deterministic daily session plan (07-progress-scheduling §Session builder). */
export function buildSession(inputs: SessionInputs): SessionPlan {
  const { date, dailyMinutes, next, stageOrdinal, atomStates, now } = inputs;
  const blocks: SessionBlock[] = [];

  const due = atomStates
    .filter((a) => overdueDays(a.fsrs, now) > 0 || new Date(a.fsrs.due).getTime() <= now.getTime())
    .filter((a) => ATOMS.get(a.atomId)?.drill != null);
  const retests = (inputs.retests ?? []).slice(0, 2);
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
    const start = Math.max(0, inputs.nextStep ?? 0);
    const reserve = (tight ? 0 : 2) + (due.length || retests.length ? 2 : 0);
    const budget = Math.max(1, dailyMinutes - blocks.reduce((m, b) => m + b.minutes, 0) - reserve);
    const perStep = next.minutes / next.steps.length;
    const count = Math.max(1, Math.floor(budget / perStep));
    const endStep = Math.min(next.steps.length, start + count);
    blocks.push({
      kind: 'new',
      unitId: next.id,
      title: sourceText(next.title),
      minutes: Math.min(budget, Math.ceil((endStep - start) * perStep)),
      endStep,
    });
  }

  // 3. Review — due atoms by overdueness × difficulty, capped.
  const ranked = [...due].sort((a, b) => {
    const wa = (overdueDays(a.fsrs, now) + 0.5) * (ATOMS.get(a.atomId)?.difficulty ?? 20);
    const wb = (overdueDays(b.fsrs, now) + 0.5) * (ATOMS.get(b.atomId)?.difficulty ?? 20);
    return wb - wa;
  });
  const usedMinutes = blocks.reduce((m, b) => m + b.minutes, 0);
  const reviewMinutes = Math.min(6, Math.max(0, dailyMinutes - usedMinutes - (tight ? 0 : 2)));
  const perDrillMin = 0.75;
  const reviewCount = Math.min(
    REVIEW_CAP,
    ranked.length,
    Math.max(0, Math.floor((reviewMinutes - retests.length * perDrillMin) / perDrillMin)),
  );
  if ((reviewCount > 0 || retests.length > 0) && reviewMinutes >= 2) {
    blocks.push({
      kind: 'review',
      retests,
      atomIds: ranked.slice(0, reviewCount).map((a) => a.atomId),
      minutes: Math.max(2, Math.ceil((reviewCount + retests.length) * perDrillMin)),
    });
  }

  // 4. Create — skipped on the 10-minute budget.
  if (!tight) {
    blocks.push({ kind: 'create', ...creativeChallenge(inputs), minutes: 2 });
  }

  return { id: `session-${date}`, date, blocks, completedBlocks: [], catchUp };
}

/** Review-only plan (the 5-minute workout / catch-up mode). */
export function buildWorkout(
  inputs: Pick<SessionInputs, 'date' | 'atomStates' | 'now' | 'retests'>,
): SessionPlan {
  const due = inputs.atomStates
    .filter((a) => new Date(a.fsrs.due).getTime() <= inputs.now.getTime())
    .filter((a) => ATOMS.get(a.atomId)?.drill != null)
    .sort((a, b) => overdueDays(b.fsrs, inputs.now) - overdueDays(a.fsrs, inputs.now));
  const retests = (inputs.retests ?? []).slice(0, 2);
  const atomIds = due.slice(0, 6 - retests.length).map((a) => a.atomId);
  return {
    id: `workout-${inputs.date}-${Date.now()}`,
    date: inputs.date,
    blocks:
      atomIds.length > 0 || inputs.retests?.length ? [{ kind: 'review', atomIds, retests, minutes: 5 }] : [],
    completedBlocks: [],
    catchUp: false,
  };
}

export function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
