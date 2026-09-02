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
      title: `Ear: scale degrees in ${p.key.tonic} ${p.key.mode}`,
      detail: 'Listen, then play the degree you heard — any octave',
      key: p.key,
      perTarget: targets.map(() => ({ label: 'Which degree was that?', detail: 'Play it anywhere' })),
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
        inversionOf: { root, quality, inversion: 0 },
      });
      previews.push({ notes: midis.map((midi) => ({ midi, atBeat: 0, durBeats: 2 })), bpm: 80 });
      const displayRoot = root.replace('#', '♯').replace(/(?<=.)b/, '♭');
      perTarget.push({
        label: `${displayRoot} — but which ${displayRoot}?`,
        detail: 'Play the chord you heard on that root',
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
    prompt: { title: 'Ear: chord quality', detail: 'Listen, then rebuild the chord', perTarget },
  };
}
