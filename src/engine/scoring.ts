import type { JudgeVerdict, MatchMode, NoteJudgment, TakeResult } from './types';

const NOTE_SCORE: Partial<Record<JudgeVerdict, number>> = {
  perfect: 1.0,
  good: 0.8,
  ok: 0.5,
};

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Exact formulas from 04-exercise-engine §Scoring.
 * Judgments may contain several entries per target (set members); a target's
 * band is the worst band among its pitch-correct judgments.
 */
export function scoreTake(
  judgments: NoteJudgment[],
  targetCount: number,
  mode: MatchMode,
  passScore = 0.8,
): TakeResult {
  const perTarget = new Map<number, number>(); // targetIndex -> worst note score among its judgments
  let extras = 0;
  for (const j of judgments) {
    if (j.verdict === 'extra') {
      extras += 1;
      continue;
    }
    if (j.verdict === 'wrong' || j.verdict === 'missed') {
      // A wrong/missed mark does not erase an earlier successful hit of the
      // same target (wrong notes near a hit target are informational).
      if (!perTarget.has(j.targetIndex) && j.verdict === 'missed') perTarget.set(j.targetIndex, 0);
      continue;
    }
    const s = NOTE_SCORE[j.verdict] ?? 0;
    const prev = perTarget.get(j.targetIndex);
    perTarget.set(j.targetIndex, prev === undefined || prev === 0 ? s : Math.min(prev, s));
  }

  const hitScores = [...perTarget.values()].filter((s) => s > 0);
  const pitchAccuracy = targetCount === 0 ? 1 : hitScores.length / targetCount;
  const timingAccuracy =
    mode === 'wait' || hitScores.length === 0
      ? mode === 'wait'
        ? 1
        : 0
      : hitScores.reduce((a, b) => a + b, 0) / hitScores.length;
  const extraPenalty = Math.min(0.1, 0.02 * extras);
  const base = mode === 'wait' ? pitchAccuracy : 0.6 * pitchAccuracy + 0.4 * timingAccuracy;
  const score = clamp01(base - extraPenalty);
  const stars: TakeResult['stars'] = score >= 0.97 ? 3 : score >= 0.9 ? 2 : score >= 0.8 ? 1 : 0;
  return {
    pitchAccuracy,
    timingAccuracy: mode === 'wait' ? 1 : timingAccuracy,
    score,
    stars,
    judgments,
    passed: score >= passScore,
  };
}
