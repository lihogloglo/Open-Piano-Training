import { tr } from '@/i18n';
import { z } from 'zod';
import { degreeToMidi, type Degree } from '@/theory/degrees';
import { buildChord, chordSymbol, QUALITY_INTERVALS, type ChordQuality } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import { namePc } from '@/theory/notes';
import { createRng } from '../rng';
import type { DemoNote, ExerciseDef, ExerciseInstance, Target } from '../types';

const keySchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

export const earDegreeParams = z.object({
  key: keySchema,
  degreePool: z.array(z.number().int().min(1).max(7)).min(1),
  count: z.number().int().min(1).max(20).default(6),
});

/** I–IV–V–I cadence establishing the key, one chord per beat. */
function cadenceNotes(tonic: string, mode: 'major' | 'minor'): DemoNote[] {
  const chords = progressionChords(mode === 'major' ? ['I', 'IV', 'V', 'I'] : ['i', 'iv', 'V', 'i'], {
    tonic,
    mode,
  });
  return chords.flatMap((c, i) =>
    buildChord({ root: c.root, quality: c.quality, inversion: 0 }, 55).map((midi) => ({
      midi,
      atBeat: i,
      durBeats: i === chords.length - 1 ? 2 : 1,
    })),
  );
}

/**
 * Functional ear training: cadence establishes the key, then single-degree
 * probes; the learner answers ON THE KEYBOARD (any octave).
 */
export function generateEarDegree(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = earDegreeParams.parse(def.params);
  const rng = createRng(seed);
  const tonicPc = namePc(p.key.tonic) ?? 0;
  const tonicMidi = 60 + tonicPc; // tonic placed in the C4..B4 octave

  const targets: Target[] = [];
  const previews: { notes: DemoNote[]; bpm: number }[] = [];
  let prev = -1;
  for (let i = 0; i < p.count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const degree = rng.pick(p.degreePool) as Degree;
      if (degree === prev && p.degreePool.length > 1) continue;
      prev = degree;
      const octaveShift = rng.int(2) * 12; // probe in one of two octaves
      const probeMidi = degreeToMidi(degree, p.key, tonicMidi) + octaveShift;
      targets.push({ kind: 'any-of-degree', degree, key: p.key });
      previews.push({ notes: [{ midi: probeMidi, atBeat: 0, durBeats: 2 }], bpm: 80 });
      break;
    }
  }

  return {
    def,
    seed,
    targets,
    beatsPerTarget: 2,
    audioPreview: { notes: cadenceNotes(p.key.tonic, p.key.mode), bpm: 90 },
    perTargetPreview: previews,
    prompt: {
      title: tr('Ear: scale degrees in {v0} {v1}', { v0: p.key.tonic, v1: p.key.mode }),
      detail: tr('Listen, then play the degree you heard — any octave'),
      key: p.key,
      perTarget: targets.map(() => ({ label: tr('Which degree was that?'), detail: tr('Play it anywhere') })),
    },
  };
}

const qualityEnum = z.enum(Object.keys(QUALITY_INTERVALS) as [ChordQuality, ...ChordQuality[]]);

export const earQualityParams = z.object({
  qualityPool: z.array(qualityEnum).min(2),
  roots: z.array(z.string()).min(1).default(['C']),
  count: z.number().int().min(1).max(20).default(6),
});

/**
 * Chord-quality recognition: a chord plays on a DISPLAYED root; the learner
 * rebuilds it — same root, whichever quality they heard.
 */
export function generateEarQuality(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = earQualityParams.parse(def.params);
  const rng = createRng(seed);
  const targets: Target[] = [];
  const previews: { notes: DemoNote[]; bpm: number }[] = [];
  const perTarget: { label: string; detail?: string }[] = [];
  let prev = '';
  for (let i = 0; i < p.count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const root = rng.pick(p.roots);
      const quality = rng.pick(p.qualityPool);
      const gripKey = `${root}:${quality}`;
      if (gripKey === prev) continue;
      prev = gripKey;
      const midis = buildChord({ root, quality, inversion: 0 }, 55);
      targets.push({
        kind: 'set',
        midis,
        label: chordSymbol(root, quality),
        octaveFlexible: true,
      });
      previews.push({ notes: midis.map((midi) => ({ midi, atBeat: 0, durBeats: 2 })), bpm: 80 });
      const displayRoot = root.replace('#', '♯').replace(/(?<=.)b/, '♭');
      perTarget.push({
        label: tr('{v0} — but which {v1}?', { v0: displayRoot, v1: displayRoot }),
        detail: tr('Play the chord you heard on that root'),
      });
      break;
    }
  }
  return {
    def,
    seed,
    targets,
    beatsPerTarget: 2,
    perTargetPreview: previews,
    prompt: { title: tr('Ear: chord quality'), detail: tr('Listen, then rebuild the chord'), perTarget },
  };
}

export const earProgressionParams = z.object({
  key: keySchema,
  /** Progressions to recognize, e.g. [['I','V','vi','IV'], ['I','IV','V','I']]. */
  pool: z.array(z.array(z.string()).min(2)).min(2),
  count: z.number().int().min(1).max(10).default(4),
  /** Playing just the bass root of each chord also counts (default true). */
  bassRootsOk: z.boolean().default(true),
});

/**
 * Progression recognition: a whole progression plays, then the learner answers
 * chord by chord — the full chord (any voicing) or, if allowed, its bass root.
 */
export function generateEarProgression(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = earProgressionParams.parse(def.params);
  const rng = createRng(seed);
  const targets: Target[] = [];
  const previews: ({ notes: DemoNote[]; bpm: number } | undefined)[] = [];
  const perTarget: { label: string; detail?: string }[] = [];

  let prevIdx = -1;
  for (let item = 0; item < p.count; item++) {
    let poolIdx = rng.int(p.pool.length);
    if (poolIdx === prevIdx) poolIdx = (poolIdx + 1) % p.pool.length;
    prevIdx = poolIdx;
    const romans = p.pool[poolIdx] ?? [];
    const chords = progressionChords(romans, p.key);

    // The whole progression sounds once, at the item's first target.
    const notes: DemoNote[] = chords.flatMap((c, bar) =>
      buildChord({ root: c.root, quality: c.quality, inversion: 0 }, 48).map((midi) => ({
        midi,
        atBeat: bar,
        durBeats: 1,
      })),
    );

    chords.forEach((c, bar) => {
      targets.push({
        kind: 'chord-any',
        accept: [{ root: c.root, quality: c.quality }],
        ...(p.bassRootsOk ? { bassRootOk: true } : {}),
        label: tr('Chord {v0} of {v1}', { v0: bar + 1, v1: chords.length }),
      });
      previews.push(bar === 0 ? { notes, bpm: 76 } : undefined);
      perTarget.push({
        label: tr('Chord {v0} of {v1} — what was it?', { v0: bar + 1, v1: chords.length }),
        detail: p.bassRootsOk ? tr('Play the chord, or just its bass note') : tr('Play the chord you heard'),
      });
    });
  }

  return {
    def,
    seed,
    targets,
    beatsPerTarget: 2,
    perTargetPreview: previews,
    prompt: {
      title: tr('Ear: name the progression ({v0} {v1})', { v0: p.key.tonic, v1: p.key.mode }),
      detail: tr('A progression plays — answer it back, chord by chord'),
      key: p.key,
      perTarget,
    },
  };
}
