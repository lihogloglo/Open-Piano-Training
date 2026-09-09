import { buildChord, chordPcs, matchesChordInversion } from '@/theory/chords';
import { namePc, pcOf } from '@/theory/notes';
import { degreeToMidi } from '@/theory/degrees';
import type { Target } from '../types';

/** Midi numbers to highlight for a target (keyboard 'target' state). */
export function targetMidis(target: Target): number[] {
  if (target.kind === 'note') return [target.midi];
  if (target.kind === 'set') return target.midis;
  if (target.kind === 'chord-any') {
    const first = target.accept[0];
    return first ? buildChord({ root: first.root, quality: first.quality, inversion: 0 }, 48) : [];
  }
  if (target.kind === 'pitch-class-group') {
    return target.pitchClasses.map((pc) => 60 + ((pc - 0 + 12) % 12));
  }
  // any-of-degree: representative note near middle C (any octave is accepted).
  return [degreeToMidi(target.degree, target.key, 60)];
}

/** Does this held set satisfy a chord-any target (any accepted chord, any voicing)? */
export function chordAnySatisfied(
  held: ReadonlySet<number>,
  target: Extract<Target, { kind: 'chord-any' }>,
): boolean {
  if (held.size === 0) return false;
  const heldPcs = [...new Set([...held].map(pcOf))].sort((a, b) => a - b);
  const first = target.accept[0];
  if (target.bassRootOk && first && heldPcs.length === 1 && heldPcs[0] === namePc(first.root)) return true;
  return target.accept.some((c) => {
    const wanted = chordPcs(c.root, c.quality);
    return wanted.length === heldPcs.length && wanted.every((pc, i) => pc === heldPcs[i]);
  });
}

/** Does this held set satisfy a set target? */
export function setSatisfied(held: ReadonlySet<number>, target: Extract<Target, { kind: 'set' }>): boolean {
  if (target.requiredBass !== undefined) {
    if (!held.has(target.requiredBass)) return false;
    const { requiredBass, ...upper } = target;
    return setSatisfied(new Set([...held].filter((m) => m !== requiredBass)), {
      ...upper,
      midis: target.midis.filter((m) => m !== requiredBass),
    });
  }
  const heldArr = [...held];
  if (target.midiRange && heldArr.some((m) => m < target.midiRange![0] || m > target.midiRange![1]))
    return false;
  if (target.transposeOnly) {
    const played = heldArr.sort((a, b) => a - b);
    const wanted = [...target.midis].sort((a, b) => a - b);
    const shift = (played[0] ?? -1) - (wanted[0] ?? 0);
    return (
      played.length === wanted.length && shift % 12 === 0 && played.every((m, i) => m === wanted[i]! + shift)
    );
  }
  if (target.inversionOf) {
    const { root, quality, inversion } = target.inversionOf;
    return matchesChordInversion(heldArr, root, quality, inversion);
  }
  if (!target.octaveFlexible)
    return heldArr.length === target.midis.length && target.midis.every((m) => held.has(m));
  // Ordinary chords accept inversions, spread voicings and doubled chord tones.
  // Only an explicit inversionOf target constrains the bass.
  const heldPcs = [...new Set(heldArr.map(pcOf))].sort((a, b) => a - b);
  const wantPcs = [...new Set(target.midis.map(pcOf))].sort((a, b) => a - b);
  return heldPcs.length === wantPcs.length && heldPcs.every((pc, i) => pc === wantPcs[i]);
}

/** Is a single played note a member of the target (tempo-mode pitch matching)? */
export function noteBelongsToTarget(midi: number, target: Target): boolean {
  if (target.kind === 'note')
    return target.octaveFlexible ? pcOf(target.midi) === pcOf(midi) : target.midi === midi;
  if (target.kind === 'set') {
    if (midi === target.requiredBass) return true;
    if (target.midiRange && (midi < target.midiRange[0] || midi > target.midiRange[1])) return false;
    if (target.inversionOf) {
      const { root, quality } = target.inversionOf;
      return chordPcs(root, quality).includes(pcOf(midi));
    }
    if (target.octaveFlexible) return target.midis.map(pcOf).includes(pcOf(midi));
    return target.midis.includes(midi);
  }
  if (target.kind === 'chord-any') {
    const pc = pcOf(midi);
    return target.accept.some((c) => chordPcs(c.root, c.quality).includes(pc));
  }
  if (target.kind === 'pitch-class-group') return target.pitchClasses.includes(pcOf(midi));
  return pcOf(midi) === pcOf(degreeToMidi(target.degree, target.key, 60));
}

/** Distinct members needed by tempo targets; a separate bass is its own member. */
export function setMemberKey(midi: number, target: Extract<Target, { kind: 'set' }>): number {
  if (target.transposeOnly) return midi;
  if (midi === target.requiredBass) return -midi - 1;
  return target.octaveFlexible || target.inversionOf ? pcOf(midi) : midi;
}
