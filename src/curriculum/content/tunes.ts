import { tr } from '@/i18n';

/**
 * Traditional melodies, written out note by note. All four tunes are in the
 * public domain everywhere: Ode to Joy (Beethoven, 1824), and three folk songs.
 * The arrangements here are our own simple versions, in C major, right hand.
 *
 * A bar is a list of [note, beats] pairs. 'rest' is a silence.
 */
export type TuneBar = [string, number][];

export interface Tune {
  id: string;
  /** Recognizable title; kept untranslated, as `docs/localization.md` asks for credited traditional titles. */
  title: string;
  credit: string;
  beatsPerBar: number;
  bpm: number;
  bars: TuneBar[];
  /** Bass note per bar (left hand), for the studio's accompaniment levels. */
  roots: string[];
}

export const ODE_TO_JOY: Tune = {
  id: 'ode-to-joy',
  title: 'Ode to Joy',
  credit: tr('Ludwig van Beethoven, 1824, simplified'),
  beatsPerBar: 4,
  bpm: 84,
  bars: [
    [['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1]],
    [['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1]],
    [['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1]],
    [['E4', 1], ['D4', 1], ['D4', 2]],
    [['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1]],
    [['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1]],
    [['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1]],
    [['D4', 1], ['C4', 1], ['C4', 2]],
  ],
  roots: ['C3', 'G2', 'C3', 'G2', 'C3', 'G2', 'C3', 'C3'],
};

export const AU_CLAIR: Tune = {
  id: 'au-clair-de-la-lune',
  title: 'Au clair de la lune',
  credit: tr('French traditional'),
  beatsPerBar: 4,
  bpm: 84,
  bars: [
    [['C4', 1], ['C4', 1], ['C4', 1], ['D4', 1]],
    [['E4', 2], ['D4', 2]],
    [['C4', 1], ['E4', 1], ['D4', 1], ['D4', 1]],
    [['C4', 4]],
    [['C4', 1], ['C4', 1], ['C4', 1], ['D4', 1]],
    [['E4', 2], ['D4', 2]],
    [['C4', 1], ['E4', 1], ['D4', 1], ['D4', 1]],
    [['C4', 4]],
  ],
  roots: ['C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'G2', 'C3'],
};

export const TWINKLE: Tune = {
  id: 'twinkle',
  title: 'Twinkle, Twinkle / Ah ! vous dirai-je, maman',
  credit: tr('French traditional, 1761'),
  beatsPerBar: 4,
  bpm: 88,
  bars: [
    [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1]],
    [['A4', 1], ['A4', 1], ['G4', 2]],
    [['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1]],
    [['D4', 1], ['D4', 1], ['C4', 2]],
    [['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1]],
    [['E4', 1], ['E4', 1], ['D4', 2]],
    [['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1]],
    [['E4', 1], ['E4', 1], ['D4', 2]],
    [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1]],
    [['A4', 1], ['A4', 1], ['G4', 2]],
    [['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1]],
    [['D4', 1], ['D4', 1], ['C4', 2]],
  ],
  roots: ['C3', 'F2', 'F2', 'G2', 'C3', 'G2', 'C3', 'G2', 'C3', 'F2', 'F2', 'C3'],
};

export const FRERE_JACQUES: Tune = {
  id: 'frere-jacques',
  title: 'Frère Jacques',
  credit: tr('French traditional'),
  beatsPerBar: 4,
  bpm: 92,
  bars: [
    [['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1]],
    [['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1]],
    [['E4', 1], ['F4', 1], ['G4', 2]],
    [['E4', 1], ['F4', 1], ['G4', 2]],
    [['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1]],
    [['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1]],
    [['C4', 1], ['G3', 1], ['C4', 2]],
    [['C4', 1], ['G3', 1], ['C4', 2]],
  ],
  roots: ['C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3'],
};

export const TUNES: Tune[] = [ODE_TO_JOY, AU_CLAIR, TWINKLE, FRERE_JACQUES];

const PCS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "F#4" → 66. Kept local so this data file has no theory imports. */
export function pitch(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note name: ${name}`);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + PCS[m[1]!]! + acc;
}

/** Timed notes for a tune, or for bars [from, to) of it. Sounding length is 90% of written. */
export function tuneNotes(
  tune: Tune,
  from = 0,
  to = tune.bars.length,
): { midi: number; atBeat: number; durBeats: number }[] {
  const out: { midi: number; atBeat: number; durBeats: number }[] = [];
  tune.bars.slice(from, to).forEach((bar, b) => {
    let at = b * tune.beatsPerBar;
    for (const [name, beats] of bar) {
      if (name !== 'rest') out.push({ midi: pitch(name), atBeat: at, durBeats: beats * 0.9 });
      at += beats;
    }
  });
  return out;
}
