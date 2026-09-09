import { describe, expect, it } from 'vitest';
import { CURRICULUM } from '@/curriculum/content';
import { generate } from './generators';
import { exerciseDemo } from './preview';
import { setSatisfied, targetMidis } from './matcher/setMatch';
import { WaitMatcher } from './matcher/waitMatcher';
import { TempoMatcher } from './matcher/tempoMatcher';
import type { ExerciseDef, ExerciseInstance, MatchEvent, Target } from './types';

const def = (generator: string, params: Record<string, unknown> = {}): ExerciseDef => ({
  generator,
  params,
  mode: 'wait',
  hand: 'rh',
  rung: 'keys-lit',
  seedPolicy: 'fixed',
  bpm: 100,
});
const on = (midi: number, tPerf = 0) => ({ kind: 'noteon' as const, midi, tPerf });
function instance(target: Target): ExerciseInstance {
  return { def: def('test'), seed: 42, prompt: { title: 'test' }, targets: [target] };
}
const chord: Extract<Target, { kind: 'set' }> = {
  kind: 'set',
  midis: [60, 64, 67],
  label: 'C',
  octaveFlexible: true,
};
const result = (events: MatchEvent[]) => events.find((e) => e.type === 'completed');

describe('tester feedback: pitch and chords', () => {
  it.each([
    [48, 52, 55],
    [52, 55, 60],
    [55, 60, 64],
    [40, 55, 72, 76],
  ])('accepts ordinary C voicings %j', (...notes) => {
    expect(setSatisfied(new Set(notes), chord)).toBe(true);
    const wait = new WaitMatcher(instance(chord));
    const tempo = new TempoMatcher(instance(chord), 100, 0);
    const waitEvents = notes.flatMap((m) => wait.feed(on(m)));
    const tempoEvents = notes.flatMap((m) => tempo.feed(on(m)));
    expect(result(waitEvents)).toMatchObject({ result: { passed: true } });
    expect(result(tempoEvents)).toMatchObject({ result: { passed: true } });
  });
  it('intervals retain their distance and octave pairs need two notes', () => {
    for (const interval of ['M3', 'P8']) {
      const t = generate(
        def('flashcard', { kind: 'interval', roots: ['C'], intervals: [interval], count: 1 }),
        42,
      ).targets[0] as Extract<Target, { kind: 'set' }>;
      const notes = interval === 'M3' ? [48, 52] : [48, 60];
      expect(setSatisfied(new Set(notes), t)).toBe(true);
      expect(setSatisfied(new Set([60]), t)).toBe(false);
      expect(setSatisfied(new Set([64, 72]), t)).toBe(false);
      const tempo = new TempoMatcher(instance(t), 100, 0);
      expect(result(notes.flatMap((m) => tempo.feed(on(m))))?.result.passed).toBe(true);
    }
  });
  it('spelling, roman numeral and ear-quality questions accept inversions', () => {
    for (const d of [
      def('flashcard', { kind: 'spell', roots: ['C'], qualities: ['maj'], count: 1 }),
      def('flashcard', { kind: 'roman', keys: [{ tonic: 'C', mode: 'major' }], romans: ['I'], count: 1 }),
      def('ear-quality', { roots: ['C'], qualityPool: ['maj', 'min'], count: 1 }),
    ]) {
      const t = generate(d, 42).targets[0] as Extract<Target, { kind: 'set' }>;
      const notes = [...t.midis.slice(1), t.midis[0]! + 12];
      expect(setSatisfied(new Set(notes), t)).toBe(true);
    }
  });
  it('rejects missing and foreign chord tones', () => {
    expect(setSatisfied(new Set([52, 60]), chord)).toBe(false);
    expect(setSatisfied(new Set([52, 55, 61]), chord)).toBe(false);
  });
  it('does not complete a repeated wait chord on a wrong note', () => {
    const wait = new WaitMatcher({ ...instance(chord), targets: [chord, chord] });
    [60, 64, 67].forEach((m) => wait.feed(on(m)));
    wait.feed(on(61));
    expect(wait.targetIndex).toBe(1);
  });
  it.each(['wait', 'tempo'] as const)('keeps inversion lessons specific in %s mode', (mode) => {
    const inv = {
      ...chord,
      midis: [64, 67, 72],
      inversionOf: { root: 'C', quality: 'maj' as const, inversion: 1 as const },
    };
    const matcher =
      mode === 'wait' ? new WaitMatcher(instance(inv)) : new TempoMatcher(instance(inv), 100, 0);
    const events = [60, 64, 67].flatMap((m) => matcher.feed(on(m)));
    expect(result(events)?.result.passed ?? false).toBe(false);
    const good = mode === 'wait' ? new WaitMatcher(instance(inv)) : new TempoMatcher(instance(inv), 100, 0);
    expect(result([52, 55, 60].flatMap((m) => good.feed(on(m))))?.result.passed).toBe(true);
  });
  it.each(['five-finger', 'scale-run'])('accepts octave changes for %s in both matchers', (generator) => {
    const inst = generate(def(generator, { tonic: 'C', hand: 'rh', scaleType: 'major' }), 42);
    const wait = new WaitMatcher(inst);
    const tempo = new TempoMatcher(inst, 100, 0);
    const waitEvents: MatchEvent[] = [];
    const tempoEvents: MatchEvent[] = [];
    inst.targets.forEach((t, i) => {
      const m = targetMidis(t)[0]! - 12;
      waitEvents.push(...wait.feed(on(m, i * 600)));
      tempoEvents.push(...tempo.feed(on(m, i * 600)));
    });
    expect(result(waitEvents)?.result.passed).toBe(true);
    expect(result(tempoEvents)?.result.passed).toBe(true);
  });
  it('keeps a separate bass requirement while accepting right-hand inversions', () => {
    const inst = generate(
      {
        ...def('progression-play', {
          key: { tonic: 'C', mode: 'major' },
          roman: ['I', 'IV'],
          style: 'rootchord',
        }),
        hand: 'both',
      },
      42,
    );
    const t = inst.targets[0] as Extract<Target, { kind: 'set' }>;
    expect(setSatisfied(new Set([36, 64, 67, 72]), t)).toBe(true);
    expect(setSatisfied(new Set([64, 67, 72]), t)).toBe(false);
    expect(setSatisfied(new Set([36, 64, 67]), t)).toBe(false);
    const tempo = new TempoMatcher(instance(t), 100, 0);
    expect(result([36, 64, 67, 72].flatMap((m) => tempo.feed(on(m))))?.result.passed).toBe(true);
  });
  it('every combination of accompaniment and voice leading accepts its own example', () => {
    for (const style of ['block', 'rootchord', 'brokenLH', 'straight8', 'ballad', 'boomchuck', 'swing']) {
      for (const voiceLead of ['free', 'smooth'])
        for (const tonic of ['C', 'G', 'F#', 'Bb']) {
          const inst = generate(
            {
              ...def('progression-play', {
                key: { tonic, mode: 'major' },
                roman: ['I', 'IV', 'V', 'I'],
                style,
                voiceLead,
              }),
              hand: 'both',
            },
            42,
          );
          for (const t of inst.targets)
            if (t.kind === 'set')
              expect(setSatisfied(new Set(t.midis), t), style + '/' + voiceLead + '/' + t.label).toBe(true);
        }
    }
  });
  it('accepts inversions in every accompaniment pattern', () => {
    for (const style of ['block', 'straight8', 'ballad', 'boomchuck', 'swing', 'brokenLH']) {
      const inst = generate(
        {
          ...def('progression-play', { key: { tonic: 'C', mode: 'major' }, roman: ['I', 'IV'], style }),
          hand: 'both',
        },
        42,
      );
      const t = inst.targets.find((t) => t.kind === 'set') as Extract<Target, { kind: 'set' }>;
      expect(setSatisfied(new Set([64, 67, 72]), t), style).toBe(true);
    }
  });
});

describe('demonstration and curriculum audit', () => {
  it('preserves rests and durations in focused phrase demonstrations', () => {
    const inst = generate(
      {
        ...def('phrase', {
          title: 'Phrase',
          beatsPerBar: 3,
          notes: [
            { midi: 60, atBeat: 0, durBeats: 0.5 },
            { midi: 62, atBeat: 2, durBeats: 1 },
            { midi: 64, atBeat: 3, durBeats: 2 },
          ],
        }),
        focus: { start: 1, end: 3 },
      },
      42,
    );
    expect(exerciseDemo(inst)).toEqual([
      { midi: 62, atBeat: 0, durBeats: 1 },
      { midi: 64, atBeat: 1, durBeats: 2 },
    ]);
  });
  it('every authored timed exercise demonstrates the exact target sequence', () => {
    let checked = 0;
    for (const unit of CURRICULUM.units)
      for (const step of unit.steps) {
        if (step.kind === 'explain' || !step.exercise || step.exercise.mode !== 'tempo') continue;
        const inst = generate(step.exercise, 42);
        const demo = exerciseDemo(inst);
        expect(demo.length, unit.id + '/' + step.id).toBeGreaterThan(0);
        inst.targets.forEach((t, i) => {
          const beat = t.atBeat ?? i * (inst.beatsPerTarget ?? 1);
          const sounding = demo.filter((n) => n.atBeat === beat).map((n) => n.midi);
          expect(
            targetMidis(t).every((m) => sounding.includes(m)),
            unit.id + '/' + step.id,
          ).toBe(true);
        });
        expect(
          demo.every((n) => n.midi >= 21 && n.midi <= 108 && n.durBeats > 0),
          unit.id + '/' + step.id,
        ).toBe(true);
        checked++;
      }
    expect(checked).toBeGreaterThan(100);
  });
});
