import { tr } from '@/i18n';
import { z } from 'zod';
import { buildChord, chordSymbol } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import { scaleMidis, type ScaleType } from '@/theory/scales';
import { namePc } from '@/theory/notes';
import { createRng } from '../rng';
import type { DemoNote, ExerciseDef, ExerciseInstance, Target } from '../types';

const keySchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

export const improvParams = z.object({
  key: keySchema,
  /** Which notes the learner is invited to use. */
  palette: z.enum(['degrees123', 'pentatonic', 'blues', 'chordtones']).default('degrees123'),
  /** Backing chords looped underneath; empty = drone on the tonic. */
  roman: z.array(z.string()).default([]),
  beatsPerChord: z.number().int().min(2).max(8).default(4),
  loops: z.number().int().min(1).max(8).default(2),
  bpm: z.number().int().min(40).max(200).default(84),
  /**
   * Chord-tone targeting (s7.u3): the downbeat of each bar is a real target —
   * everything between the downbeats is free. Off = pure free play.
   */
  targetDownbeats: z.boolean().default(false),
});

const PALETTE_SCALE: Record<string, ScaleType> = {
  pentatonic: 'major-pentatonic',
  blues: 'blues',
};

export const PALETTE_LABEL: Record<string, string> = {
  degrees123: tr('degrees 1, 2 and 3'),
  pentatonic: tr('the major pentatonic'),
  blues: tr('the blues scale'),
  chordtones: tr('the chord tones'),
};

/** The pitch classes the palette offers, for keyboard tinting. */
export function palettePcs(key: { tonic: string; mode: string }, palette: string): number[] {
  const tonicPc = namePc(key.tonic) ?? 0;
  if (palette === 'degrees123') {
    const steps = key.mode === 'minor' ? [0, 2, 3] : [0, 2, 4];
    return steps.map((s) => (tonicPc + s) % 12);
  }
  const scaleType = PALETTE_SCALE[palette];
  if (!scaleType) return [];
  return scaleMidis(key.tonic, scaleType, 1, 4).map((m) => m % 12);
}

/**
 * Improvisation over a backing loop (06 Stage 7). Free play by default — the
 * app plays the changes, the learner answers. With `targetDownbeats` the
 * downbeat of each bar becomes a scored chord-tone target, which is the whole
 * lesson of s7.u3: land somewhere true when the chord turns over.
 */
export function generateImprov(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = improvParams.parse(def.params);
  const rng = createRng(seed);
  const romans = p.roman.length > 0 ? p.roman : p.key.mode === 'minor' ? ['i'] : ['I'];
  const chords = progressionChords(romans, p.key);

  const targets: Target[] = [];
  const perTarget: { label: string; detail?: string }[] = [];
  const backing: DemoNote[] = [];

  let beat = 0;
  for (let loop = 0; loop < p.loops; loop++) {
    for (const c of chords) {
      // Backing: the chord under the improviser, quiet and out of the way.
      const voicing = buildChord({ root: c.root, quality: c.quality, inversion: 0 }, 48);
      for (const midi of voicing) {
        backing.push({ midi, atBeat: beat, durBeats: p.beatsPerChord });
      }
      if (p.targetDownbeats) {
        // Any chord tone of the bar, in any octave, counts as landing home.
        targets.push({
          kind: 'chord-any',
          accept: [{ root: c.root, quality: c.quality }],
          bassRootOk: true,
          label: chordSymbol(c.root, c.quality),
          atBeat: beat,
        });
        perTarget.push({
          label: tr('Land on {v0}', { v0: chordSymbol(c.root, c.quality) }),
          detail: tr('Any chord tone, any octave — then play freely until the next bar'),
        });
      }
      beat += p.beatsPerChord;
    }
  }

  // A free-play instance still needs one nominal target or the run cannot end;
  // use the tonic so an unscored session has something to focus.
  if (targets.length === 0) {
    const tonic = chords[0] ?? { root: p.key.tonic, quality: 'maj' as const };
    targets.push({
      kind: 'chord-any',
      accept: [{ root: tonic.root, quality: tonic.quality }],
      bassRootOk: true,
      label: chordSymbol(tonic.root, tonic.quality),
    });
    perTarget.push({
      label: tr('Play'),
      detail: tr('Use {v0} — no score, no wrong notes', { v0: PALETTE_LABEL[p.palette] ?? 'the palette' }),
    });
  }

  // Vary the opening call slightly per seed so a repeat run does not feel canned.
  const opener = rng.pick([
    tr('Start on a long note.'),
    tr('Start with a short phrase, then leave a gap.'),
    tr('Answer the backing, do not race it.'),
  ]);

  return {
    def,
    seed,
    targets,
    beatsPerTarget: p.beatsPerChord,
    prompt: {
      title: tr('Improvise in {v0} {v1}', { v0: p.key.tonic, v1: p.key.mode }),
      detail: tr('{v0} · {v1}', { v0: PALETTE_LABEL[p.palette] ?? '', v1: opener }),
      key: p.key,
      perTarget,
    },
    audioPreview: { notes: backing, bpm: p.bpm },
  };
}
