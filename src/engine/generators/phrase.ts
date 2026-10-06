import { tr } from '@/i18n';
import { z } from 'zod';
import { staffFromNotes } from '../staff';
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
  /** Write the phrase on a staff. The staff then replaces the note names. */
  clef: z.enum(['treble', 'bass']).optional(),
  /** Key for the staff's key signature and note spelling. */
  key: z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) }).optional(),
  /** Length of an incomplete first bar (a pickup), in beats. */
  pickupBeats: z.number().nonnegative().default(0),
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
            label: tr('Together'),
            octaveFlexible: false,
          },
    );
  return {
    def,
    seed,
    targets,
    beatsPerBar: p.beatsPerBar,
    prompt: {
      title: tr(p.title),
      ...(p.key ? { key: p.key } : {}),
      ...(p.clef
        ? {
            staff: staffFromNotes(p.notes, {
              clef: p.clef,
              beatsPerBar: p.beatsPerBar,
              pickupBeats: p.pickupBeats,
            }),
          }
        : {}),
      detail: p.ear ? tr('Listen, then play from memory') : tr('Follow the phrase'),
      perTarget: targets.map((t) => ({
        label: p.ear
          ? tr('Play from memory')
          : t.kind === 'note'
            ? tr('{v0}{v1}', {
                v0: ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][t.midi % 12],
                v1: Math.floor(t.midi / 12) - 1,
              })
            : tr('Hands together'),
        detail: tr('Beat {v0}', {
          v0: ((((t.atBeat ?? 0) - p.pickupBeats) % p.beatsPerBar) + p.beatsPerBar) % p.beatsPerBar + 1,
        }),
      })),
    },
  };
}
