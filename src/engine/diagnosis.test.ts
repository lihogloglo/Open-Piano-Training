import { describe, expect, it } from 'vitest';
import { diagnose } from './diagnosis';
import type { ExerciseInstance, TakeResult } from './types';

const result = (verdicts: ('perfect' | 'wrong')[]): TakeResult => ({
  pitchAccuracy: 1,
  timingAccuracy: 1,
  score: 1,
  stars: 3,
  passed: true,
  judgments: verdicts.map((verdict, i) => ({ targetIndex: i, midi: 60, verdict, deltaMs: 0 })),
});

const instance = (over: Partial<ExerciseInstance['def']>): ExerciseInstance => ({
  def: {
    generator: 'test',
    params: {},
    mode: 'wait',
    rung: 'keys-lit',
    hand: 'rh',
    seedPolicy: 'fixed',
    ...over,
  },
  seed: 1,
  targets: [],
  prompt: { title: 'T' },
});

describe('diagnose', () => {
  it('tells a two-hand take with mistakes to separate the hands', () => {
    expect(diagnose(result(['wrong']), instance({ hand: 'both', mode: 'tempo' }))).toContain(
      'Play each hand alone',
    );
  });

  it('tells a timed one-hand take with mistakes to slow down', () => {
    expect(diagnose(result(['wrong']), instance({ mode: 'tempo' }))).toContain('one note per second');
  });

  it('only mentions illuminated keys when the keys were lit', () => {
    expect(diagnose(result(['perfect']), instance({}))).toContain('illuminated keys');
    expect(diagnose(result(['perfect']), instance({ rung: 'note-names' }))).not.toContain('illuminated');
  });
});
