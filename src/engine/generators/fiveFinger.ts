import { z } from 'zod';
import { scaleMidis } from '@/theory/scales';
import { midiToPcName } from '@/theory/notes';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

export const fiveFingerParams = z.object({
  tonic: z.string(),
  quality: z.enum(['maj', 'min']).default('maj'),
  hand: z.enum(['rh', 'lh']),
  pattern: z.enum(['asc', 'desc', 'updown']).default('asc'),
  startOctave: z.number().int().min(1).max(6).default(4),
});

export function generateFiveFinger(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = fiveFingerParams.parse(def.params);
  const startOctave = p.hand === 'lh' ? p.startOctave - 1 : p.startOctave;
  const scale = scaleMidis(p.tonic, p.quality === 'maj' ? 'major' : 'natural-minor', 1, startOctave);
  const five = scale.slice(0, 5);

  let midis: number[];
  if (p.pattern === 'asc') midis = five;
  else if (p.pattern === 'desc') midis = [...five].reverse();
  else midis = [...five, ...[...five].reverse().slice(1)];

  // 5-finger position: RH fingers 1..5 on notes 1..5; LH fingers 5..1.
  const fingerOf = (midi: number): number => {
    const idx = five.indexOf(midi);
    return p.hand === 'rh' ? idx + 1 : 5 - idx;
  };

  const keyCtx = { tonic: p.tonic, mode: p.quality === 'maj' ? ('major' as const) : ('minor' as const) };
  const targets: Target[] = midis.map((midi) => ({ kind: 'note', midi, finger: fingerOf(midi) }));
  return {
    def,
    seed,
    targets,
    beatsPerTarget: 1,
    prompt: {
      title: `${p.tonic} ${p.quality === 'maj' ? 'major' : 'minor'} five-finger pattern`,
      detail: `${p.hand === 'rh' ? 'Right hand' : 'Left hand'} · fingers stay in position`,
      key: keyCtx,
      perTarget: targets.map((t) => ({ label: t.kind === 'note' ? midiToPcName(t.midi, keyCtx) : '' })),
    },
  };
}
