import type { DemoNote, ExerciseInstance } from './types';
import { targetMidis } from './matcher/setMatch';

/** Demonstrate the actual generated take, including focused excerpts and rests. */
export function exerciseDemo(instance: ExerciseInstance): DemoNote[] {
  const spacing = instance.beatsPerTarget ?? 1;
  const phraseNotes =
    instance.def.generator === 'phrase'
      ? (instance.def.params['notes'] as DemoNote[] | undefined)
      : undefined;
  const focusStart = instance.def.focus?.start ?? 0;
  const phraseBeats = phraseNotes ? [...new Set(phraseNotes.map((n) => n.atBeat))].sort((a, b) => a - b) : [];
  const origin = phraseBeats[focusStart] ?? 0;
  return instance.targets.flatMap((target, i) => {
    const atBeat = target.atBeat ?? i * spacing;
    const next = instance.targets.slice(i + 1).find((t, j) => (t.atBeat ?? (i + 1 + j) * spacing) > atBeat);
    const nextBeat = next?.atBeat ?? atBeat + spacing;
    return targetMidis(target).map((midi) => ({
      midi,
      atBeat,
      durBeats:
        phraseNotes?.find((n) => n.midi === midi && n.atBeat === atBeat + origin)?.durBeats ??
        Math.max(0.15, Math.min(nextBeat - atBeat, 1) * 0.8),
    }));
  });
}
