import type { ExerciseDef, ExerciseInstance } from '../types';
import { generateScaleRun } from './scaleRun';
import { generateFiveFinger } from './fiveFinger';
import { generateChordGrip } from './chordGrip';
import { generateGripInterleave } from './gripInterleave';
import { generateFlashcard } from './flashcard';
import { generateNoteFind } from './noteFind';
import { generateEarDegree, generateEarQuality } from './ear';
import { generateProgressionPlay } from './progressionPlay';
import { generateChartPlay } from './chartPlay';

export type Generator = (def: ExerciseDef, seed: number) => ExerciseInstance;

export const GENERATORS: Record<string, Generator> = {
  'scale-run': generateScaleRun,
  'five-finger': generateFiveFinger,
  'chord-grip': generateChordGrip,
  'grip-interleave': generateGripInterleave,
  flashcard: generateFlashcard,
  'note-find': generateNoteFind,
  'ear-degree': generateEarDegree,
  'ear-quality': generateEarQuality,
  'progression-play': generateProgressionPlay,
  'chart-play': generateChartPlay,
};

export function generate(def: ExerciseDef, seed: number): ExerciseInstance {
  const gen = GENERATORS[def.generator];
  if (!gen) throw new Error(`Unknown generator: ${def.generator}`);
  return gen(def, seed);
}
