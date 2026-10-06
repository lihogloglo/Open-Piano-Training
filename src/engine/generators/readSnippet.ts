import { tr } from '@/i18n';
import { z } from 'zod';
import { scaleMidis, type ScaleType } from '@/theory/scales';
import { midiToName } from '@/theory/notes';
import { createRng } from '../rng';
import { staffFromNotes, type TimedNote } from '../staff';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

const keySchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

/**
 * Bar rhythms, per meter. A positive number is a note of that many beats, a negative
 * one is a rest. Each pool only uses lengths the learner has met by then.
 */
const RHYTHMS: Record<string, Record<number, number[][]>> = {
  quarters: { 4: [[1, 1, 1, 1]], 3: [[1, 1, 1]], 2: [[1, 1]] },
  halves: {
    4: [[1, 1, 1, 1], [2, 2], [1, 1, 2], [2, 1, 1]],
    3: [[1, 1, 1], [2, 1], [1, 2]],
    2: [[1, 1], [2]],
  },
  long: {
    4: [[1, 1, 1, 1], [2, 2], [1, 1, 2], [2, 1, 1], [4]],
    3: [[1, 1, 1], [2, 1], [1, 2], [3]],
    2: [[1, 1], [2]],
  },
  rests: {
    4: [[1, 1, 1, 1], [1, -1, 1, 1], [1, 1, 1, -1], [2, -1, 1], [1, 1, 2], [-1, 1, 1, 1]],
    3: [[1, 1, 1], [1, -1, 1], [2, -1], [1, 1, -1]],
    2: [[1, 1], [1, -1], [2]],
  },
  eighths: {
    4: [[1, 1, 1, 1], [0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 1, 1], [1, 1, 0.5, 0.5, 1], [0.5, 0.5, 0.5, 0.5, 2], [1, -1, 0.5, 0.5, 1]],
    3: [[1, 1, 1], [0.5, 0.5, 1, 1], [1, 0.5, 0.5, 1], [2, 0.5, 0.5]],
    2: [[1, 1], [0.5, 0.5, 1], [1, 0.5, 0.5]],
  },
  dotted: {
    4: [[1, 1, 1, 1], [1.5, 0.5, 1, 1], [1, 1, 1.5, 0.5], [1.5, 0.5, 2], [2, 1.5, 0.5]],
    3: [[1, 1, 1], [1.5, 0.5, 1], [3]],
    2: [[1, 1], [1.5, 0.5]],
  },
};

export const readSnippetParams = z.object({
  key: keySchema,
  /** Staff to read from. */
  clef: z.enum(['treble', 'bass']).default('treble'),
  bars: z.number().int().min(1).max(8).default(2),
  beatsPerBar: z.number().int().min(2).max(4).default(4),
  /** Largest step between consecutive notes, in scale degrees. */
  maxLeap: z.number().int().min(1).max(4).default(2),
  scaleType: z.enum(['major', 'natural-minor', 'major-pentatonic']).default('major'),
  /** Rhythm pool, see RHYTHMS. The default is one quarter note per beat. */
  rhythm: z.enum(['quarters', 'halves', 'long', 'rests', 'eighths', 'dotted']).default('quarters'),
  /** Lowest and highest note allowed. Beginner lessons read a few notes near middle C. */
  low: z.number().int().min(21).max(108).optional(),
  high: z.number().int().min(21).max(108).optional(),
});

/** Where each clef sits comfortably under one hand. */
const CLEF_CENTER: Record<string, number> = { treble: 67, bass: 50 };

/**
 * Sight-reading (06 Stage 8 / read strand): a short stepwise phrase in a known
 * key, generated fresh so it cannot be memorized. The phrase is written on
 * `prompt.staff`, so the staff is the only place the notes appear.
 */
export function generateReadSnippet(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = readSnippetParams.parse(def.params);
  const rng = createRng(seed);

  // Two octaves of the key's scale around the clef's home register.
  const startOctave = p.clef === 'bass' ? 2 : 4;
  let pool = [
    ...scaleMidis(p.key.tonic, p.scaleType as ScaleType, 2, startOctave - 1),
    ...scaleMidis(p.key.tonic, p.scaleType as ScaleType, 2, startOctave + 1),
  ].sort((a, b) => a - b);
  pool = [...new Set(pool)];
  const low = p.low ?? (p.clef === 'bass' ? 40 : 57);
  const high = p.high ?? (p.clef === 'bass' ? 62 : 81);
  pool = pool.filter((m) => m >= low && m <= high);
  if (pool.length === 0) pool = [CLEF_CENTER[p.clef] ?? 67];
  const center = p.low !== undefined && p.high !== undefined ? (low + high) / 2 : (CLEF_CENTER[p.clef] ?? 67);
  let idx = pool.reduce(
    (best, midi, i) => (Math.abs(midi - center) < Math.abs((pool[best] ?? 0) - center) ? i : best),
    0,
  );

  const patterns = RHYTHMS[p.rhythm]?.[p.beatsPerBar] ?? [Array<number>(p.beatsPerBar).fill(1)];
  const lengths: number[] = [];
  for (let bar = 0; bar < p.bars; bar++) {
    // The first bar starts with a note, so the learner never opens on a silence.
    const usable = patterns.filter((pat) => (bar === 0 ? pat[0]! > 0 : true));
    lengths.push(...(usable[rng.int(usable.length)] ?? patterns[0]!));
  }

  const notes: TimedNote[] = [];
  let at = 0;
  for (const len of lengths) {
    if (len > 0) {
      const midi = pool[idx] ?? center;
      notes.push({ midi, atBeat: at, durBeats: len * 0.9 });
      // Step or small leap, kept inside the pool.
      const leap = 1 + rng.int(p.maxLeap);
      const dir = rng.next() < 0.5 ? -1 : 1;
      let next = idx + dir * leap;
      if (next < 0 || next >= pool.length) next = idx - dir * leap;
      idx = Math.max(0, Math.min(pool.length - 1, next));
    }
    at += Math.abs(len);
  }
  // End on the home note nearest the last pitch, if one is in range and close.
  const last = notes[notes.length - 1];
  if (last) {
    const tonicPc = scaleMidis(p.key.tonic, p.scaleType as ScaleType)[0]! % 12;
    const home = pool
      .filter((m) => m % 12 === tonicPc)
      .sort((a, b) => Math.abs(a - last.midi) - Math.abs(b - last.midi))[0];
    const prev = notes[notes.length - 2]?.midi ?? last.midi;
    if (home !== undefined && Math.abs(home - prev) <= 4) last.midi = home;
  }

  const targets: Target[] = notes.map((n) => ({ kind: 'note', midi: n.midi, atBeat: n.atBeat }));
  return {
    def,
    seed,
    targets,
    beatsPerBar: p.beatsPerBar,
    beatsPerTarget: 1,
    prompt: {
      title: tr('Read it'),
      detail: tr('Play what you see.'),
      key: p.key,
      perTarget: notes.map((n) => ({ label: midiToName(n.midi, p.key) })),
      staff: staffFromNotes(notes, { clef: p.clef, beatsPerBar: p.beatsPerBar }),
    },
  };
}

/** The midi notes of a snippet instance, in playing order. */
export function snippetNotes(instance: ExerciseInstance): number[] {
  return instance.targets.flatMap((t) => (t.kind === 'note' ? [t.midi] : []));
}
