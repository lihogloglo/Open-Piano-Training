import { z } from 'zod';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

const paramsSchema = z.object({
  group: z.literal('black-keys'),
  count: z.number().int().min(1).max(40).default(5),
});

const BLACK_KEY_PITCH_CLASSES = [1, 3, 6, 8, 10];

/** Review a key family when every member is a valid answer. */
export function generateKeyGroupFind(def: ExerciseDef, seed: number): ExerciseInstance {
  const params = paramsSchema.parse(def.params);
  const targets: Target[] = Array.from({ length: params.count }, () => ({
    kind: 'pitch-class-group',
    pitchClasses: BLACK_KEY_PITCH_CLASSES,
    label: 'any black key',
  }));

  return {
    def,
    seed,
    targets,
    prompt: {
      title: 'Find the black keys',
      detail: 'Play any black key. Any octave counts.',
      perTarget: targets.map(() => ({ label: 'Play any black key', detail: 'Any octave counts' })),
    },
  };
}
