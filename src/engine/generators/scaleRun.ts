import { z } from 'zod';
import { scaleFingering, scaleMidis, type ScaleType } from '@/theory/scales';
import { midiToPcName } from '@/theory/notes';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

export const scaleRunParams = z.object({
  tonic: z.string(),
  scaleType: z.enum([
    'major',
    'natural-minor',
    'harmonic-minor',
    'major-pentatonic',
    'minor-pentatonic',
    'blues',
  ]),
  hand: z.enum(['rh', 'lh']),
  octaves: z.union([z.literal(1), z.literal(2)]).default(1),
  direction: z.enum(['up', 'down', 'updown']).default('up'),
  startOctave: z.number().int().min(1).max(6).default(4),
});
export type ScaleRunParams = z.infer<typeof scaleRunParams>;

const SCALE_LABEL: Record<ScaleType, string> = {
  major: 'major',
  'natural-minor': 'natural minor',
  'harmonic-minor': 'harmonic minor',
  'major-pentatonic': 'major pentatonic',
  'minor-pentatonic': 'minor pentatonic',
  blues: 'blues',
};

export function generateScaleRun(def: ExerciseDef, _seed: number): ExerciseInstance {
  const p = scaleRunParams.parse(def.params);
  // LH plays an octave lower by convention.
  const startOctave = p.hand === 'lh' ? p.startOctave - 1 : p.startOctave;
  const up = scaleMidis(p.tonic, p.scaleType, p.octaves, startOctave);
  const fingering = scaleFingering(p.tonic, p.scaleType, p.hand, p.octaves);

  let midis: number[];
  let fingers: (number | undefined)[];
  const fwd = fingering ?? [];
  if (p.direction === 'up') {
    midis = up;
    fingers = up.map((_, i) => fwd[i]);
  } else if (p.direction === 'down') {
    midis = [...up].reverse();
    fingers = midis.map((_, i) => fwd[up.length - 1 - i]);
  } else {
    const down = [...up].reverse().slice(1);
    midis = [...up, ...down];
    fingers = [...up.map((_, i) => fwd[i]), ...down.map((_, i) => fwd[up.length - 2 - i])];
  }

  const targets: Target[] = midis.map((midi, i) => {
    const finger = fingers[i];
    return finger !== undefined ? { kind: 'note', midi, finger } : { kind: 'note', midi };
  });

  const mode = key(p);
  return {
    def,
    seed: _seed,
    targets,
    beatsPerTarget: 1,
    prompt: {
      title: `${p.tonic.replace(/#/, '♯').replace(/(?<=.)b/, '♭')} ${SCALE_LABEL[p.scaleType]} scale`,
      detail: `${p.hand === 'rh' ? 'Right hand' : 'Left hand'} · ${p.octaves} octave${p.octaves > 1 ? 's' : ''} · ${
        p.direction === 'updown' ? 'up and down' : p.direction
      }`,
      key: mode,
      perTarget: targets.map((t) => ({
        label: t.kind === 'note' ? midiToPcName(t.midi, mode) : '',
      })),
    },
  };
}

function key(p: ScaleRunParams): { tonic: string; mode: 'major' | 'minor' } {
  return {
    tonic: p.tonic,
    mode: p.scaleType === 'major' || p.scaleType === 'major-pentatonic' ? 'major' : 'minor',
  };
}
