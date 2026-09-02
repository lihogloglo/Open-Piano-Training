import { describe, expect, it } from 'vitest';
import { WaitMatcher } from './matcher/waitMatcher';
import { TempoMatcher } from './matcher/tempoMatcher';
import { TIER_WINDOWS, bandOf, worseBand } from './matcher/timing';
import { setSatisfied, noteBelongsToTarget, targetMidis } from './matcher/setMatch';
import { scoreTake } from './scoring';
import { createRng, resolveSeed } from './rng';
import { generate } from './generators';
// Registers the song provider chart-play depends on.
import '@/curriculum/content';
import { makeTakeId, TakeRecorder } from './replay';
import type { ExerciseDef, ExerciseInstance, MatchEvent, NoteJudgment, Target } from './types';

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
  };
}

function instanceOf(targets: Target[], mode: 'wait' | 'tempo' = 'wait'): ExerciseInstance {
  return {
    def: def('scale-run', {}, mode),
    seed: 1,
    targets,
    beatsPerTarget: 1,
    prompt: { title: 'test' },
  };
}

const on = (midi: number, tPerf = 0) => ({ kind: 'noteon' as const, midi, tPerf });
const off = (midi: number, tPerf = 0) => ({ kind: 'noteoff' as const, midi, tPerf });

function judgments(events: MatchEvent[]): NoteJudgment[] {
  return events.filter((e) => e.type === 'noteJudged').map((e) => e.judgment);
}
function completion(events: MatchEvent[]) {
  const c = events.find((e) => e.type === 'completed');
  return c?.type === 'completed' ? c.result : null;
}

describe('WaitMatcher', () => {
  const noteTargets: Target[] = [
    { kind: 'note', midi: 60 },
    { kind: 'note', midi: 62 },
    { kind: 'note', midi: 64 },
  ];

  it('advances on correct notes and completes with full score', () => {
    const m = new WaitMatcher(instanceOf(noteTargets));
    const all = [...m.feed(on(60)), ...m.feed(off(60)), ...m.feed(on(62)), ...m.feed(on(64))];
    const result = completion(all);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(1);
    expect(result?.passed).toBe(true);
    expect(result?.stars).toBe(3);
  });

  it('marks wrong notes, stays on target, recovers', () => {
    const m = new WaitMatcher(instanceOf(noteTargets));
    const events = [...m.feed(on(61)), ...m.feed(on(60))];
    const js = judgments(events);
    expect(js[0]).toMatchObject({ verdict: 'wrong', midi: 61 });
    expect(js[1]).toMatchObject({ verdict: 'perfect', midi: 60 });
    expect(m.targetIndex).toBe(1);
  });

  it('emits hint ladder at 2 and 4 misses', () => {
    const m = new WaitMatcher(instanceOf(noteTargets));
    const events = [...m.feed(on(61)), ...m.feed(on(63)), ...m.feed(on(65)), ...m.feed(on(66))];
    const hints = events.filter((e) => e.type === 'hintEligible');
    expect(hints).toHaveLength(2);
    expect(hints[0]).toMatchObject({ auto: false });
    expect(hints[1]).toMatchObject({ auto: true });
  });

  it('satisfies an exact set target when all notes held', () => {
    const target: Target = { kind: 'set', midis: [60, 64, 67], label: 'C', octaveFlexible: false };
    const m = new WaitMatcher(instanceOf([target]));
    let events = [...m.feed(on(60)), ...m.feed(on(64))];
    expect(completion(events)).toBeNull();
    events = m.feed(on(67));
    const result = completion(events);
    expect(result?.passed).toBe(true);
  });

  it('accepts any voicing for inversionOf targets', () => {
    const target: Target = {
      kind: 'set',
      midis: [64, 67, 72],
      label: 'C/E',
      octaveFlexible: true,
      inversionOf: { root: 'C', quality: 'maj', inversion: 1 },
    };
    const m = new WaitMatcher(instanceOf([target]));
    // E2 in bass, spread voicing an octave lower
    const events = [...m.feed(on(52)), ...m.feed(on(55)), ...m.feed(on(60))];
    expect(completion(events)?.passed).toBe(true);
  });

  it('ignores sustain — noteoffs do not undo progress', () => {
    const m = new WaitMatcher(instanceOf(noteTargets));
    m.feed(on(60));
    m.feed(off(60));
    expect(m.targetIndex).toBe(1);
  });
});

describe('TempoMatcher', () => {
  const w = TIER_WINDOWS.standard;
  const beatMs = 500; // 120 BPM
  const targets: Target[] = [
    { kind: 'note', midi: 60 },
    { kind: 'note', midi: 62 },
    { kind: 'note', midi: 64 },
    { kind: 'note', midi: 65 },
  ];

  function tempoMatcher(tgts = targets, tier: 'relaxed' | 'standard' | 'strict' = 'standard', latency = 0) {
    const inst = instanceOf(tgts, 'tempo');
    inst.def.timingTier = tier;
    return new TempoMatcher(inst, 120, 1000, latency);
  }

  it('perfect run scores 1.0', () => {
    const m = tempoMatcher();
    const all: MatchEvent[] = [];
    [1000, 1500, 2000, 2500].forEach((t, i) => all.push(...m.feed(on(60 + [0, 2, 4, 5][i]!, t))));
    all.push(...m.finish());
    const result = completion(all);
    expect(result?.score).toBe(1);
    expect(result?.judgments.every((j) => j.verdict === 'perfect')).toBe(true);
  });

  it('bands early/late by tier boundaries with signed deltas', () => {
    const m = tempoMatcher();
    // perfect edge: +70; good edge: -140 (early); ok edge: +220
    const all: MatchEvent[] = [
      ...m.feed(on(60, 1000 + w.perfect)),
      ...m.feed(on(62, 1500 - w.good)),
      ...m.feed(on(64, 2000 + w.good + 1)),
      ...m.feed(on(65, 2500 + w.outer + 1)), // outside → not matched (extra), target later missed
    ];
    all.push(...m.finish());
    const js = completion(all)?.judgments ?? [];
    expect(js[0]).toMatchObject({ verdict: 'perfect', deltaMs: w.perfect });
    expect(js[1]).toMatchObject({ verdict: 'good', deltaMs: -w.good });
    expect(js[2]).toMatchObject({ verdict: 'ok' });
    expect(js.find((j) => j.midi === 65 && j.verdict === 'extra')).toBeTruthy();
    expect(js.find((j) => j.targetIndex === 3 && j.verdict === 'missed')).toBeTruthy();
  });

  it('applies the latency offset', () => {
    const m = tempoMatcher(targets, 'standard', 30);
    const events = m.feed(on(60, 1030));
    expect(judgments(events)[0]).toMatchObject({ verdict: 'perfect', deltaMs: 0 });
  });

  it('wrong pitch near a target is judged wrong and does not consume it', () => {
    const m = tempoMatcher();
    const all = [...m.feed(on(61, 1000)), ...m.feed(on(60, 1010))];
    const js = judgments(all);
    expect(js[0]).toMatchObject({ verdict: 'wrong', midi: 61 });
    expect(js[1]).toMatchObject({ verdict: 'perfect', midi: 60 });
  });

  it('missed targets are flushed by tick', () => {
    const m = tempoMatcher();
    const events = m.tick(1000 + w.outer + 1);
    expect(judgments(events)[0]).toMatchObject({ targetIndex: 0, verdict: 'missed' });
  });

  it('chords: roll within window scores; mean delta reported', () => {
    const chord: Target[] = [{ kind: 'set', midis: [60, 64, 67], label: 'C', octaveFlexible: false }];
    const m = tempoMatcher(chord);
    const all = [...m.feed(on(60, 1000)), ...m.feed(on(64, 1030)), ...m.feed(on(67, 1060))];
    const js = judgments(all);
    expect(js).toHaveLength(1);
    expect(js[0]).toMatchObject({ verdict: 'perfect', deltaMs: 30 });
  });

  it('chords: member landing outside the roll window degrades the band', () => {
    const chord: Target[] = [{ kind: 'set', midis: [60, 64, 67], label: 'C', octaveFlexible: false }];
    const m = tempoMatcher(chord);
    // roll window (standard) = 90ms; last member at +120 → within outer, outside roll
    const all = [...m.feed(on(60, 1000)), ...m.feed(on(64, 1020)), ...m.feed(on(67, 1120))];
    const js = judgments(all);
    expect(js[0]?.verdict).toBe('ok');
  });

  it('same-pitch targets match the nearest in time', () => {
    const twoCs: Target[] = [
      { kind: 'note', midi: 60 },
      { kind: 'note', midi: 60 },
    ];
    const m = tempoMatcher(twoCs);
    const all = [...m.feed(on(60, 1495)), ...m.feed(on(60, 1005))];
    const js = judgments(all);
    expect(js[0]).toMatchObject({ targetIndex: 1 });
    expect(js[1]).toMatchObject({ targetIndex: 0 });
  });

  it('endTimePerf covers the last target plus outer window', () => {
    const m = tempoMatcher();
    expect(m.endTimePerf).toBe(1000 + 3 * beatMs + w.outer + 50);
  });
});

describe('scoring', () => {
  const j = (
    targetIndex: number,
    verdict: NoteJudgment['verdict'],
    deltaMs: number | null = 0,
  ): NoteJudgment => ({
    targetIndex,
    midi: 60,
    verdict,
    deltaMs,
  });

  it('tempo formula: 0.6*pitch + 0.4*timing', () => {
    // 4 targets: perfect, good, ok, missed → pitch 3/4; timing (1+0.8+0.5)/3
    const result = scoreTake([j(0, 'perfect'), j(1, 'good'), j(2, 'ok'), j(3, 'missed', null)], 4, 'tempo');
    expect(result.pitchAccuracy).toBeCloseTo(0.75);
    expect(result.timingAccuracy).toBeCloseTo(2.3 / 3);
    expect(result.score).toBeCloseTo(0.6 * 0.75 + 0.4 * (2.3 / 3), 5);
    expect(result.passed).toBe(false);
  });

  it('wait mode scores pitch only', () => {
    const result = scoreTake([j(0, 'perfect'), j(1, 'perfect')], 2, 'wait');
    expect(result.score).toBe(1);
    expect(result.timingAccuracy).toBe(1);
  });

  it('extras subtract 0.02 each, capped at 0.10', () => {
    const perfect = [j(0, 'perfect'), j(1, 'perfect')];
    const twoExtras = scoreTake([...perfect, j(-1, 'extra', null), j(-1, 'extra', null)], 2, 'tempo');
    expect(twoExtras.score).toBeCloseTo(0.96, 5);
    const manyExtras = scoreTake(
      [...perfect, ...Array.from({ length: 9 }, () => j(-1, 'extra', null))],
      2,
      'tempo',
    );
    expect(manyExtras.score).toBeCloseTo(0.9, 5);
  });

  it('star thresholds', () => {
    expect(scoreTake([j(0, 'perfect')], 1, 'tempo').stars).toBe(3);
    expect(scoreTake([j(0, 'good'), j(1, 'perfect')], 2, 'tempo').stars).toBe(2); // 0.96
    expect(scoreTake([j(0, 'ok'), j(1, 'perfect')], 2, 'tempo').stars).toBe(2); // exactly 0.90
    // pitch 0.5, timing 1.0 → 0.7 → below one star
    expect(scoreTake([j(0, 'perfect'), j(1, 'missed', null)], 2, 'tempo').stars).toBe(0);
    expect(scoreTake([j(0, 'missed', null)], 1, 'tempo').stars).toBe(0);
  });

  it('wrong judgments do not erase a hit target', () => {
    const result = scoreTake(
      [j(0, 'perfect'), { targetIndex: -1, midi: 61, verdict: 'wrong', deltaMs: null }],
      1,
      'tempo',
    );
    expect(result.pitchAccuracy).toBe(1);
  });
});

describe('setMatch helpers', () => {
  const exact: Target = { kind: 'set', midis: [60, 64, 67], label: 'C', octaveFlexible: false };
  const flexible: Target = { kind: 'set', midis: [60, 64, 67], label: 'C', octaveFlexible: true };

  it('setSatisfied exact and flexible', () => {
    expect(setSatisfied(new Set([60, 64, 67]), exact as never)).toBe(true);
    expect(setSatisfied(new Set([60, 64]), exact as never)).toBe(false);
    expect(setSatisfied(new Set([48, 52, 55]), exact as never)).toBe(false);
    expect(setSatisfied(new Set([48, 52, 55]), flexible as never)).toBe(true); // octave down, C in bass
    expect(setSatisfied(new Set([52, 55, 60]), flexible as never)).toBe(false); // E in bass — wrong inversion
  });

  it('noteBelongsToTarget', () => {
    expect(noteBelongsToTarget(60, { kind: 'note', midi: 60 })).toBe(true);
    expect(noteBelongsToTarget(72, flexible)).toBe(true);
    expect(noteBelongsToTarget(72, exact)).toBe(false);
    expect(noteBelongsToTarget(61, flexible)).toBe(false);
    expect(
      noteBelongsToTarget(64, { kind: 'any-of-degree', degree: 3, key: { tonic: 'C', mode: 'major' } }),
    ).toBe(true);
  });

  it('targetMidis', () => {
    expect(targetMidis({ kind: 'note', midi: 60 })).toEqual([60]);
    expect(targetMidis(exact)).toEqual([60, 64, 67]);
    expect(targetMidis({ kind: 'any-of-degree', degree: 5, key: { tonic: 'C', mode: 'major' } })).toEqual([
      67,
    ]);
  });
});

describe('rng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(123);
    const b = createRng(123);
    const seqA = Array.from({ length: 5 }, () => a.int(1000));
    const seqB = Array.from({ length: 5 }, () => b.int(1000));
    expect(seqA).toEqual(seqB);
    expect(createRng(124).int(1000)).not.toBe(createRng(123).int(1000));
  });

  it('resolveSeed policies', () => {
    expect(resolveSeed('fixed')).toBe(42);
    expect(resolveSeed('daily', new Date(2026, 8, 1))).toBe(20260901);
    const r1 = resolveSeed('random');
    expect(Number.isInteger(r1)).toBe(true);
  });
});

describe('generators', () => {
  it('scale-run C major RH produces fingered note targets', () => {
    const inst = generate(def('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh' }), 1);
    expect(inst.targets).toHaveLength(8);
    expect(inst.targets[0]).toMatchObject({ kind: 'note', midi: 60, finger: 1 });
    expect(inst.targets[3]).toMatchObject({ midi: 65, finger: 1 }); // thumb under
    expect(inst.targets[7]).toMatchObject({ midi: 72, finger: 5 });
    expect(inst.prompt.title).toContain('major scale');
  });

  it('scale-run updown mirrors without repeating the top', () => {
    const inst = generate(
      def('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'updown' }),
      1,
    );
    expect(inst.targets).toHaveLength(15);
    const midis = inst.targets.map((t) => (t.kind === 'note' ? t.midi : 0));
    expect(midis[7]).toBe(72);
    expect(midis[8]).toBe(71);
    expect(midis[14]).toBe(60);
  });

  it('scale-run LH plays an octave lower', () => {
    const inst = generate(def('scale-run', { tonic: 'C', scaleType: 'major', hand: 'lh' }), 1);
    expect(inst.targets[0]).toMatchObject({ midi: 48, finger: 5 });
  });

  it('five-finger patterns', () => {
    const inst = generate(def('five-finger', { tonic: 'G', hand: 'rh', pattern: 'updown' }), 1);
    expect(inst.targets).toHaveLength(9);
    expect(inst.targets[0]).toMatchObject({ midi: 67, finger: 1 });
    expect(inst.targets[4]).toMatchObject({ midi: 74, finger: 5 });
  });

  it('chord-grip builds an inversion-aware set', () => {
    const inst = generate(def('chord-grip', { root: 'Eb', quality: 'maj', inversion: 1 }), 1);
    const t = inst.targets[0];
    expect(t?.kind).toBe('set');
    if (t?.kind === 'set') {
      expect(t.inversionOf).toEqual({ root: 'Eb', quality: 'maj', inversion: 1 });
      expect(t.label).toContain('E♭');
      expect(t.label).toContain('1st inversion');
    }
  });

  it('grip-interleave: seeded, right count, no immediate repeats', () => {
    const params = {
      roots: ['C', 'F', 'G'],
      qualities: ['maj', 'min'],
      inversions: [0, 1],
      count: 20,
    };
    for (let seed = 1; seed <= 100; seed++) {
      const inst = generate(def('grip-interleave', params), seed);
      expect(inst.targets).toHaveLength(20);
      const labels = inst.targets.map((t) => (t.kind === 'set' ? t.label : ''));
      for (let i = 1; i < labels.length; i++) expect(labels[i]).not.toBe(labels[i - 1]);
    }
    const a = generate(def('grip-interleave', params), 7);
    const b = generate(def('grip-interleave', params), 7);
    expect(a.targets).toEqual(b.targets);
  });

  it('flashcard spell drill', () => {
    const inst = generate(def('flashcard', { kind: 'spell', roots: ['F#'], qualities: ['m7'], count: 3 }), 1);
    expect(inst.targets).toHaveLength(3);
    expect(inst.prompt.perTarget?.[0]?.label).toBe('Spell F♯m7');
  });

  it('chord-grip rootOnly voicing asks for just the root', () => {
    const inst = generate(def('chord-grip', { root: 'G', quality: '7', voicing: 'rootOnly' }), 1);
    const t = inst.targets[0];
    expect(t?.kind).toBe('set');
    if (t?.kind === 'set') {
      expect(t.midis).toHaveLength(1);
      expect(t.midis[0]! % 12).toBe(7);
      expect(t.label).toContain('root');
    }
  });

  it('progression-play: I-V-vi-IV in G with root-in-bass voicings', () => {
    const inst = generate(
      def('progression-play', {
        key: { tonic: 'G', mode: 'major' },
        roman: ['I', 'V', 'vi', 'IV'],
        beatsPerChord: 4,
        loops: 1,
      }),
      1,
    );
    expect(inst.targets).toHaveLength(4);
    const labels = inst.targets.map((t) => (t.kind === 'set' ? t.label : ''));
    expect(labels).toEqual(['G', 'D', 'Em', 'C']);
    expect(inst.targets.map((t) => t.atBeat)).toEqual([0, 4, 8, 12]);
    const first = inst.targets[0];
    if (first?.kind === 'set') expect(first.inversionOf).toEqual({ root: 'G', quality: 'maj', inversion: 0 });
  });

  it('chart-play: first-light transposes to G', () => {
    const c = generate(def('chart-play', { songId: 'first-light' }), 1);
    const g = generate(def('chart-play', { songId: 'first-light', transposeTo: 'G' }), 1);
    const labelsC = c.targets.slice(0, 4).map((t) => (t.kind === 'set' ? t.label : ''));
    const labelsG = g.targets.slice(0, 4).map((t) => (t.kind === 'set' ? t.label : ''));
    expect(labelsC).toEqual(['C', 'G', 'Am', 'F']);
    expect(labelsG).toEqual(['G', 'D', 'Em', 'C']);
    expect(c.targets).toHaveLength(16);
    expect(() => generate(def('chart-play', { songId: 'nope' }), 1)).toThrow('Unknown song');
  });

  it('ear-degree: cadence preview, per-target probes, keyboard answers', () => {
    const inst = generate(
      def('ear-degree', { key: { tonic: 'C', mode: 'major' }, degreePool: [1, 3, 5], count: 5 }),
      3,
    );
    expect(inst.targets).toHaveLength(5);
    expect(inst.audioPreview?.notes.length).toBeGreaterThan(8); // cadence chords
    expect(inst.perTargetPreview).toHaveLength(5);
    const DEGREE_PC: Record<number, number> = { 1: 0, 3: 4, 5: 7 }; // in C major
    for (let i = 0; i < inst.targets.length; i++) {
      const t = inst.targets[i];
      expect(t?.kind).toBe('any-of-degree');
      if (t?.kind === 'any-of-degree') {
        expect([1, 3, 5]).toContain(t.degree);
        const probe = inst.perTargetPreview?.[i]?.notes[0]?.midi ?? -1;
        // The probe really sounds the asked degree.
        expect(probe % 12).toBe(DEGREE_PC[t.degree]);
      }
    }
  });

  it('ear-quality: preview chord matches the expected answer', () => {
    const inst = generate(def('ear-quality', { qualityPool: ['maj', 'min'], roots: ['C'], count: 4 }), 5);
    expect(inst.targets).toHaveLength(4);
    for (let i = 0; i < inst.targets.length; i++) {
      const t = inst.targets[i];
      if (t?.kind === 'set') {
        const previewMidis = (inst.perTargetPreview?.[i]?.notes ?? []).map((n) => n.midi).sort((a, b) => a - b);
        expect(previewMidis).toEqual([...t.midis].sort((a, b) => a - b));
      }
    }
  });

  it('flashcard interval cards build two-note targets', () => {
    const inst = generate(def('flashcard', { kind: 'interval', roots: ['C'], intervals: ['M3'], count: 2 }), 1);
    const t = inst.targets[0];
    expect(t?.kind).toBe('set');
    if (t?.kind === 'set') expect(t.midis).toEqual([60, 64]);
    expect(inst.prompt.perTarget?.[0]?.label).toContain('major 3rd above C');
  });

  it('unknown generator throws', () => {
    expect(() => generate(def('nope', {}), 1)).toThrow('Unknown generator');
  });
});

describe('flashcard helpers', () => {
  it('keySignatureAnswer phrasing', async () => {
    const { keySignatureAnswer } = await import('./generators/flashcard');
    expect(keySignatureAnswer({ tonic: 'C', mode: 'major' })).toBe('no sharps or flats');
    expect(keySignatureAnswer({ tonic: 'G', mode: 'major' })).toBe('1 sharp');
    expect(keySignatureAnswer({ tonic: 'Eb', mode: 'major' })).toBe('3 flats');
  });
});

describe('replay', () => {
  it('take ids are 26 chars and unique', () => {
    const ids = new Set(Array.from({ length: 200 }, () => makeTakeId()));
    expect(ids.size).toBe(200);
    expect([...ids][0]).toHaveLength(26);
  });

  it('records compact events relative to start', () => {
    const rec = new TakeRecorder(1000);
    rec.record('noteon', 60, 0.787, 1100);
    rec.record('noteoff', 60, 0, 1400);
    const take = rec.finalize(def('scale-run', {}), 42, scoreTake([], 0, 'wait'), { bpm: 80 });
    expect(take.events).toEqual([
      [100, 60, 1, 100],
      [400, 60, 0, 0],
    ]);
    expect(take.exercise.resolvedSeed).toBe(42);
    expect(take.bpm).toBe(80);
  });
});

describe('calibration', () => {
  it('takes the median and clamps to ±80ms', async () => {
    const { calibrationOffset } = await import('./matcher/timing');
    expect(calibrationOffset([20, 25, 30, 22, 28])).toBe(25);
    expect(calibrationOffset([10, 20])).toBe(15);
    expect(calibrationOffset([200, 210, 190])).toBe(80); // clamped
    expect(calibrationOffset([-120, -130, -110])).toBe(-80);
    expect(calibrationOffset([])).toBe(0);
    // One wild outlier doesn't drag the median.
    expect(calibrationOffset([20, 22, 24, 21, 500])).toBe(22);
  });
});

describe('timing helpers', () => {
  it('bands at exact boundaries', () => {
    const w = TIER_WINDOWS.strict;
    expect(bandOf(w.perfect, w)).toBe('perfect');
    expect(bandOf(w.perfect + 1, w)).toBe('good');
    expect(bandOf(-w.good, w)).toBe('good');
    expect(bandOf(w.outer, w)).toBe('ok');
    expect(bandOf(w.outer + 1, w)).toBeNull();
  });

  it('worseBand ordering', () => {
    expect(worseBand('perfect', 'ok')).toBe('ok');
    expect(worseBand('good', 'perfect')).toBe('good');
  });
});
