import { z } from 'zod';
import { buildChord, chordSymbol, slashChordSymbol, type ChordQuality } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import { diatonicTriads } from '@/theory/keys';
import { namePc } from '@/theory/notes';
import { createRng } from '../rng';
import { smoothVoicings } from '../voiceLeading';
import {
  COMP_PATTERNS,
  VOICING_LABEL,
  swingBeat,
  voiceChord,
  type CompPattern,
  type VoicingStyle,
} from '../comp';
import type { DemoNote, ExerciseDef, ExerciseInstance, Target } from '../types';

const keySchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

export const progressionPlayParams = z.object({
  key: keySchema,
  roman: z.array(z.string()).min(2),
  beatsPerChord: z.number().int().min(1).max(8).default(4),
  loops: z.number().int().min(1).max(4).default(2),
  voiceLead: z.enum(['free', 'smooth']).default('free'),
  style: z
    .enum(['block', 'rootchord', 'brokenLH', 'straight8', 'ballad', 'boomchuck', 'swing'])
    .default('block'),
  /** Comping voicing (Stage 6): shells and guide tones instead of full triads. */
  voicing: z.enum(['triad', 'shell17', 'shell13', 'guidetones']).default('triad'),
  /** Swing ratio for the eighth-note grid; 0.5 = straight. */
  swing: z.number().min(0.5).max(0.7).default(0.5),
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

export interface ProgressionStyleOpts {
  style: 'block' | 'rootchord' | 'brokenLH' | CompPattern;
  voiceLead: 'free' | 'smooth';
  hand: 'rh' | 'lh' | 'both';
  voicing?: VoicingStyle;
  swing?: number;
}

function isCompPattern(style: string): style is CompPattern {
  return style in COMP_PATTERNS;
}

/**
 * Comping targets: the pattern says when each hand lands, the voicing says
 * what it plays. Hits outside the requested hand are dropped so an LH-only
 * shell drill does not silently demand the right hand too.
 */
function compTargets(
  event: ChordEvent,
  opts: ProgressionStyleOpts,
  symbol: string,
): { targets: Target[]; labels: string[] } {
  const pattern = COMP_PATTERNS[opts.style as CompPattern];
  const voiced = voiceChord(event.root, event.quality, opts.voicing ?? 'triad');
  const targets: Target[] = [];
  const labels: string[] = [];
  for (const hit of pattern.hits) {
    if (hit.beat >= event.beats) continue;
    if (opts.hand !== 'both' && hit.hand !== opts.hand) continue;
    // A triad voicing has no LH notes of its own: use the root.
    const midis =
      hit.hand === 'lh'
        ? voiced.lh.length > 0
          ? voiced.lh
          : [lowRoot(event.root) + (opts.style === 'boomchuck' && hit.beat === 2 ? 7 : 0)]
        : voiced.rh.length > 0
          ? voiced.rh
          : buildChord({ root: event.root, quality: event.quality, inversion: 0 }, 60);
    const atBeat = event.atBeat + swingBeat(hit.beat, opts.swing ?? 0.5);
    if (midis.length === 1) {
      targets.push({ kind: 'note', midi: midis[0]!, atBeat });
    } else {
      targets.push({
        kind: 'set',
        midis,
        atBeat,
        label: symbol,
        octaveFlexible: true,
        ...(opts.hand === 'both'
          ? {
              midiRange: hit.hand === 'rh' ? ([60, 108] as [number, number]) : ([21, 59] as [number, number]),
            }
          : {}),
      });
    }
    labels.push(symbol);
  }
  return { targets, labels };
}

/**
 * Turn a chord-event timeline into playable targets under a texture/voice-lead
 * choice. Shared by progression-play and chart-play. Returns targets sorted on
 * the beat grid, the reference voicings for vl scoring (smooth only), and a
 * per-target prompt label.
 */
export function progressionTargets(
  events: ChordEvent[],
  opts: ProgressionStyleOpts,
): { targets: Target[]; ideal: number[][] | null; labels: string[] } {
  const smooth =
    opts.voiceLead === 'smooth'
      ? smoothVoicings(
          events.map((e) => ({ root: e.root, quality: e.quality })),
          55,
          opts.hand === 'both' && (opts.style === 'rootchord' || opts.style === 'brokenLH') ? 60 : 21,
        )
      : null;

  const targets: Target[] = [];
  const ideal: number[][] = [];
  const labels: string[] = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e) continue;
    const voicing = smooth?.[i];
    const symbol =
      voicing &&
      voicing.inversion > 0 &&
      !(opts.hand === 'both' && (opts.style === 'rootchord' || opts.style === 'brokenLH'))
        ? slashChordSymbol(e.root, e.quality, voicing.inversion)
        : e.symbol;

    if (isCompPattern(opts.style)) {
      const comp = compTargets(e, opts, symbol);
      for (let k = 0; k < comp.targets.length; k++) {
        targets.push(comp.targets[k]!);
        ideal.push([]);
        labels.push(comp.labels[k] ?? symbol);
      }
    } else if (opts.style === 'rootchord' && opts.hand === 'both') {
      // The first two-hand texture there is: left hand takes the root, right
      // hand takes the chord, both landing on the bar line. One target, played
      // together — which is how a beginner actually meets two hands.
      const midis = voicing?.midis ?? buildChord({ root: e.root, quality: e.quality, inversion: 0 }, 60);
      targets.push({
        kind: 'set',
        midis: [lowRoot(e.root), ...midis],
        atBeat: e.atBeat,
        label: symbol,
        octaveFlexible: true,
        requiredBass: lowRoot(e.root),
        midiRange: [60, 108],
      });
      ideal.push([]);
      labels.push(symbol);
    } else if (opts.style === 'brokenLH') {
      // LH broken pattern: root · fifth · root+octave · fifth, one per beat.
      const lhRoot = lowRoot(e.root);
      const pattern = [lhRoot, lhRoot + 7, lhRoot + 12, lhRoot + 7];
      for (let b = 0; b < e.beats; b++) {
        targets.push({ kind: 'note', midi: pattern[b % 4] ?? lhRoot, atBeat: e.atBeat + b });
        ideal.push([]);
        labels.push(symbol);
      }
      if (opts.hand === 'both') {
        // RH chord above middle C so LH pattern notes cannot satisfy it.
        const midis = voicing?.midis ?? buildChord({ root: e.root, quality: e.quality, inversion: 0 }, 60);
        targets.push({
          kind: 'set',
          midis,
          atBeat: e.atBeat,
          label: symbol,
          octaveFlexible: true,
          midiRange: [60, 108],
        });
        ideal.push(midis);
        labels.push(symbol);
      }
    } else if (opts.voicing && opts.voicing !== 'triad') {
      // Shells / guide tones held as one block per bar (no rhythm pattern).
      const voiced = voiceChord(e.root, e.quality, opts.voicing);
      const midis = [...voiced.lh, ...(opts.hand === 'lh' ? [] : voiced.rh)].sort((a, b) => a - b);
      targets.push({ kind: 'set', midis, atBeat: e.atBeat, label: symbol, octaveFlexible: false });
      ideal.push([]);
      labels.push(symbol);
    } else if (voicing) {
      targets.push({
        kind: 'set',
        midis: voicing.midis,
        atBeat: e.atBeat,
        label: symbol,
        octaveFlexible: true,
        inversionOf: { root: e.root, quality: e.quality, inversion: voicing.inversion },
      });
      ideal.push(voicing.midis);
      labels.push(symbol);
    } else {
      targets.push({
        kind: 'set',
        midis: buildChord({ root: e.root, quality: e.quality, inversion: 0 }, 48),
        atBeat: e.atBeat,
        label: symbol,
        octaveFlexible: true,
      });
      ideal.push([]);
      labels.push(symbol);
    }
  }

  // Sort by beat so mixed brokenLH note/set targets stay grid-ordered.
  const order = targets
    .map((t, i) => ({ t, i, beat: t.atBeat ?? 0, setFirst: t.kind === 'set' ? 0 : 1 }))
    .sort((a, b) => a.beat - b.beat || a.setFirst - b.setFirst);
  return {
    targets: order.map((o) => o.t),
    ideal: smooth ? order.map((o) => ideal[o.i] ?? []) : null,
    labels: order.map((o) => labels[o.i] ?? ''),
  };
}

/** Play a roman-numeral progression on the beat grid, any inversion unless a specific voice-leading exercise requests one. */
export function generateProgressionPlay(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = progressionPlayParams.parse(def.params);
  if (p.acceptAlternatives) return generateHarmonize(def, seed);
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

  const { targets, ideal, labels } = progressionTargets(events, {
    style: p.style,
    voiceLead: p.voiceLead,
    hand: def.hand,
    voicing: p.voicing,
    swing: p.swing,
  });

  const styleNote = isCompPattern(p.style)
    ? `${COMP_PATTERNS[p.style].label} · ${VOICING_LABEL[p.voicing]}`
    : p.style === 'rootchord' && def.hand === 'both'
      ? 'LH root, RH chord'
      : p.style === 'brokenLH'
        ? 'LH broken pattern'
        : p.voicing !== 'triad'
          ? VOICING_LABEL[p.voicing]
          : 'block chords';
  const leadNote = p.voiceLead === 'smooth' ? ' · smallest possible moves' : '';
  return {
    def,
    seed,
    targets,
    prompt: {
      title: `${p.roman.join(' – ')} in ${p.key.tonic} ${p.key.mode}`,
      detail: `${styleNote} · one chord every ${p.beatsPerChord} beats · ${p.loops}× around${leadNote}`,
      key: p.key,
      perTarget: labels.map((label) => ({ label })),
    },
    ...(ideal ? { voiceLeading: { ideal } } : {}),
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
