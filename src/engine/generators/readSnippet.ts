import { tr } from '@/i18n';
import { z } from 'zod';
import { scaleMidis, type ScaleType } from '@/theory/scales';
import { midiToName } from '@/theory/notes';
import { createRng } from '../rng';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

const keySchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

export const readSnippetParams = z.object({
  key: keySchema,
  /** Staff to read from; 'both' alternates phrases between the hands. */
  clef: z.enum(['treble', 'bass']).default('treble'),
  bars: z.number().int().min(1).max(8).default(2),
  beatsPerBar: z.number().int().min(2).max(4).default(4),
  /** Largest step between consecutive notes, in scale degrees. */
  maxLeap: z.number().int().min(1).max(4).default(2),
  scaleType: z.enum(['major', 'natural-minor', 'major-pentatonic']).default('major'),
});

/** Where each clef sits comfortably under one hand. */
const CLEF_CENTER: Record<string, number> = { treble: 67, bass: 50 };

/**
 * Sight-reading (06 Stage 8 / read strand): a short stepwise phrase in a known
 * key, generated fresh so it cannot be memorized. The notes are the exercise
 * targets; `StaffSnippet` renders the same list as notation.
 */
export function generateReadSnippet(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = readSnippetParams.parse(def.params);
  const rng = createRng(seed);
  const center = CLEF_CENTER[p.clef] ?? 67;

  // Two octaves of the key's scale around the clef's home register.
  const startOctave = p.clef === 'bass' ? 2 : 4;
  const pool = scaleMidis(p.key.tonic, p.scaleType as ScaleType, 2, startOctave);
  // Index of the pool note nearest the clef centre — phrases start near home.
  let idx = pool.reduce(
    (best, midi, i) => (Math.abs(midi - center) < Math.abs((pool[best] ?? 0) - center) ? i : best),
    0,
  );

  const count = p.bars * p.beatsPerBar;
  const targets: Target[] = [];
  const perTarget: { label: string; detail?: string }[] = [];
  for (let i = 0; i < count; i++) {
    const midi = pool[idx] ?? center;
    targets.push({ kind: 'note', midi, atBeat: i });
    perTarget.push({ label: midiToName(midi, p.key) });
    // Step or small leap, kept inside the pool.
    const leap = 1 + rng.int(p.maxLeap);
    const dir = rng.next() < 0.5 ? -1 : 1;
    let next = idx + dir * leap;
    if (next < 0 || next >= pool.length) next = idx - dir * leap;
    idx = Math.max(0, Math.min(pool.length - 1, next));
  }

  return {
    def,
    seed,
    targets,
    beatsPerTarget: 1,
    prompt: {
      title: tr('Read it — {v0} {v1}', { v0: p.key.tonic, v1: p.key.mode }),
      detail: tr('{v0} bars, {v1} clef · play what you see', { v0: p.bars, v1: p.clef }),
      key: p.key,
      perTarget,
    },
  };
}

/** The midi notes of a snippet instance, for the staff renderer. */
export function snippetNotes(instance: ExerciseInstance): number[] {
  return instance.targets.flatMap((t) => (t.kind === 'note' ? [t.midi] : []));
}
