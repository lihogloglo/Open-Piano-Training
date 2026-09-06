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
  relaxed: { perfect: 150, good: 300, outer: 450, roll: 160 },
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

/**
 * Latency calibration: median of measured (press − click) deltas, clamped to
 * ±80ms (03-midi-audio §Latency calibration). Empty input → 0.
 */
export function calibrationOffset(deltasMs: number[]): number {
  if (deltasMs.length === 0) return 0;
  const sorted = [...deltasMs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  return Math.max(-80, Math.min(80, Math.round(median)));
}

/** Worst of two bands (perfect < good < ok). */
export function worseBand(
  a: Extract<JudgeVerdict, 'perfect' | 'good' | 'ok'>,
  b: Extract<JudgeVerdict, 'perfect' | 'good' | 'ok'>,
): Extract<JudgeVerdict, 'perfect' | 'good' | 'ok'> {
  const order = { perfect: 0, good: 1, ok: 2 } as const;
  return order[a] >= order[b] ? a : b;
}
