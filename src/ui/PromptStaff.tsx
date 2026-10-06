import { useMemo } from 'react';
import type { ExerciseInstance, JudgeVerdict } from '@/engine/types';
import { useRunStore } from '@/store/runStore';
import { StaffSnippet, type StaffNoteState } from './StaffSnippet';

const GOOD: ReadonlySet<JudgeVerdict> = new Set(['perfect', 'good', 'ok']);

/** The staff of a reading exercise, with the current note lit and played notes coloured. */
export function PromptStaff({ instance }: { instance: ExerciseInstance }) {
  const phase = useRunStore((s) => s.phase);
  const runInstance = useRunStore((s) => s.instance);
  const targetIndex = useRunStore((s) => s.targetIndex);
  const verdicts = useRunStore((s) => s.targetVerdicts);
  const live = runInstance === instance && phase !== 'idle';
  const states = useMemo<StaffNoteState[] | undefined>(() => {
    if (!live) return undefined;
    return instance.targets.map((_, i) => {
      const v = verdicts.get(i);
      return v === undefined ? undefined : GOOD.has(v) ? 'ok' : 'bad';
    });
  }, [live, verdicts, instance]);
  const { staff, key } = instance.prompt;
  if (!staff || !key) return null;
  return (
    <StaffSnippet
      staff={staff}
      keyContext={key}
      highlightIndex={live && (phase === 'running' || phase === 'count-in') ? targetIndex : -1}
      {...(states ? { states } : {})}
    />
  );
}
