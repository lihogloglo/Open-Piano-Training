import { tr } from '@/i18n';
import { z } from 'zod';
import { chordSymbol } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import { CIRCLE_OF_FIFTHS } from '@/theory/keys';
import { createRng, type Rng } from '../rng';
import type { ExerciseDef, ExerciseInstance } from '../types';
import { progressionTargets, type ChordEvent } from './progressionPlay';

const keySchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

export const unseenChartParams = z.object({
  /** Omit to let the seed pick the key too — that is the point of the exercise. */
  key: keySchema.optional(),
  form: z.enum(['aaba', 'verse-chorus', 'blues']).default('aaba'),
  sevenths: z.boolean().default(true),
  beatsPerChord: z.number().int().min(2).max(8).default(4),
  style: z
    .enum(['block', 'rootchord', 'brokenLH', 'straight8', 'ballad', 'boomchuck', 'swing'])
    .default('block'),
  voicing: z.enum(['triad', 'shell17', 'shell13', 'guidetones']).default('triad'),
  swing: z.number().min(0.5).max(0.7).default(0.5),
});

/**
 * Four-bar phrases the ear already knows. Sight-comping is not a test of
 * surprise — it is a test of whether the familiar shapes transfer to a chart
 * you have never seen, in a key you did not choose (06 s6.u8).
 */
const MAJOR_PHRASES: string[][] = [
  ['I', 'V', 'vi', 'IV'],
  ['I', 'vi', 'IV', 'V'],
  ['vi', 'IV', 'I', 'V'],
  ['I', 'IV', 'V', 'I'],
  ['ii', 'V', 'I', 'I'],
  ['I', 'iii', 'IV', 'V'],
  ['IV', 'I', 'ii', 'V'],
  ['I', 'V', 'IV', 'IV'],
];

/** The "B" of an AABA: it should leave home and want to come back. */
const BRIDGE_PHRASES: string[][] = [
  ['IV', 'IV', 'I', 'I'],
  ['ii', 'V', 'iii', 'vi'],
  ['IV', 'V', 'iii', 'vi'],
  ['vi', 'ii', 'V', 'V'],
];

const MINOR_PHRASES: string[][] = [
  ['i', 'VI', 'III', 'VII'],
  ['i', 'iv', 'v', 'i'],
  ['i', 'VII', 'VI', 'V'],
  ['i', 'iv', 'VI', 'V'],
];

/** 12-bar blues: dominant everywhere, the standard turnaround. */
const BLUES: string[] = ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'];

/** Add sevenths where they belong: ii/iii/vi get m7, V gets 7, I/IV get maj7. */
function withSevenths(roman: string): string {
  if (/7/.test(roman)) return roman;
  if (roman === 'V') return 'V7';
  if (roman === 'I' || roman === 'IV') return `${roman}maj7`;
  if (roman === 'ii' || roman === 'iii' || roman === 'vi') return `${roman}7`;
  return roman;
}

function buildRomans(form: string, sevenths: boolean, minor: boolean, rng: Rng): string[] {
  if (form === 'blues') return [...BLUES];
  const pool = minor ? MINOR_PHRASES : MAJOR_PHRASES;
  let romans: string[];
  if (form === 'aaba') {
    const a = rng.pick(pool);
    const b = minor ? rng.pick(MINOR_PHRASES) : rng.pick(BRIDGE_PHRASES);
    romans = [...a, ...a, ...b, ...a];
  } else {
    const verse = rng.pick(pool);
    let chorus = rng.pick(pool);
    for (let i = 0; i < 6 && chorus === verse && pool.length > 1; i++) chorus = rng.pick(pool);
    romans = [...verse, ...verse, ...chorus, ...chorus];
  }
  return sevenths && !minor ? romans.map(withSevenths) : romans;
}

/**
 * A chart the learner has genuinely never seen: form, key and phrases are all
 * chosen by the seed. Same playing surface as `chart-play`, so everything the
 * texture and voicing options do there works here too.
 */
export function generateUnseenChart(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = unseenChartParams.parse(def.params);
  const rng = createRng(seed);

  const minor = p.key ? p.key.mode === 'minor' : p.form !== 'blues' && rng.int(4) === 0;
  const key = p.key ?? {
    tonic: rng.pick([...CIRCLE_OF_FIFTHS]),
    mode: (minor ? 'minor' : 'major') as 'major' | 'minor',
  };
  const romans = buildRomans(p.form, p.sevenths, key.mode === 'minor', rng);
  const chords = progressionChords(romans, key);

  const events: ChordEvent[] = chords.map((c, i) => ({
    symbol: chordSymbol(c.root, c.quality),
    roman: c.roman,
    root: c.root,
    quality: c.quality,
    degree: c.degree,
    atBeat: i * p.beatsPerChord,
    beats: p.beatsPerChord,
  }));

  const { targets, labels } = progressionTargets(events, {
    style: p.style,
    voiceLead: 'free',
    hand: def.hand,
    voicing: p.voicing,
    swing: p.swing,
  });

  const formLabel =
    p.form === 'blues'
      ? tr('12-bar blues')
      : p.form === 'aaba'
        ? tr('AABA, 16 bars')
        : tr('Verse/chorus, 16 bars');
  return {
    def,
    seed,
    targets,
    prompt: {
      title: tr('Unseen chart — {v0} {v1}', { v0: key.tonic, v1: key.mode }),
      detail: tr('{v0} · read it down, two passes allowed', { v0: formLabel }),
      key,
      perTarget: labels.map((label) => ({ label })),
    },
  };
}

/** The bar-by-bar chart, for the prompt zone's grid (chart display). */
export function unseenChartBars(def: ExerciseDef, seed: number): { symbol: string; roman: string }[] {
  const p = unseenChartParams.parse(def.params);
  const rng = createRng(seed);
  const minor = p.key ? p.key.mode === 'minor' : p.form !== 'blues' && rng.int(4) === 0;
  const key = p.key ?? {
    tonic: rng.pick([...CIRCLE_OF_FIFTHS]),
    mode: (minor ? 'minor' : 'major') as 'major' | 'minor',
  };
  return progressionChords(buildRomans(p.form, p.sevenths, key.mode === 'minor', rng), key).map((c) => ({
    symbol: chordSymbol(c.root, c.quality),
    roman: c.roman,
  }));
}
