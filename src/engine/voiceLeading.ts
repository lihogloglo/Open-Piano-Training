import { buildChord, type ChordQuality, type Inversion } from '@/theory/chords';
import type { MidiNumber, TakeResult } from './types';

/**
 * Voice-leading metric per 04-exercise-engine §Voice-leading. Pure helpers the
 * progression generator and matchers share.
 */

/**
 * Movement cost between two voicings: greedy min-cost pairing of voices,
 * summing semitone distances of the paired notes.
 */
export function movementCost(from: readonly MidiNumber[], to: readonly MidiNumber[]): number {
  const pairs: { i: number; j: number; cost: number }[] = [];
  for (let i = 0; i < from.length; i++) {
    for (let j = 0; j < to.length; j++) {
      pairs.push({ i, j, cost: Math.abs((from[i] ?? 0) - (to[j] ?? 0)) });
    }
  }
  pairs.sort((a, b) => a.cost - b.cost);
  const usedI = new Set<number>();
  const usedJ = new Set<number>();
  let total = 0;
  for (const p of pairs) {
    if (usedI.has(p.i) || usedJ.has(p.j)) continue;
    usedI.add(p.i);
    usedJ.add(p.j);
    total += p.cost;
  }
  return total;
}

export interface SmoothVoicing {
  midis: MidiNumber[];
  inversion: Inversion;
}

/**
 * Reference smooth voicing sequence: first chord in root position near the
 * anchor, then each next chord takes whichever inversion/octave keeps common
 * tones and moves the rest least (ties go to the lower inversion).
 */
export function smoothVoicings(
  chords: readonly { root: string; quality: ChordQuality }[],
  anchorBass: MidiNumber = 55,
): SmoothVoicing[] {
  const out: SmoothVoicing[] = [];
  let prev: MidiNumber[] | null = null;
  for (const chord of chords) {
    if (!prev) {
      const midis = buildChord({ root: chord.root, quality: chord.quality, inversion: 0 }, anchorBass);
      out.push({ midis, inversion: 0 });
      prev = midis;
      continue;
    }
    let best: SmoothVoicing | null = null;
    let bestCost = Number.POSITIVE_INFINITY;
    const size = buildChord({ root: chord.root, quality: chord.quality, inversion: 0 }, anchorBass).length;
    const maxInv = Math.min(3, size - 1);
    for (let inv = 0; inv <= maxInv; inv++) {
      for (const bass of [anchorBass - 12, anchorBass - 5, anchorBass, anchorBass + 7]) {
        const midis = buildChord({ root: chord.root, quality: chord.quality, inversion: inv as Inversion }, bass);
        const cost = movementCost(prev, midis);
        if (cost < bestCost) {
          bestCost = cost;
          best = { midis, inversion: inv as Inversion };
        }
      }
    }
    const chosen = best ?? { midis: buildChord({ ...chord, inversion: 0 }, anchorBass), inversion: 0 as Inversion };
    out.push(chosen);
    prev = chosen.midis;
  }
  return out;
}

/** vlScore = clamp01(1 − (playedCost − idealCost) / (2·idealCost + 4)). */
export function vlScore(playedCost: number, idealCost: number): number {
  return Math.max(0, Math.min(1, 1 - (playedCost - idealCost) / (2 * idealCost + 4)));
}

/**
 * Total movement cost over successive present voicings of a (possibly gappy)
 * sequence. Gaps (nulls — missed chords, interleaved note targets) are bridged:
 * the transition runs from the previous present voicing to the next one.
 */
function sequenceCost(voicings: readonly (readonly MidiNumber[] | null)[]): {
  cost: number;
  transitions: number;
} {
  let cost = 0;
  let transitions = 0;
  let prev: readonly MidiNumber[] | null = null;
  for (const v of voicings) {
    if (!v) continue;
    if (prev) {
      cost += movementCost(prev, v);
      transitions += 1;
    }
    prev = v;
  }
  return { cost, transitions };
}

/**
 * Re-score a take with the voice-leading blend (04 §Voice-leading):
 * score = 0.5·pitch + 0.3·timing + 0.2·vl. Ideal cost is measured over the
 * same transitions the learner actually played, so missed chords punish pitch
 * accuracy but don't corrupt the movement comparison.
 */
export function applyVoiceLeading(
  result: TakeResult,
  played: readonly (readonly MidiNumber[] | null)[],
  ideal: readonly (readonly MidiNumber[])[],
  passScore = 0.8,
): TakeResult & { vlScore: number } {
  const playedSeq = sequenceCost(played);
  const idealAligned = ideal.map((v, i) => (played[i] ? v : null));
  const idealSeq = sequenceCost(idealAligned);
  const vl = playedSeq.transitions === 0 ? 0 : vlScore(playedSeq.cost, idealSeq.cost);
  const score = Math.max(
    0,
    Math.min(1, 0.5 * result.pitchAccuracy + 0.3 * result.timingAccuracy + 0.2 * vl),
  );
  const stars: TakeResult['stars'] = score >= 0.97 ? 3 : score >= 0.9 ? 2 : score >= 0.8 ? 1 : 0;
  return { ...result, score, stars, passed: score >= passScore, vlScore: vl };
}
