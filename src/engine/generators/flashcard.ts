import { z } from 'zod';
import { keySignature, type KeyContext } from '@/theory/keys';
import { namePc } from '@/theory/notes';
import { parseRoman } from '@/theory/progressions';
import { QUALITY_INTERVALS, type ChordQuality, chordSymbol, buildChord } from '@/theory/chords';
import { createRng } from '../rng';
import type { ExerciseDef, ExerciseInstance, Target } from '../types';
function freeChord(root: string, quality: ChordQuality): Target {
  return {
    kind: 'set',
    midis: buildChord({ root, quality, inversion: 0 }, 48),
    label: chordSymbol(root, quality),
    octaveFlexible: true,
  };
}

const qualityEnum = z.enum(Object.keys(QUALITY_INTERVALS) as [ChordQuality, ...ChordQuality[]]);

export const flashcardParams = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('spell'),
    roots: z.array(z.string()).min(1),
    qualities: z.array(qualityEnum).min(1),
    count: z.number().int().min(1).max(30).default(10),
  }),
  z.object({
    kind: z.literal('interval'),
    roots: z.array(z.string()).min(1),
    intervals: z
      .array(z.enum(['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']))
      .min(1),
    count: z.number().int().min(1).max(30).default(10),
  }),
  z.object({
    kind: z.literal('roman'),
    keys: z.array(z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) })).min(1),
    romans: z.array(z.string()).min(1),
    count: z.number().int().min(1).max(30).default(10),
  }),
]);

const INTERVAL_SEMITONES: Record<string, number> = {
  m2: 1,
  M2: 2,
  m3: 3,
  M3: 4,
  P4: 5,
  TT: 6,
  P5: 7,
  m6: 8,
  M6: 9,
  m7: 10,
  M7: 11,
  P8: 12,
};

const INTERVAL_NAMES: Record<string, string> = {
  m2: 'minor 2nd',
  M2: 'major 2nd',
  m3: 'minor 3rd',
  M3: 'major 3rd',
  P4: 'perfect 4th',
  TT: 'tritone',
  P5: 'perfect 5th',
  m6: 'minor 6th',
  M6: 'major 6th',
  m7: 'minor 7th',
  M7: 'major 7th',
  P8: 'octave',
};

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
      if (p.kind === 'spell') {
        const root = rng.pick(p.roots);
        const quality = rng.pick(p.qualities);
        const cardKey = `${root}:${quality}`;
        if (cardKey === prev && (p.roots.length > 1 || p.qualities.length > 1)) continue;
        prev = cardKey;
        targets.push(freeChord(root, quality));
        perTarget.push({ label: `Spell ${chordSymbol(root, quality)}`, detail: 'Play it in any octave' });
      } else if (p.kind === 'roman') {
        const key = rng.pick(p.keys);
        const roman = rng.pick(p.romans);
        const cardKey = `${key.tonic}:${key.mode}:${roman}`;
        if (cardKey === prev && (p.keys.length > 1 || p.romans.length > 1)) continue;
        prev = cardKey;
        const chord = parseRoman(roman, key);
        targets.push(freeChord(chord.root, chord.quality));
        perTarget.push({
          label: `${roman} in ${key.tonic} ${key.mode} is…?`,
          detail: 'Play the chord — any octave',
        });
      } else {
        const root = rng.pick(p.roots);
        const interval = rng.pick(p.intervals);
        const cardKey = `${root}:${interval}`;
        if (cardKey === prev && (p.roots.length > 1 || p.intervals.length > 1)) continue;
        prev = cardKey;
        const base = nameToMidiSafe(root);
        const midis = [base, base + (INTERVAL_SEMITONES[interval] ?? 0)];
        const display = root.replace('#', '♯').replace(/(?<=.)b/, '♭');
        targets.push({
          kind: 'set',
          midis,
          label: `${INTERVAL_NAMES[interval]} above ${display}`,
          octaveFlexible: true,
          transposeOnly: true,
        });
        perTarget.push({
          label: `Play a ${INTERVAL_NAMES[interval]} above ${display}`,
          detail: 'Both notes together — any octave',
        });
      }
      break;
    }
  }
  return {
    def,
    seed,
    targets,
    beatsPerTarget: 2,
    prompt: {
      title:
        p.kind === 'spell' ? 'Spelling drill' : p.kind === 'roman' ? 'Roman numeral drill' : 'Interval drill',
      detail:
        p.kind === 'spell'
          ? 'Build each chord from its symbol'
          : p.kind === 'roman'
            ? 'Turn each numeral into the chord it names'
            : 'Measure up from each root',
      perTarget,
    },
  };
}

function nameToMidiSafe(root: string): number {
  return 60 + (namePc(root) ?? 0);
}

/** Helper used by future choice-mode cards; exported for tests. */
export function keySignatureAnswer(key: KeyContext): string {
  const sig = keySignature(key);
  if (sig.alteration === 0) return 'no sharps or flats';
  const n = Math.abs(sig.alteration);
  return `${n} ${sig.alteration > 0 ? 'sharp' : 'flat'}${n > 1 ? 's' : ''}`;
}
