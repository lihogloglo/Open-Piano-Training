import type { ExerciseDef } from '@/engine/types';
import { tuneNotes, type Tune } from './tunes';

/** Exercise builders shared by the courses. */

const C = { tonic: 'C', mode: 'major' as const };

/** A fresh phrase to read. No key lights: the staff is the only prompt. */
export const read = (
  params: Record<string, unknown>,
  opts: { bpm?: number; hand?: 'rh' | 'lh'; lit?: boolean } = {},
): ExerciseDef => ({
  generator: 'read-snippet',
  params: { key: C, ...params },
  mode: opts.bpm ? 'tempo' : 'wait',
  ...(opts.bpm ? { bpm: opts.bpm, timingTier: 'relaxed' as const } : {}),
  rung: opts.lit ? 'keys-lit' : 'note-names',
  hand: opts.hand ?? (params['clef'] === 'bass' ? 'lh' : 'rh'),
  seedPolicy: 'random',
});

/** A tune written on the treble staff. */
export const tune = (t: Tune, bars: number, opts: { lit: boolean; bpm?: number }): ExerciseDef => ({
  generator: 'phrase',
  params: {
    title: t.title,
    beatsPerBar: t.beatsPerBar,
    clef: 'treble',
    key: C,
    notes: tuneNotes(t, 0, bars),
    pickupBeats: t.pickupBeats ?? 0,
  },
  mode: 'tempo',
  bpm: opts.bpm ?? t.bpm - 12,
  timingTier: 'relaxed',
  rung: opts.lit ? 'keys-lit' : 'note-names',
  hand: 'rh',
  seedPolicy: 'fixed',
});
