import { tr } from '@/i18n';
import { QUALITY_INTERVALS, type ChordQuality } from '@/theory/chords';
import { namePc, type MidiNumber } from '@/theory/notes';

/**
 * Comping craft (06 Stage 6): the voicings a working pianist actually uses on
 * a chart, and the rhythm patterns they sit in.
 *
 * A "shell" is the smallest handful that still names the chord — root plus the
 * one note that decides its quality. Guide tones are the 3rd and 7th: the two
 * voices that actually move through a ii-V-I while the roots leap.
 */
export type VoicingStyle = 'triad' | 'shell17' | 'shell13' | 'guidetones';

export const VOICING_LABEL: Record<VoicingStyle, string> = {
  triad: tr('full chord'),
  shell17: tr('shell — root & 7th'),
  shell13: tr('shell — root & 3rd'),
  guidetones: tr('guide tones over roots'),
};

function pcAt(root: string, semitones: number): number {
  return ((namePc(root) ?? 0) + semitones) % 12;
}

/** Lowest midi at or above `floor` with the given pitch class. */
function above(pc: number, floor: MidiNumber): MidiNumber {
  let midi = floor;
  while (midi % 12 !== pc) midi++;
  return midi;
}

/** The chord's 3rd and 7th (falling back to the 5th when there is no 7th). */
function guideIntervals(quality: ChordQuality): [number, number] {
  const intervals = QUALITY_INTERVALS[quality];
  const third = intervals[1] ?? 4;
  const seventh = intervals[3] ?? intervals[2] ?? 7;
  return [third, seventh];
}

export interface VoicedChord {
  /** Left-hand notes (roots, shells). */
  lh: MidiNumber[];
  /** Right-hand notes (guide tones, upper structure). Empty for LH-only styles. */
  rh: MidiNumber[];
}

/**
 * Build a chord in a comping voicing. LH sits around C2–C3, RH around middle C
 * — the register a real player uses so the two hands do not collide.
 */
export function voiceChord(
  root: string,
  quality: ChordQuality,
  style: VoicingStyle,
  lhFloor: MidiNumber = 36,
  rhFloor: MidiNumber = 60,
): VoicedChord {
  const rootMidi = above(namePc(root) ?? 0, lhFloor);
  const [third, seventh] = guideIntervals(quality);

  if (style === 'shell17') {
    return { lh: [rootMidi, above(pcAt(root, seventh), rootMidi + 1)], rh: [] };
  }
  if (style === 'shell13') {
    return { lh: [rootMidi, above(pcAt(root, third), rootMidi + 1)], rh: [] };
  }
  if (style === 'guidetones') {
    const t = above(pcAt(root, third), rhFloor);
    const s = above(pcAt(root, seventh), rhFloor);
    return { lh: [rootMidi], rh: [t, s].sort((a, b) => a - b) };
  }
  const intervals = QUALITY_INTERVALS[quality];
  return { lh: [], rh: intervals.map((iv) => above(pcAt(root, iv), rhFloor + (iv >= 12 ? 12 : 0))) };
}

// ── rhythm patterns ────────────────────────────────────────────────────────

export type CompPattern = 'straight8' | 'ballad' | 'boomchuck' | 'swing';

export interface PatternHit {
  /** Beat offset within the bar; fractional for offbeats. */
  beat: number;
  hand: 'lh' | 'rh';
}

/**
 * Where the hands land in one 4/4 bar. These are the plain, useful patterns —
 * the point is the groove, not the difficulty.
 */
export const COMP_PATTERNS: Record<CompPattern, { label: string; hits: PatternHit[] }> = {
  // Pop: bass on 1 and 3, chord stabs on the "and" of 2 and on 4.
  straight8: {
    label: tr('Straight eighths'),
    hits: [
      { beat: 0, hand: 'lh' },
      { beat: 1, hand: 'rh' },
      { beat: 2, hand: 'lh' },
      { beat: 2.5, hand: 'rh' },
      { beat: 3, hand: 'rh' },
    ],
  },
  // Ballad: a broken chord unfolding across the bar, one note per beat.
  ballad: {
    label: tr('Ballad accompaniment'),
    hits: [
      { beat: 0, hand: 'lh' },
      { beat: 1, hand: 'rh' },
      { beat: 2, hand: 'rh' },
      { beat: 3, hand: 'rh' },
    ],
  },
  // Boom-chuck: bass on the downbeats, chord on the backbeats.
  boomchuck: {
    label: tr('Boom-chuck'),
    hits: [
      { beat: 0, hand: 'lh' },
      { beat: 1, hand: 'rh' },
      { beat: 2, hand: 'lh' },
      { beat: 3, hand: 'rh' },
    ],
  },
  // Swing comping: the classic Charleston figure — 1 and the "and" of 2.
  swing: {
    label: tr('Swing Charleston'),
    hits: [
      { beat: 0, hand: 'lh' },
      { beat: 0, hand: 'rh' },
      { beat: 2.5, hand: 'rh' },
    ],
  },
};

/**
 * Swing feel: the second eighth of each beat is delayed toward a triplet.
 * `ratio` 0.5 is straight, 0.667 is full triplet swing.
 */
export function swingBeat(beat: number, ratio: number): number {
  const whole = Math.floor(beat);
  const frac = beat - whole;
  if (frac === 0) return beat;
  if (Math.abs(frac - 0.5) < 1e-6) return whole + ratio;
  return beat;
}
