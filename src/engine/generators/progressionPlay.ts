import { z } from 'zod';
import { buildChord, chordSymbol, slashChordSymbol, type ChordQuality } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import { diatonicTriads } from '@/theory/keys';
import { namePc } from '@/theory/notes';
import { createRng } from '../rng';
import { smoothVoicings } from '../voiceLeading';
import type { DemoNote, ExerciseDef, ExerciseInstance, Target } from '../types';

const keySchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

export const progressionPlayParams = z.object({
  key: keySchema,
  roman: z.array(z.string()).min(2),
  beatsPerChord: z.number().int().min(1).max(8).default(4),
  loops: z.number().int().min(1).max(4).default(2),
  voiceLead: z.enum(['free', 'smooth']).default('free'),
  style: z.enum(['block', 'brokenLH']).default('block'),
  /** Harmonization mode: a generated melody note per bar; any fitting diatonic
   *  chord passes (contains the melody note OR matches the bar's function). */
  acceptAlternatives: z.boolean().default(false),
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

/** Tonic/subdominant/dominant families by scale degree (functional matching). */
const FUNCTION_GROUPS: Record<number, number[]> = {
  1: [1, 6, 3],
  2: [4, 2],
  3: [1, 6, 3],
  4: [4, 2],
  5: [5, 7],
  6: [1, 6, 3],
  7: [5, 7],
};

/** Play a roman-numeral progression on the beat grid, any voicing with the root in the bass. */
export function generateProgressionPlay(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = progressionPlayParams.parse(def.params);
  if (p.acceptAlternatives) return generateHarmonize(def, seed);
  const chords = progressionChords(p.roman, p.key);

  const smooth = p.voiceLead === 'smooth' ? smoothVoicings(chords, 55) : null;

  const events: ChordEvent[] = [];
  let beat = 0;
  for (let loop = 0; loop < p.loops; loop++) {
    for (let ci = 0; ci < chords.length; ci++) {
      const c = chords[ci];
      if (!c) continue;
      const inv = smooth?.[ci]?.inversion ?? 0;
      events.push({
        symbol: inv > 0 ? slashChordSymbol(c.root, c.quality, inv) : chordSymbol(c.root, c.quality),
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

  const targets: Target[] = [];
  const ideal: number[][] = [];
  const labels: string[] = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e) continue;
    const voicing = smooth?.[i % chords.length];

    if (p.style === 'brokenLH') {
      // LH broken pattern: root · fifth · root+octave · fifth, one per beat.
      const lhRoot = lowRoot(e.root);
      const pattern = [lhRoot, lhRoot + 7, lhRoot + 12, lhRoot + 7];
      for (let b = 0; b < e.beats; b++) {
        targets.push({ kind: 'note', midi: pattern[b % 4] ?? lhRoot, atBeat: e.atBeat + b });
        ideal.push([]);
        labels.push(e.symbol);
      }
      if (def.hand === 'both') {
        // RH chord on the bar line, exact voicing so LH notes can't cross-match.
        const midis = voicing?.midis ?? buildChord({ root: e.root, quality: e.quality, inversion: 0 }, 60);
        targets.push({ kind: 'set', midis, atBeat: e.atBeat, label: e.symbol, octaveFlexible: false });
        ideal.push(midis);
        labels.push(e.symbol);
      }
    } else if (voicing) {
      targets.push({
        kind: 'set',
        midis: voicing.midis,
        atBeat: e.atBeat,
        label: e.symbol,
        octaveFlexible: true,
        inversionOf: { root: e.root, quality: e.quality, inversion: voicing.inversion },
      });
      ideal.push(voicing.midis);
      labels.push(e.symbol);
    } else {
      targets.push({
        kind: 'set',
        midis: buildChord({ root: e.root, quality: e.quality, inversion: 0 }, 48),
        atBeat: e.atBeat,
        label: e.symbol,
        octaveFlexible: true,
        inversionOf: { root: e.root, quality: e.quality, inversion: 0 },
      });
      ideal.push([]);
      labels.push(e.symbol);
    }
  }

  // Sort by beat so mixed brokenLH note/set targets stay grid-ordered.
  const order = targets
    .map((t, i) => ({ t, i, beat: t.atBeat ?? 0, setFirst: t.kind === 'set' ? 0 : 1 }))
    .sort((a, b) => a.beat - b.beat || a.setFirst - b.setFirst);
  const sortedTargets = order.map((o) => o.t);
  const sortedIdeal = order.map((o) => ideal[o.i] ?? []);
  const sortedLabels = order.map((o) => labels[o.i] ?? '');

  const styleNote = p.style === 'brokenLH' ? 'LH broken pattern' : 'block chords';
  const leadNote = p.voiceLead === 'smooth' ? ' · smallest possible moves' : '';
  return {
    def,
    seed,
    targets: sortedTargets,
    prompt: {
      title: `${p.roman.join(' – ')} in ${p.key.tonic} ${p.key.mode}`,
      detail: `${styleNote} · one chord every ${p.beatsPerChord} beats · ${p.loops}× around${leadNote}`,
      key: p.key,
      perTarget: sortedLabels.map((label) => ({ label })),
    },
    ...(smooth ? { voiceLeading: { ideal: sortedIdeal } } : {}),
  };
}

function lowRoot(root: string): number {
  const pc = namePc(root) ?? 0;
  let midi = 36; // C2
  while (midi % 12 !== pc) midi++;
  return midi;
}

/**
 * Harmonization (acceptAlternatives): the roman list is the canonical
 * progression; a melody note (a chord tone, degrees shown) is generated per
 * bar. Any diatonic triad that contains the melody note, or that shares the
 * canonical chord's function, is a valid answer. Wait mode.
 */
function generateHarmonize(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = progressionPlayParams.parse(def.params);
  const rng = createRng(seed);
  const chords = progressionChords(p.roman, p.key);
  const triads = diatonicTriads(p.key);
  const tonicPc = namePc(p.key.tonic) ?? 0;
  const tonicMidi = 60 + tonicPc;

  const targets: Target[] = [];
  const previews: ({ notes: DemoNote[]; bpm: number } | undefined)[] = [];
  const perTarget: { label: string; detail?: string }[] = [];

  for (const c of chords) {
    // Melody note: one of the canonical chord's tones, placed above middle C.
    const chordMidis = buildChord({ root: c.root, quality: c.quality, inversion: 0 }, tonicMidi);
    const melodyMidi = rng.pick(chordMidis) ?? chordMidis[0] ?? tonicMidi;
    const melodyPc = melodyMidi % 12;
    const melodyDegree = triads.findIndex((t) => (namePc(t.root) ?? -1) === melodyPc) + 1;

    const functional = FUNCTION_GROUPS[c.degree] ?? [c.degree];
    const accept = triads
      .filter((t) => {
        const pcs = buildChord({ root: t.root, quality: t.quality, inversion: 0 }, 48).map((m) => m % 12);
        return pcs.includes(melodyPc) || functional.includes(t.degree);
      })
      .map((t) => ({ root: t.root, quality: t.quality as ChordQuality }));

    targets.push({
      kind: 'chord-any',
      accept,
      label: `Harmonize ${melodyDegreeLabel(melodyDegree)}`,
    });
    previews.push({ notes: [{ midi: melodyMidi, atBeat: 0, durBeats: 2 }], bpm: 80 });
    perTarget.push({
      label: `Melody: ${melodyDegreeLabel(melodyDegree)}`,
      detail: 'Play any chord that fits — there are several right answers',
    });
  }

  return {
    def,
    seed,
    targets,
    beatsPerTarget: 2,
    perTargetPreview: previews,
    prompt: {
      title: `Harmonize a melody in ${p.key.tonic} ${p.key.mode}`,
      detail: 'Each melody note wants a chord — pick one that contains it or does the same job',
      key: p.key,
      perTarget,
    },
  };
}

function melodyDegreeLabel(degree: number): string {
  return degree >= 1 && degree <= 7 ? `degree ${degree}` : 'this note';
}
