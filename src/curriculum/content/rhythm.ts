import { tr } from '@/i18n';
import type { Track, Unit } from '../schema';
import { read, tune } from './courseKit';
import { WHEN_THE_SAINTS } from './tunes';

/**
 * Course: Rhythm. Dotted notes, syncopation, pickups and 3/4 time, read from
 * the staff. Topics follow Simple Piano (foxzi/simplepiano, Apache 2.0); the
 * lessons are our own. It builds on Read music lessons 5 to 7 (note lengths).
 */

export const rhythmTrack: Track = {
  id: 'rt',
  title: tr('Rhythm'),
  summary: tr('Dotted notes, syncopation, pickups and three-beat bars. Best after Read music lesson 7.'),
  suggestedStage: 1,
  unitIds: ['rt.u1', 'rt.u2', 'rt.u3', 'rt.u4'],
};

const lesson = (u: Omit<Unit, 'stageId' | 'kind' | 'strandWeights' | 'prerequisites'>): Unit => ({
  ...u,
  stageId: 'rt',
  kind: 'lesson',
  strandWeights: { read: 2, keys: 2 },
  prerequisites: [],
});

const NOTES = { low: 60, high: 67 };

export const rhythmUnits: Unit[] = [
  lesson({
    id: 'rt.u1',
    ordinal: 0,
    title: tr('Dotted notes'),
    concepts: [],
    minutes: 5,
    steps: [
      {
        kind: 'explain',
        id: 'rt.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('A **dot** makes a note half as long again. A dotted half lasts three beats.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Clap it and count aloud first: *1, 2, 3*, then *4*. Then play it.'),
            clef: 'treble',
            notes: ['E4', 'D4', 'C4'],
            beats: [3, 1, 4],
            listen: true,
          },
          {
            kind: 'text',
            md: tr('A dotted quarter lasts one and a half beats. The short note after it falls on *and*.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Count *1, 2-and*: the eighth lands on the *and*.'),
            clef: 'treble',
            notes: ['C4', 'D4', 'E4', 'C4'],
            beats: [1.5, 0.5, 1, 1],
            listen: true,
          },
        ],
      },
      {
        kind: 'guided',
        id: 'rt.u1.g1',
        exercise: read({ ...NOTES, bars: 2, rhythm: 'dotted' }, { bpm: 56, lit: true }),
      },
      {
        kind: 'graded',
        id: 'rt.u1.t1',
        passScore: 0.75,
        exercise: read({ ...NOTES, bars: 2, rhythm: 'dotted' }, { bpm: 56 }),
      },
    ],
  }),
  lesson({
    id: 'rt.u2',
    ordinal: 1,
    title: tr('Syncopation'),
    concepts: [],
    minutes: 5,
    steps: [
      {
        kind: 'explain',
        id: 'rt.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('**Syncopation** starts a note between two beats and holds it across the next one.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Tap the beat with your foot. The long note starts on *and*.'),
            clef: 'treble',
            notes: ['C4', 'E4', 'G4', 'E4'],
            beats: [0.5, 1, 0.5, 2],
            listen: true,
          },
        ],
      },
      {
        kind: 'guided',
        id: 'rt.u2.g1',
        exercise: read({ ...NOTES, bars: 2, rhythm: 'syncopation' }, { bpm: 52, lit: true }),
      },
      {
        kind: 'graded',
        id: 'rt.u2.t1',
        passScore: 0.75,
        exercise: read({ ...NOTES, bars: 2, rhythm: 'syncopation' }, { bpm: 52 }),
      },
    ],
  }),
  lesson({
    id: 'rt.u3',
    ordinal: 2,
    title: tr('Pickup notes'),
    concepts: [],
    minutes: 5,
    steps: [
      {
        kind: 'explain',
        id: 'rt.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('Some tunes start before the first full bar. Those first notes are the **pickup**.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Count *2, 3, 4* on the pickup. The long G is beat 1.'),
            clef: 'treble',
            notes: ['C4', 'E4', 'F4', 'G4'],
            beats: [1, 1, 1, 4],
            pickupBeats: 3,
            listen: true,
          },
        ],
      },
      { kind: 'guided', id: 'rt.u3.g1', exercise: tune(WHEN_THE_SAINTS, 5, { lit: true }) },
      { kind: 'graded', id: 'rt.u3.t1', passScore: 0.75, exercise: tune(WHEN_THE_SAINTS, 8, { lit: false }) },
    ],
  }),
  lesson({
    id: 'rt.u4',
    ordinal: 3,
    title: tr('Three beats in a bar'),
    concepts: [],
    minutes: 4,
    steps: [
      {
        kind: 'explain',
        id: 'rt.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('In **3/4** time, each bar holds three beats. Count *1, 2, 3*, a little heavier on 1.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('A half, a quarter, then a dotted half. Hear it, then play it.'),
            clef: 'treble',
            notes: ['C4', 'E4', 'G4'],
            beats: [2, 1, 3],
            beatsPerBar: 3,
            listen: true,
          },
        ],
      },
      {
        kind: 'guided',
        id: 'rt.u4.g1',
        exercise: read({ ...NOTES, bars: 4, beatsPerBar: 3, rhythm: 'halves' }, { bpm: 72, lit: true }),
      },
      {
        kind: 'graded',
        id: 'rt.u4.t1',
        passScore: 0.75,
        exercise: read({ ...NOTES, bars: 4, beatsPerBar: 3, rhythm: 'long' }, { bpm: 72 }),
      },
    ],
  }),
];
