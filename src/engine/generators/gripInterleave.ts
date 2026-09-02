import { z } from 'zod';
import { QUALITY_INTERVALS, type ChordQuality, type Inversion } from '@/theory/chords';
import { createRng } from '../rng';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';
import { gripTarget } from './chordGrip';

const qualityEnum = z.enum(Object.keys(QUALITY_INTERVALS) as [ChordQuality, ...ChordQuality[]]);

export const gripInterleaveParams = z.object({
  roots: z.array(z.string()).min(1),
  qualities: z.array(qualityEnum).min(1),
  inversions: z.array(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])).default([0]),
  count: z.number().int().min(2).max(40).default(12),
  hand: z.enum(['rh', 'lh', 'both']).default('rh'),
});

/** True interleaving: random draws with no immediate repeat of the same grip. */
export function generateGripInterleave(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = gripInterleaveParams.parse(def.params);
  const rng = createRng(seed);
  const minBass = p.hand === 'lh' ? 36 : 48;

  const targets: Extract<Target, { kind: 'set' }>[] = [];
  let prevKey = '';
  for (let i = 0; i < p.count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const root = rng.pick(p.roots);
      const quality = rng.pick(p.qualities);
      const inversion = rng.pick(p.inversions) as Inversion;
      const gripKey = `${root}:${quality}:${inversion}`;
      if (gripKey === prevKey && (p.roots.length > 1 || p.qualities.length > 1 || p.inversions.length > 1)) {
        continue;
      }
      prevKey = gripKey;
      targets.push(gripTarget(root, quality, inversion, true, minBass));
      break;
    }
  }

  return {
    def,
    seed,
    targets,
    beatsPerTarget: 2,
    prompt: {
      title: 'Chord drill',
      detail: `${targets.length} grips — play each as it appears`,
      perTarget: targets.map((t) => ({ label: t.label })),
    },
  };
}
