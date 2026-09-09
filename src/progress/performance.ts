import { tr } from '@/i18n';
import type { Take } from '@/engine/replay';

export interface PerformanceMilestone {
  title: string;
  level: 'Completed' | 'Independent' | 'Retained';
  bpm: number | null;
  hand: string;
  conditions: string;
}

/** Conditions must match. A later-day success cannot borrow a faster or harder take's credit. */
export function performanceMilestones(takes: Take[]): PerformanceMilestone[] {
  const groups = new Map<string, Take[]>();
  for (const take of takes) {
    if (!take.exercise.assessment || !take.result.passed || take.result.hintsUsed) continue;
    const { generator, params, hand, mode, bpm, rung } = take.exercise;
    const key = JSON.stringify({ generator, params, hand, mode, bpm, rung });
    groups.set(key, [...(groups.get(key) ?? []), take]);
  }
  return [...groups.values()].map((group) => {
    const take = group[0]!;
    const days = new Set(group.map((t) => new Date(t.startedAt).toDateString()));
    return {
      title: String(
        take.exercise.params['title'] ??
          take.exercise.params['songId'] ??
          take.unitId ??
          take.exercise.generator,
      ),
      level: days.size >= 2 ? 'Retained' : 'Independent',
      bpm: take.bpm ?? take.exercise.bpm ?? null,
      hand: take.exercise.hand,
      conditions: [
        take.exercise.mode === 'wait' ? tr('Untimed recall') : tr('Timed'),
        typeof take.exercise.params['arrangement'] === 'string'
          ? tr(take.exercise.params['arrangement'])
          : tr(take.exercise.rung),
        typeof take.exercise.params['phrase'] === 'number' && take.exercise.params['phrase'] >= 0
          ? tr('Bars {v0}-{v1}', {
              v0: take.exercise.params['phrase'] + 1,
              v1: take.exercise.params['phrase'] + 2,
            })
          : take.exercise.generator === 'phrase'
            ? tr('Whole piece')
            : null,
        typeof take.exercise.params['offset'] === 'number' && take.exercise.params['offset'] !== 0
          ? tr('Transposed {v0} semitones', { v0: take.exercise.params['offset'] })
          : null,
      ]
        .filter(Boolean)
        .join(' / '),
    };
  });
}
