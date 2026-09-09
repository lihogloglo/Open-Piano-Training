import { z } from 'zod';
import {
  buildChord,
  chordSymbol,
  QUALITY_INTERVALS,
  type ChordQuality,
  type Inversion,
} from '@/theory/chords';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

const qualityEnum = z.enum(Object.keys(QUALITY_INTERVALS) as [ChordQuality, ...ChordQuality[]]);

export const chordGripParams = z.object({
  root: z.string(),
  quality: qualityEnum,
  inversion: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
  hand: z.enum(['rh', 'lh', 'both']).default('rh'),
  voicing: z.enum(['closed', 'rootOnly']).default('closed'),
  octaveFlexible: z.boolean().default(true),
});

const INVERSION_LABEL = ['root position', '1st inversion', '2nd inversion', '3rd inversion'] as const;

export function gripTarget(
  root: string,
  quality: ChordQuality,
  inversion: Inversion,
  octaveFlexible: boolean,
  minBass = 48,
): Extract<Target, { kind: 'set' }> {
  const midis = buildChord({ root, quality, inversion }, minBass);
  const label = `${chordSymbol(root, quality)}${inversion > 0 ? ` (${INVERSION_LABEL[inversion]})` : ''}`;
  return octaveFlexible
    ? { kind: 'set', midis, label, octaveFlexible: true, inversionOf: { root, quality, inversion } }
    : { kind: 'set', midis, label, octaveFlexible: false };
}

export function generateChordGrip(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = chordGripParams.parse(def.params);
  const minBass = p.hand === 'lh' ? 36 : 48;
  const target =
    p.voicing === 'rootOnly'
      ? rootOnlyTarget(p.root, p.quality)
      : gripTarget(p.root, p.quality, p.inversion as Inversion, p.octaveFlexible, minBass);
  return {
    def,
    seed,
    targets: [target],
    beatsPerTarget: 2,
    prompt: {
      title: target.label,
      detail:
        p.voicing === 'rootOnly'
          ? 'Play just the root, in any octave'
          : `Play ${INVERSION_LABEL[p.inversion]}. ${p.octaveFlexible ? 'Any octave works.' : 'Use the shown octave.'}`,
      perTarget: [{ label: target.label }],
    },
  };
}

function rootOnlyTarget(root: string, quality: ChordQuality): Extract<Target, { kind: 'set' }> {
  const [rootMidi] = buildChord({ root, quality, inversion: 0 }, 48);
  return {
    kind: 'set',
    midis: [rootMidi ?? 48],
    label: `${chordSymbol(root, quality)} — root`,
    octaveFlexible: true,
  };
}
