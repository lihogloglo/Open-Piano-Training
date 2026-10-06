import { describe, expect, it } from 'vitest';
import { generate } from './index';
import type { ExerciseDef } from '../types';

const def = (params: Record<string, unknown>): ExerciseDef => ({
  generator: 'arpeggio',
  params,
  mode: 'wait',
  rung: 'keys-lit',
  hand: (params['hand'] as 'rh' | 'lh') ?? 'rh',
  seedPolicy: 'fixed',
});

const notes = (params: Record<string, unknown>) =>
  generate(def(params), 1).targets.map((t) => (t.kind === 'note' ? [t.midi, t.finger] : null));

describe('arpeggio', () => {
  it('plays C major up one octave with 1-2-3-5', () => {
    expect(notes({ tonic: 'C', hand: 'rh', direction: 'up' })).toEqual([
      [60, 1],
      [64, 2],
      [67, 3],
      [72, 5],
    ]);
  });

  it('passes the thumb under for two octaves, and comes back down', () => {
    const run = notes({ tonic: 'F', hand: 'rh', octaves: 2 });
    expect(run.map((n) => n![1])).toEqual([1, 2, 3, 1, 2, 3, 5, 3, 2, 1, 3, 2, 1]);
    expect(run[0]![0]).toBe(65);
    expect(run[6]![0]).toBe(89);
    expect(run.at(-1)![0]).toBe(65);
  });

  it('starts the left hand an octave lower with 5-4-2-1', () => {
    expect(notes({ tonic: 'G', hand: 'lh', direction: 'up' })).toEqual([
      [55, 5],
      [59, 4],
      [62, 2],
      [67, 1],
    ]);
  });

  it('builds a minor triad with a lowered third', () => {
    expect(notes({ tonic: 'A', quality: 'min', hand: 'rh', direction: 'up' }).map((n) => n![0])).toEqual([
      69, 72, 76, 81,
    ]);
  });
});
