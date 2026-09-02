import { chordPcs, matchesChordInversion } from '@/theory/chords';
import { pcOf } from '@/theory/notes';
import { degreeToMidi } from '@/theory/degrees';
import type { Target } from '../types';

/** Midi numbers to highlight for a target (keyboard 'target' state). */
export function targetMidis(target: Target): number[] {
  if (target.kind === 'note') return [target.midi];
  if (target.kind === 'set') return target.midis;
  // any-of-degree: representative note near middle C (any octave is accepted).
  return [degreeToMidi(target.degree, target.key, 60)];
}

/** Does this held set satisfy a set target? */
export function setSatisfied(held: ReadonlySet<number>, target: Extract<Target, { kind: 'set' }>): boolean {
  const heldArr = [...held];
  if (target.inversionOf) {
    const { root, quality, inversion } = target.inversionOf;
    return matchesChordInversion(heldArr, root, quality, inversion);
  }
  if (heldArr.length !== target.midis.length) return false;
  if (!target.octaveFlexible) return target.midis.every((m) => held.has(m));
  // Octave-flexible: pitch-class multiset match + same bass pitch class.
  const heldPcs = heldArr.map(pcOf).sort((a, b) => a - b);
  const wantPcs = target.midis.map(pcOf).sort((a, b) => a - b);
  if (!heldPcs.every((pc, i) => pc === wantPcs[i])) return false;
  return pcOf(Math.min(...heldArr)) === pcOf(Math.min(...target.midis));
}

/** Is a single played note a member of the target (tempo-mode pitch matching)? */
export function noteBelongsToTarget(midi: number, target: Target): boolean {
  if (target.kind === 'note') return target.midi === midi;
  if (target.kind === 'set') {
    if (target.inversionOf) {
      const { root, quality } = target.inversionOf;
      return chordPcs(root, quality).includes(pcOf(midi));
    }
    if (target.octaveFlexible) return target.midis.map(pcOf).includes(pcOf(midi));
    return target.midis.includes(midi);
  }
  return pcOf(midi) === pcOf(degreeToMidi(target.degree, target.key, 60));
}
