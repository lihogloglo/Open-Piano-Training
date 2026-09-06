import { z } from 'zod';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

const paramsSchema = z.object({
  title: z.string(),
  beatsPerBar: z.number().int().min(2).max(6),
  notes: z
    .array(
      z.object({
        midi: z.number().int().min(21).max(108),
        atBeat: z.number().nonnegative(),
        durBeats: z.number().positive(),
        finger: z.number().int().min(1).max(5).optional(),
        velocity: z.number().min(0).max(1).optional(),
      }),
    )
    .min(1),
  ear: z.boolean().default(false),
});

export function generatePhrase(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = paramsSchema.parse(def.params);
  p.ear = p.ear || !!def.assessment;
  const groups = new Map<number, typeof p.notes>();
  for (const n of p.notes) groups.set(n.atBeat, [...(groups.get(n.atBeat) ?? []), n]);
  const targets: Target[] = [...groups]
    .sort((a, b) => a[0] - b[0])
    .map(([atBeat, notes]) =>
      notes.length === 1
        ? {
            kind: 'note',
            midi: notes[0]!.midi,
            atBeat,
            ...(notes[0]!.finger ? { finger: notes[0]!.finger } : {}),
          }
        : {
            kind: 'set',
            midis: [...new Set(notes.map((n) => n.midi))],
            atBeat,
            label: 'Together',
            octaveFlexible: false,
          },
    );
  return {
    def,
    seed,
    targets,
    beatsPerBar: p.beatsPerBar,
    prompt: {
      title: p.title,
      detail: p.ear ? 'Listen, then play from memory' : 'Follow the phrase',
      perTarget: targets.map((t) => ({
        label: p.ear
          ? 'Play from memory'
          : t.kind === 'note'
            ? `${['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][t.midi % 12]}${Math.floor(t.midi / 12) - 1}`
            : 'Hands together',
        detail: `Beat ${((t.atBeat ?? 0) % p.beatsPerBar) + 1}`,
      })),
    },
  };
}
