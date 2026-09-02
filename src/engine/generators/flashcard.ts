import { z } from 'zod';
import { keySignature, type KeyContext } from '@/theory/keys';
import { QUALITY_INTERVALS, type ChordQuality, chordSymbol } from '@/theory/chords';
import { createRng } from '../rng';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';
import { gripTarget } from './chordGrip';

const qualityEnum = z.enum(Object.keys(QUALITY_INTERVALS) as [ChordQuality, ...ChordQuality[]]);

export const flashcardParams = z.object({
  kind: z.enum(['spell']),
  roots: z.array(z.string()).min(1),
  qualities: z.array(qualityEnum).min(1),
  count: z.number().int().min(1).max(30).default(10),
});

/**
 * Theory flashcards answered on the keyboard: "Spell F♯m7" → play any voicing.
 * (Choice-based cards — key signatures etc. — arrive with the lesson player.)
 */
export function generateFlashcard(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = flashcardParams.parse(def.params);
  const rng = createRng(seed);
  const targets: Target[] = [];
  const perTarget: { label: string; detail?: string }[] = [];
  let prev = '';
  for (let i = 0; i < p.count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const root = rng.pick(p.roots);
      const quality = rng.pick(p.qualities);
      const gripKey = `${root}:${quality}`;
      if (gripKey === prev && (p.roots.length > 1 || p.qualities.length > 1)) continue;
      prev = gripKey;
      const t = gripTarget(root, quality, 0, true);
      targets.push(t);
      perTarget.push({ label: `Spell ${chordSymbol(root, quality)}`, detail: 'Play it in any octave' });
      break;
    }
  }
  return {
    def,
    seed,
    targets,
    beatsPerTarget: 2,
    prompt: { title: 'Spelling drill', detail: 'Build each chord from its symbol', perTarget },
  };
}

/** Helper used by future choice-mode cards; exported for tests. */
export function keySignatureAnswer(key: KeyContext): string {
  const sig = keySignature(key);
  if (sig.alteration === 0) return 'no sharps or flats';
  const n = Math.abs(sig.alteration);
  return `${n} ${sig.alteration > 0 ? 'sharp' : 'flat'}${n > 1 ? 's' : ''}`;
}
