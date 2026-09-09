import { tr } from '@/i18n';
import type { ExerciseInstance, TakeResult } from './types';

/** Feedback describes observable notes and timing, never an inferred finger or posture. */
export function diagnose(result: TakeResult, instance?: ExerciseInstance | null): string {
  const errors = result.judgments.filter((j) => ['wrong', 'extra', 'missed'].includes(j.verdict));
  const counts = new Map<number, number>();
  for (const j of errors)
    if (j.targetIndex >= 0) counts.set(j.targetIndex, (counts.get(j.targetIndex) ?? 0) + 1);
  const worst = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (errors.length > 0) {
    const label = worst === undefined ? null : instance?.prompt.perTarget?.[worst]?.label;
    return tr('{v0} incorrect or missed presses. {v1} Hear it first, then try without hints.', {
      v0: errors.length,
      v1: label ? tr('Focus on “{v0}”.', { v0: label }) : tr('Repeat a short phrase.'),
    });
  }
  const deltas = result.judgments.flatMap((j) => (j.deltaMs === null ? [] : [j.deltaMs]));
  const average = deltas.reduce((a, b) => a + b, 0) / Math.max(1, deltas.length);
  if (Math.abs(average) > 35)
    return tr('Your notes land about {v0} ms {v1}. Count aloud and practice the same phrase slower.', {
      v0: Math.round(Math.abs(average)),
      v1: average < 0 ? 'early' : 'late',
    });
  return tr('The notes are consistent. Repeat without illuminated keys, then try again on another day.');
}
