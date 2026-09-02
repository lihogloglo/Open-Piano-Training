import type { JudgeVerdict, TimingTier } from '../types';

export interface TimingWindows {
  /** ms, absolute delta thresholds */
  perfect: number;
  good: number;
  outer: number;
  /** chord roll window, ms */
  roll: number;
}

export const TIER_WINDOWS: Record<TimingTier, TimingWindows> = {
  relaxed: { perfect: 120, good: 240, outer: 350, roll: 120 },
  standard: { perfect: 70, good: 140, outer: 220, roll: 90 },
  strict: { perfect: 45, good: 90, outer: 140, roll: 60 },
};

/** Band a timing delta (already latency-corrected). Returns null outside the outer window. */
export function bandOf(
  deltaMs: number,
  w: TimingWindows,
): Extract<JudgeVerdict, 'perfect' | 'good' | 'ok'> | null {
  const d = Math.abs(deltaMs);
  if (d <= w.perfect) return 'perfect';
  if (d <= w.good) return 'good';
  if (d <= w.outer) return 'ok';
  return null;
}

/** Worst of two bands (perfect < good < ok). */
export function worseBand(
  a: Extract<JudgeVerdict, 'perfect' | 'good' | 'ok'>,
  b: Extract<JudgeVerdict, 'perfect' | 'good' | 'ok'>,
): Extract<JudgeVerdict, 'perfect' | 'good' | 'ok'> {
  const order = { perfect: 0, good: 1, ok: 2 } as const;
  return order[a] >= order[b] ? a : b;
}
