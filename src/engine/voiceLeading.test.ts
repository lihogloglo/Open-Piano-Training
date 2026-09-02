import { describe, expect, it } from 'vitest';
import { applyVoiceLeading, movementCost, smoothVoicings, vlScore } from './voiceLeading';
import { WaitMatcher } from './matcher/waitMatcher';
import { TempoMatcher } from './matcher/tempoMatcher';
import { chordAnySatisfied } from './matcher/setMatch';
import { detectChord } from '@/theory/chords';
import { generate } from './generators';
import type { ExerciseDef, MatchEvent, Target } from './types';

function def(
  generator: string,
  params: Record<string, unknown>,
  mode: 'wait' | 'tempo' = 'wait',
): ExerciseDef {
  return {
    generator,
    params,
    mode,
    rung: 'keys-lit',
    hand: 'rh',
    seedPolicy: 'fixed',
    timingTier: 'standard',
    ...(mode === 'tempo' ? { bpm: 60 } : {}),
  };
}

const on = (midi: number, tPerf = 0) => ({ kind: 'noteon' as const, midi, tPerf });

function completion(events: MatchEvent[]) {
  const c = events.find((e) => e.type === 'completed');
  return c?.type === 'completed' ? c.result : null;
}

describe('voice-leading metric', () => {
  it('movementCost pairs voices greedily by semitone distance', () => {
    // C (C4 E4 G4) → F/C (C4 F4 A4): 0 + 1 + 2 = 3
    expect(movementCost([60, 64, 67], [60, 65, 69])).toBe(3);
    // identical voicings cost nothing
    expect(movementCost([60, 64, 67], [60, 64, 67])).toBe(0);
    // octave jump costs 12 per voice
    expect(movementCost([60, 64, 67], [72, 76, 79])).toBe(36);
  });

  it('smoothVoicings keeps common tones (C→F chooses F/C, not root position)', () => {
    const seq = smoothVoicings([
      { root: 'C', quality: 'maj' },
      { root: 'F', quality: 'maj' },
    ]);
    expect(seq[0]?.inversion).toBe(0);
    expect(seq[1]?.inversion).toBe(2); // F/C keeps the C
    expect(seq[1]?.midis).toContain(60);
  });

  it('vlScore is 1 at ideal cost and degrades with excess movement', () => {
    expect(vlScore(3, 3)).toBe(1);
    expect(vlScore(13, 3)).toBe(0);
    expect(vlScore(8, 3)).toBeCloseTo(0.5);
  });

  it('applyVoiceLeading blends 0.5 pitch + 0.3 timing + 0.2 vl', () => {
    const base = {
      pitchAccuracy: 1,
      timingAccuracy: 1,
      score: 1,
      stars: 3 as const,
      judgments: [],
      passed: true,
    };
    const ideal = [
      [60, 64, 67],
      [60, 65, 69],
    ];
    const perfect = applyVoiceLeading(base, ideal, ideal);
    expect(perfect.vlScore).toBe(1);
    expect(perfect.score).toBe(1);

    const clunky = applyVoiceLeading(base, [[60, 64, 67], [65, 69, 72]], ideal);
    expect(clunky.vlScore).toBeLessThan(1);
    expect(clunky.score).toBeCloseTo(0.5 + 0.3 + 0.2 * clunky.vlScore);
  });

  it('bridges transitions across missed chords in both sequences', () => {
    const ideal = [
      [60, 64, 67],
      [60, 65, 69],
      [59, 62, 67],
    ];
    const base = {
      pitchAccuracy: 2 / 3,
      timingAccuracy: 1,
      score: 0.8,
      stars: 1 as const,
      judgments: [],
      passed: true,
    };
    // Middle chord missed but outer two played exactly as the reference.
    const r = applyVoiceLeading(base, [ideal[0] ?? null, null, ideal[2] ?? null], ideal);
    expect(r.vlScore).toBe(1);
  });
});

describe('progression-play voiceLead:smooth', () => {
  const smoothDef = def(
    'progression-play',
    {
      key: { tonic: 'C', mode: 'major' },
      roman: ['I', 'V', 'vi', 'IV'],
      beatsPerChord: 4,
      loops: 1,
      voiceLead: 'smooth',
    },
    'tempo',
  );

  it('emits inversion-locked targets plus the reference voicings', () => {
    const inst = generate(smoothDef, 42);
    expect(inst.targets).toHaveLength(4);
    expect(inst.voiceLeading?.ideal).toHaveLength(4);
    const first = inst.targets[0];
    if (first?.kind === 'set') {
      expect(first.inversionOf?.inversion).toBe(0);
    } else {
      throw new Error('expected set target');
    }
  });

  it('scores an ideal take at vl 1 and a clunky octave-hopping take lower', () => {
    const inst = generate(smoothDef, 42);
    const ideal = inst.voiceLeading?.ideal ?? [];
    const beatMs = 1000; // 60 bpm

    const play = (voicings: number[][]) => {
      const m = new TempoMatcher(inst, 60, 0, 0);
      const events: MatchEvent[] = [];
      voicings.forEach((v, i) => {
        for (const midi of v) events.push(...m.feed(on(midi, i * 4 * beatMs)));
      });
      events.push(...m.finish());
      return completion(events);
    };

    const perfect = play(ideal.map((v) => [...v]));
    // Clunky: right chords/inversions but hopped up an octave every other bar.
    const clunky = play(ideal.map((v, i) => v.map((m) => m + (i % 2 === 1 ? 12 : 0))));

    expect(perfect?.pitchAccuracy).toBe(1);
    expect(perfect?.score).toBe(1);
    expect(clunky?.pitchAccuracy).toBe(1);
    expect(clunky?.score).toBeLessThan(perfect?.score ?? 0);
  });
});

describe('progression-play style:brokenLH', () => {
  it('turns each bar into root·fifth·octave·fifth note targets', () => {
    const inst = generate(
      def(
        'progression-play',
        { key: { tonic: 'C', mode: 'major' }, roman: ['I', 'IV'], beatsPerChord: 4, loops: 1, style: 'brokenLH' },
        'tempo',
      ),
      42,
    );
    expect(inst.targets).toHaveLength(8);
    const midis = inst.targets.map((t) => (t.kind === 'note' ? t.midi : -1));
    expect(midis.slice(0, 4)).toEqual([36, 43, 48, 43]); // C2 G2 C3 G2
    expect(midis.slice(4, 8)).toEqual([41, 48, 53, 48]); // F2 C3 F3 C3
  });

  it('adds an exact RH chord on the bar line when hand is both', () => {
    const inst = generate(
      {
        ...def(
          'progression-play',
          { key: { tonic: 'C', mode: 'major' }, roman: ['I', 'IV'], beatsPerChord: 4, loops: 1, style: 'brokenLH' },
          'tempo',
        ),
        hand: 'both',
      },
      42,
    );
    expect(inst.targets).toHaveLength(10);
    const sets = inst.targets.filter((t) => t.kind === 'set');
    expect(sets).toHaveLength(2);
    expect(sets.every((t) => t.kind === 'set' && !t.octaveFlexible)).toBe(true);
    expect(inst.targets[0]?.kind).toBe('set'); // chord leads its bar
  });
});

describe('harmonization (acceptAlternatives)', () => {
  const harmDef = def('progression-play', {
    key: { tonic: 'C', mode: 'major' },
    roman: ['I', 'IV', 'V', 'I', 'vi', 'IV', 'V', 'I'],
    acceptAlternatives: true,
  });

  it('every bar accepts several diatonic answers', () => {
    const inst = generate(harmDef, 42);
    expect(inst.targets).toHaveLength(8);
    for (const t of inst.targets) {
      expect(t.kind).toBe('chord-any');
      if (t.kind === 'chord-any') expect(t.accept.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('accepts the documented alternatives: chord containing the melody note or functional match', () => {
    const target: Extract<Target, { kind: 'chord-any' }> = {
      kind: 'chord-any',
      label: 'Harmonize degree 1',
      // Melody C over canonical I: I, IV and vi contain C; iii shares tonic function.
      accept: [
        { root: 'C', quality: 'maj' },
        { root: 'E', quality: 'min' },
        { root: 'F', quality: 'maj' },
        { root: 'A', quality: 'min' },
      ],
    };
    expect(chordAnySatisfied(new Set([65, 69, 72]), target)).toBe(true); // F major
    expect(chordAnySatisfied(new Set([57, 60, 64]), target)).toBe(true); // A minor
    expect(chordAnySatisfied(new Set([64, 68, 71]), target)).toBe(false); // E major — chromatic
    expect(chordAnySatisfied(new Set([62, 65, 69]), target)).toBe(false); // D minor — wrong function, no C
  });

  it('wait matcher advances on any accepted chord', () => {
    const inst = generate(harmDef, 42);
    const first = inst.targets[0];
    if (first?.kind !== 'chord-any') throw new Error('expected chord-any');
    const alt = first.accept[1] ?? first.accept[0];
    if (!alt) throw new Error('no accepted chords');
    const m = new WaitMatcher(inst);
    m.start();
    // Play the alternative chord voiced from its root above C3.
    const voicing = detectVoicing(alt.root, alt.quality);
    let advanced = false;
    for (const midi of voicing) {
      for (const ev of m.feed(on(midi))) {
        if (ev.type === 'targetFocused' && ev.index === 1) advanced = true;
      }
    }
    expect(advanced).toBe(true);
  });
});

describe('ear-progression generator', () => {
  const earDef = def('ear-progression', {
    key: { tonic: 'C', mode: 'major' },
    pool: [
      ['I', 'IV', 'V', 'I'],
      ['I', 'V', 'vi', 'IV'],
    ],
    count: 2,
  });

  it('lays out one chord-any target per chord with a preview at each item start', () => {
    const inst = generate(earDef, 7);
    expect(inst.targets).toHaveLength(8);
    expect(inst.perTargetPreview?.[0]).toBeDefined();
    expect(inst.perTargetPreview?.[1]).toBeUndefined();
    expect(inst.perTargetPreview?.[4]).toBeDefined();
  });

  it('a lone bass root answers a chord when bassRootsOk', () => {
    const inst = generate(earDef, 7);
    const first = inst.targets[0];
    if (first?.kind !== 'chord-any') throw new Error('expected chord-any');
    const root = first.accept[0]?.root ?? 'C';
    const m = new WaitMatcher(inst);
    m.start();
    const events = m.feed(on(rootMidi(root)));
    expect(events.some((e) => e.type === 'targetFocused' && e.index === 1)).toBe(true);
  });
});

describe('chord explorer detection (sandbox core)', () => {
  // 20 voicings: [midis, expected symbol, expected inversion]
  const cases: [number[], string, number][] = [
    [[60, 64, 67], 'C', 0],
    [[64, 67, 72], 'C', 1],
    [[67, 72, 76], 'C', 2],
    [[57, 60, 64], 'Am', 0],
    [[60, 64, 69], 'Am', 1],
    [[64, 69, 72], 'Am', 2],
    [[62, 66, 69], 'D', 0],
    [[66, 69, 74], 'D', 1],
    [[63, 67, 70], 'E♭', 0],
    [[62, 65, 69], 'Dm', 0],
    [[65, 69, 74], 'Dm', 1],
    [[59, 62, 65], 'Bdim', 0],
    [[60, 64, 68], 'Caug', 0],
    [[60, 64, 67, 71], 'Cmaj7', 0],
    [[64, 67, 71, 72], 'Cmaj7', 1],
    [[67, 71, 72, 76], 'Cmaj7', 2],
    [[55, 59, 62, 65], 'G7', 0],
    [[59, 62, 65, 67], 'G7', 1],
    [[62, 65, 69, 72], 'Dm7', 0],
    [[60, 63, 66, 69], 'Cdim7', 0],
  ];

  it('names 20 voicings with the right root, quality and inversion', () => {
    for (const [midis, symbol, inversion] of cases) {
      const d = detectChord(midis);
      expect(d, `voicing ${midis.join(',')}`).not.toBeNull();
      expect(`${d?.symbol}@${d?.inversion}`, `voicing ${midis.join(',')}`).toBe(`${symbol}@${inversion}`);
    }
  });
});

function detectVoicing(root: string, quality: string): number[] {
  // Root-position voicing above C3 built from the theory dictionary via detect
  // round-trip: use rootMidi + known interval sets from detectChord's dictionary.
  const base = rootMidi(root);
  const intervals: Record<string, number[]> = {
    maj: [0, 4, 7],
    min: [0, 3, 7],
    dim: [0, 3, 6],
  };
  return (intervals[quality] ?? [0, 4, 7]).map((i) => base + i);
}

function rootMidi(root: string): number {
  const pcs: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let pc = pcs[root[0] ?? 'C'] ?? 0;
  if (root.includes('#')) pc += 1;
  if (root.length > 1 && root.includes('b')) pc -= 1;
  return 48 + ((pc + 12) % 12);
}
