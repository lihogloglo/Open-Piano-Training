import { z } from 'zod';
import { namePc } from '@/theory/notes';
import { createRng } from '../rng';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

export const noteFindParams = z.object({
  /** Note names without octave, e.g. ['C','F','Bb']. */
  notes: z.array(z.string()).min(1),
  count: z.number().int().min(1).max(40).default(8),
  /** Reference octave used for the highlighted key when hinting. */
  referenceOctave: z.number().int().min(2).max(6).default(4),
});

/** "Play any A" — single-note, octave-flexible targets drawn from a pool. */
export function generateNoteFind(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = noteFindParams.parse(def.params);
  const rng = createRng(seed);
  const targets: Target[] = [];
  const perTarget: { label: string; detail?: string }[] = [];
  let prev = '';
  for (let i = 0; i < p.count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const name = rng.pick(p.notes);
      if (name === prev && p.notes.length > 1) continue;
      prev = name;
      const pc = namePc(name);
      if (pc === null) throw new Error(`Bad note name: ${name}`);
      const midi = pc + 12 * (p.referenceOctave + 1);
      const display = name.replace(/#/g, '♯').replace(/(?<=.)b/g, '♭');
      targets.push({ kind: 'set', midis: [midi], label: display, octaveFlexible: true });
      perTarget.push({ label: `Play any ${display}`, detail: 'Any octave counts' });
      break;
    }
  }
  return {
    def,
    seed,
    targets,
    beatsPerTarget: 2,
    prompt: { title: 'Find the notes', detail: 'Any octave counts', perTarget },
  };
}
