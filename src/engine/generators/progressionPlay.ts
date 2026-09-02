import { z } from 'zod';
import { buildChord, chordSymbol, type ChordQuality } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';

const keySchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

export const progressionPlayParams = z.object({
  key: keySchema,
  roman: z.array(z.string()).min(2),
  beatsPerChord: z.number().int().min(1).max(8).default(4),
  loops: z.number().int().min(1).max(4).default(2),
});

export interface ChordEvent {
  symbol: string;
  roman: string;
  root: string;
  quality: ChordQuality;
  degree: number;
  atBeat: number;
  beats: number;
}

export function chordTargets(events: ChordEvent[]): Target[] {
  return events.map((e) => ({
    kind: 'set',
    midis: buildChord({ root: e.root, quality: e.quality, inversion: 0 }, 48),
    atBeat: e.atBeat,
    label: e.symbol,
    octaveFlexible: true,
    inversionOf: { root: e.root, quality: e.quality, inversion: 0 },
  }));
}

/** Play a roman-numeral progression on the beat grid, any voicing with the root in the bass. */
export function generateProgressionPlay(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = progressionPlayParams.parse(def.params);
  const chords = progressionChords(p.roman, p.key);
  const events: ChordEvent[] = [];
  let beat = 0;
  for (let loop = 0; loop < p.loops; loop++) {
    for (const c of chords) {
      events.push({
        symbol: chordSymbol(c.root, c.quality),
        roman: c.roman,
        root: c.root,
        quality: c.quality,
        degree: c.degree,
        atBeat: beat,
        beats: p.beatsPerChord,
      });
      beat += p.beatsPerChord;
    }
  }
  const targets = chordTargets(events);
  return {
    def,
    seed,
    targets,
    prompt: {
      title: `${p.roman.join(' – ')} in ${p.key.tonic} ${p.key.mode}`,
      detail: `One chord every ${p.beatsPerChord} beats · ${p.loops} times around`,
      key: p.key,
      perTarget: events.map((e) => ({ label: e.symbol, detail: e.roman })),
    },
  };
}
