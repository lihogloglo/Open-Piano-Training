import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';

const scheduler = fsrs(generatorParameters({ request_retention: 0.9 }));

/** Serialized card (Dates as ISO strings) — the shape stored in Dexie. */
export interface StoredCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
}

export function newCard(now: Date): StoredCard {
  return toStored(createEmptyCard(now));
}

export function toStored(card: Card): StoredCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    ...(card.last_review ? { last_review: card.last_review.toISOString() } : {}),
  };
}

export function fromStored(s: StoredCard): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    ...(s.last_review ? { last_review: new Date(s.last_review) } : {}),
  } as Card;
}

/** Grade mapping from a take score (07): <0.80 Again · ≤0.85 Hard · ≤0.95 Good · else Easy. */
export function gradeFromScore(score: number): Grade {
  if (score < 0.8) return Rating.Again;
  if (score <= 0.85) return Rating.Hard;
  if (score <= 0.95) return Rating.Good;
  return Rating.Easy;
}

/** Apply a graded attempt; returns the updated stored card. */
export function reviewCard(stored: StoredCard, score: number, now: Date): StoredCard {
  const { card } = scheduler.next(fromStored(stored), now, gradeFromScore(score));
  return toStored(card);
}

export function isDue(stored: StoredCard, now: Date): boolean {
  return new Date(stored.due).getTime() <= now.getTime();
}

/** Days overdue (0 when not due). */
export function overdueDays(stored: StoredCard, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(stored.due).getTime()) / 86_400_000);
}

/** Fluency (07): stability ≥ 30 days AND a best score ≥ 0.9. */
export function isFluent(stored: StoredCard, bestScore: number): boolean {
  return stored.stability >= 30 && bestScore >= 0.9;
}
