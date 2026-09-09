import { tr } from '@/i18n';
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
    'chromatic',
  ]),
  hand: z.enum(['rh', 'lh']),
  octaves: z.union([z.literal(1), z.literal(2)]).default(1),
  direction: z.enum(['up', 'down', 'updown']).default('up'),
  octaveFlexible: z.boolean().default(true),
  startOctave: z.number().int().min(1).max(6).default(4),
});
export type ScaleRunParams = z.infer<typeof scaleRunParams>;

const SCALE_LABEL: Record<ScaleType, string> = {
  major: 'major',
  'natural-minor': tr('natural minor'),
  'harmonic-minor': tr('harmonic minor'),
  'major-pentatonic': tr('major pentatonic'),
  'minor-pentatonic': tr('minor pentatonic'),
  blues: 'blues',
  chromatic: 'chromatic',
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
    return finger !== undefined
      ? { kind: 'note', octaveFlexible: p.octaveFlexible, midi, finger }
      : { kind: 'note', octaveFlexible: p.octaveFlexible, midi };
  });

  const mode = key(p);
  return {
    def,
    seed: _seed,
    targets,
    beatsPerTarget: 1,
    prompt: {
      title: tr('{v0} {v1} scale', {
        v0: p.tonic.replace(/#/, '♯').replace(/(?<=.)b/, '♭'),
        v1: SCALE_LABEL[p.scaleType],
      }),
      detail: tr('{v0} · {v1} octave{v2} · {v3}', {
        v0: p.hand === 'rh' ? 'Right hand' : 'Left hand',
        v1: p.octaves,
        v2: p.octaves > 1 ? 's' : '',
        v3: p.direction === 'updown' ? 'up and down' : p.direction,
      }),
      key: mode,
      perTarget: targets.map((t) => ({
        label: t.kind === 'note' ? midiToPcName(t.midi, mode) : '',
      })),
    },
  };
}

function key(p: ScaleRunParams): { tonic: string; mode: 'major' | 'minor' } {
  // Chromatic has no mode; call it major so the walk is spelled with sharps,
  // which is the convention for an ascending chromatic line.
  const majorish = ['major', 'major-pentatonic', 'chromatic'];
  return { tonic: p.tonic, mode: majorish.includes(p.scaleType) ? 'major' : 'minor' };
}
