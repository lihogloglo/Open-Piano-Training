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
        take.exercise.mode === 'wait' ? 'Untimed recall' : 'Timed',
        typeof take.exercise.params['arrangement'] === 'string'
          ? take.exercise.params['arrangement']
          : take.exercise.rung,
        typeof take.exercise.params['phrase'] === 'number' && take.exercise.params['phrase'] >= 0
          ? `Bars ${take.exercise.params['phrase'] + 1}-${take.exercise.params['phrase'] + 2}`
          : take.exercise.generator === 'phrase'
            ? 'Whole piece'
            : null,
        typeof take.exercise.params['offset'] === 'number' && take.exercise.params['offset'] !== 0
          ? `Transposed ${take.exercise.params['offset']} semitones`
          : null,
      ]
        .filter(Boolean)
        .join(' / '),
    };
  });
}
