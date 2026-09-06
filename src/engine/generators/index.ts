import { generatePhrase } from './phrase';
import type { ExerciseDef, ExerciseInstance } from '../types';
import { generateScaleRun } from './scaleRun';
import { generateFiveFinger } from './fiveFinger';
import { generateChordGrip } from './chordGrip';
import { generateGripInterleave } from './gripInterleave';
import { generateFlashcard } from './flashcard';
import { generateNoteFind } from './noteFind';
import { generateEarDegree, generateEarProgression, generateEarQuality } from './ear';
import { generateProgressionPlay } from './progressionPlay';
import { generateChartPlay } from './chartPlay';
import { generateUnseenChart } from './unseenChart';
import { generateImprov } from './improv';
import { generateReadSnippet } from './readSnippet';
import { generateKeyGroupFind } from './keyGroupFind';

export type Generator = (def: ExerciseDef, seed: number) => ExerciseInstance;

export const GENERATORS: Record<string, Generator> = {
  phrase: generatePhrase,
  'scale-run': generateScaleRun,
  'five-finger': generateFiveFinger,
  'chord-grip': generateChordGrip,
  'grip-interleave': generateGripInterleave,
  flashcard: generateFlashcard,
  'note-find': generateNoteFind,
  'ear-degree': generateEarDegree,
  'ear-quality': generateEarQuality,
  'ear-progression': generateEarProgression,
  'progression-play': generateProgressionPlay,
  'chart-play': generateChartPlay,
  'unseen-chart': generateUnseenChart,
  improv: generateImprov,
  'read-snippet': generateReadSnippet,
  'key-group-find': generateKeyGroupFind,
};

export function generate(def: ExerciseDef, seed: number): ExerciseInstance {
  const gen = GENERATORS[def.generator];
  if (!gen) throw new Error(`Unknown generator: ${def.generator}`);
  const instance = gen(def, seed);
  if (!def.focus) return instance;
  const { start, end } = def.focus;
  const spacing = instance.beatsPerTarget ?? 1;
  const origin = instance.targets[start]?.atBeat ?? start * spacing;
  return {
    ...instance,
    def: { ...def, assessment: false },
    targets: instance.targets
      .slice(start, end)
      .map((t, i) => ({ ...t, atBeat: (t.atBeat ?? (start + i) * spacing) - origin })),
    prompt: {
      ...instance.prompt,
      title: `Focused practice: ${instance.prompt.title}`,
      ...(instance.prompt.perTarget ? { perTarget: instance.prompt.perTarget.slice(start, end) } : {}),
    },
    perTargetPreview: instance.perTargetPreview?.slice(start, end),
    voiceLeading: instance.voiceLeading
      ? { ideal: instance.voiceLeading.ideal.slice(start, end) }
      : undefined,
  };
}
