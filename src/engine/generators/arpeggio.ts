import { tr } from '@/i18n';
import { z } from 'zod';
import { midiToPcName, nameToMidi } from '@/theory/notes';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

export const arpeggioParams = z.object({
  tonic: z.string(),
  quality: z.enum(['maj', 'min']).default('maj'),
  hand: z.enum(['rh', 'lh']),
  octaves: z.union([z.literal(1), z.literal(2)]).default(1),
  direction: z.enum(['up', 'updown']).default('updown'),
  octaveFlexible: z.boolean().default(true),
});

/**
 * Standard fingering for a root-position triad arpeggio on a white-key root
 * (C, F, G, and the minor triads on A, D, E). Two octaves pass the thumb under
 * (right hand) or cross 4 over (left hand) after the first octave.
 */
const FINGERS: Record<'rh' | 'lh', Record<1 | 2, number[]>> = {
  rh: { 1: [1, 2, 3, 5], 2: [1, 2, 3, 1, 2, 3, 5] },
  lh: { 1: [5, 4, 2, 1], 2: [5, 4, 2, 1, 4, 2, 1] },
};

/** The fingering for an ascending arpeggio, aligned with its notes. Shared with the lint. */
export function arpeggioFingering(hand: 'rh' | 'lh', octaves: 1 | 2): number[] {
  return FINGERS[hand][octaves];
}

/**
 * Arpeggio: a triad played one note at a time across one or two octaves,
 * up, or up and back down. One note per beat.
 */
export function generateArpeggio(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = arpeggioParams.parse(def.params);
  // The left hand plays an octave lower, as in scale-run.
  const root = nameToMidi(`${p.tonic}${p.hand === 'lh' ? 3 : 4}`) ?? 60;
  const shape = p.quality === 'min' ? [0, 3, 7] : [0, 4, 7];
  const up: number[] = [];
  for (let o = 0; o < p.octaves; o++) up.push(...shape.map((s) => root + 12 * o + s));
  up.push(root + 12 * p.octaves);
  const fingersUp = arpeggioFingering(p.hand, p.octaves);

  const midis = p.direction === 'up' ? up : [...up, ...up.slice(0, -1).reverse()];
  const fingers = p.direction === 'up' ? fingersUp : [...fingersUp, ...fingersUp.slice(0, -1).reverse()];
  const targets: Target[] = midis.map((midi, i) => ({
    kind: 'note',
    midi,
    octaveFlexible: p.octaveFlexible,
    finger: fingers[i]!,
  }));

  const name = p.tonic.replace(/#/, '♯').replace(/(?<=.)b/, '♭');
  const key = { tonic: p.tonic, mode: p.quality === 'min' ? ('minor' as const) : ('major' as const) };
  return {
    def,
    seed,
    targets,
    beatsPerTarget: 1,
    prompt: {
      title:
        p.quality === 'min'
          ? tr('{v0} minor arpeggio', { v0: name })
          : tr('{v0} major arpeggio', { v0: name }),
      detail: [
        p.hand === 'rh' ? tr('Right hand') : tr('Left hand'),
        p.octaves === 2 ? tr('two octaves') : tr('one octave'),
        p.direction === 'updown' ? tr('up and down') : tr('up'),
      ].join(' · '),
      key,
      perTarget: midis.map((midi, i) => ({
        label: midiToPcName(midi, key),
        detail: tr('Finger {v0}', { v0: fingers[i]! }),
      })),
    },
  };
}
