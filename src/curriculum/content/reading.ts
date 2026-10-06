import { tr } from '@/i18n';
import type { Track, Unit } from '../schema';
import type { ExerciseDef } from '@/engine/types';
import { AU_CLAIR, ODE_TO_JOY, tuneNotes, type Tune } from './tunes';

/**
 * Course: Read music. Topic order follows Simple Piano (foxzi/simplepiano,
 * Apache 2.0); the lessons are our own. Each lesson is a few one-line cards
 * with notes to play, then one practice and one check — about four minutes.
 */

const C = { tonic: 'C', mode: 'major' as const };

/** A fresh phrase to read. No key lights: the staff is the only prompt. */
const read = (
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
const tune = (t: Tune, bars: number, opts: { lit: boolean; bpm?: number }): ExerciseDef => ({
  generator: 'phrase',
  params: {
    title: t.title,
    beatsPerBar: t.beatsPerBar,
    clef: 'treble',
    key: C,
    notes: tuneNotes(t, 0, bars),
  },
  mode: 'tempo',
  bpm: opts.bpm ?? t.bpm - 12,
  timingTier: 'relaxed',
  rung: opts.lit ? 'keys-lit' : 'note-names',
  hand: 'rh',
  seedPolicy: 'fixed',
});

export const readingTrack: Track = {
  id: 'rd',
  title: tr('Read music'),
  summary: tr('From middle C to sight-reading: the staff, both clefs, note lengths and your first tunes.'),
  suggestedStage: 0,
  unitIds: ['rd.u1', 'rd.u2', 'rd.u3', 'rd.u4', 'rd.u5', 'rd.u6', 'rd.u7', 'rd.u8', 'rd.u9'],
};

const lesson = (u: Omit<Unit, 'stageId' | 'kind' | 'strandWeights' | 'prerequisites'>): Unit => ({
  ...u,
  stageId: 'rd',
  kind: 'lesson',
  strandWeights: { read: 3, keys: 1 },
  prerequisites: [],
});

export const readingUnits: Unit[] = [
  lesson({
    id: 'rd.u1',
    ordinal: 0,
    title: tr('The staff and middle C'),
    concepts: ['read:staff:treble:c'],
    minutes: 4,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('Music is written on a **staff**: five lines. Each line and each space is one white key.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('This is **middle C**, on its own short line below the staff. Play it.'),
            clef: 'treble',
            notes: ['C4'],
            hint: tr('Middle C is the C nearest the middle of your keyboard.'),
          },
          { kind: 'text', md: tr('One step up the staff is one white key up.') },
          {
            kind: 'staffCheck',
            ask: tr('Play these three: C, then D, then E.'),
            clef: 'treble',
            notes: ['C4', 'D4', 'E4'],
          },
        ],
      },
      { kind: 'guided', id: 'rd.u1.g1', exercise: read({ low: 60, high: 64, bars: 2, maxLeap: 1 }) },
      {
        kind: 'graded',
        id: 'rd.u1.t1',
        passScore: 0.8,
        exercise: read({ low: 60, high: 64, bars: 2, maxLeap: 2 }),
      },
    ],
  }),
  lesson({
    id: 'rd.u2',
    ordinal: 1,
    title: tr('Treble clef: C to G'),
    concepts: ['read:staff:treble:c'],
    minutes: 4,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('The curl at the start is the **treble clef**. It wraps around the line of **G**.'),
          },
          { kind: 'staffCheck', ask: tr('Play this G.'), clef: 'treble', notes: ['G4'] },
          {
            kind: 'staffCheck',
            ask: tr('Walk up from middle C to G.'),
            clef: 'treble',
            notes: ['C4', 'D4', 'E4', 'F4', 'G4'],
          },
          { kind: 'text', md: tr('From a line to the next line, you skip one key.') },
          {
            kind: 'staffCheck',
            ask: tr('Play the line notes: C, E, G.'),
            clef: 'treble',
            notes: ['C4', 'E4', 'G4'],
          },
        ],
      },
      { kind: 'guided', id: 'rd.u2.g1', exercise: read({ low: 60, high: 67, bars: 2 }) },
      { kind: 'graded', id: 'rd.u2.t1', passScore: 0.8, exercise: read({ low: 60, high: 67, bars: 3 }) },
    ],
  }),
  lesson({
    id: 'rd.u3',
    ordinal: 2,
    title: tr('The whole treble staff'),
    concepts: ['read:staff:treble:c'],
    minutes: 5,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('The five lines, from the bottom: **E G B D F**. Say *Every Good Boy Does Fine*.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Play the five lines, bottom to top.'),
            clef: 'treble',
            notes: ['E4', 'G4', 'B4', 'D5', 'F5'],
          },
          { kind: 'text', md: tr('The four spaces spell **F A C E**.') },
          {
            kind: 'staffCheck',
            ask: tr('Play the four spaces, bottom to top.'),
            clef: 'treble',
            notes: ['F4', 'A4', 'C5', 'E5'],
          },
        ],
      },
      { kind: 'guided', id: 'rd.u3.g1', exercise: read({ low: 64, high: 77, bars: 2 }) },
      {
        kind: 'graded',
        id: 'rd.u3.t1',
        passScore: 0.8,
        exercise: read({ low: 60, high: 79, bars: 3, maxLeap: 3 }),
      },
    ],
  }),
  lesson({
    id: 'rd.u4',
    ordinal: 3,
    title: tr('The bass clef'),
    concepts: ['read:staff:bass:c'],
    minutes: 5,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('Low notes use a second staff, with the **bass clef**. Its two dots hug the line of **F**.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Play this F with your left hand. It sits just below middle C.'),
            clef: 'bass',
            notes: ['F3'],
          },
          {
            kind: 'staffCheck',
            ask: tr('Middle C again, now on a short line **above** the staff.'),
            clef: 'bass',
            notes: ['C4'],
          },
          {
            kind: 'staffCheck',
            ask: tr('Walk down from middle C to F.'),
            clef: 'bass',
            notes: ['C4', 'B3', 'A3', 'G3', 'F3'],
          },
        ],
      },
      { kind: 'guided', id: 'rd.u4.g1', exercise: read({ clef: 'bass', low: 53, high: 60, bars: 2 }) },
      {
        kind: 'explain',
        id: 'rd.u4.e2',
        blocks: [
          { kind: 'text', md: tr('Bass lines, from the bottom: **G B D F A**.') },
          {
            kind: 'staffCheck',
            ask: tr('Play the five lines, bottom to top.'),
            clef: 'bass',
            notes: ['G2', 'B2', 'D3', 'F3', 'A3'],
          },
        ],
      },
      {
        kind: 'graded',
        id: 'rd.u4.t1',
        passScore: 0.8,
        exercise: read({ clef: 'bass', low: 43, high: 60, bars: 3 }),
      },
    ],
  }),
  lesson({
    id: 'rd.u5',
    ordinal: 4,
    title: tr('How long: quarter, half, whole'),
    concepts: ['read:staff:treble:c'],
    minutes: 5,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('A note’s shape says how long to hold it. A filled note with a stem is a **quarter**: one beat.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Four quarters, one beat each. Hear them, then play them.'),
            clef: 'treble',
            notes: ['C4', 'D4', 'E4', 'C4'],
            listen: true,
          },
          {
            kind: 'text',
            md: tr('An open note with a stem is a **half**: two beats. With no stem, it is a **whole**: four beats.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Two halves, then a whole. Hold each key while you count.'),
            clef: 'treble',
            notes: ['E4', 'D4', 'C4'],
            beats: [2, 2, 4],
            listen: true,
          },
        ],
      },
      {
        kind: 'guided',
        id: 'rd.u5.g1',
        exercise: read({ low: 60, high: 67, bars: 2, rhythm: 'long' }, { bpm: 60, lit: true }),
      },
      {
        kind: 'graded',
        id: 'rd.u5.t1',
        passScore: 0.75,
        exercise: read({ low: 60, high: 67, bars: 2, rhythm: 'long' }, { bpm: 60 }),
      },
    ],
  }),
  lesson({
    id: 'rd.u6',
    ordinal: 5,
    title: tr('Rests: counted silence'),
    concepts: ['read:staff:treble:c'],
    minutes: 4,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('A **rest** is written silence. Lift your hand, and keep counting.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Play the notes. Stay silent on the rests.'),
            clef: 'treble',
            notes: ['C4', 'rest', 'E4', 'rest', 'G4', 'E4', 'C4', 'rest'],
            listen: true,
          },
        ],
      },
      {
        kind: 'guided',
        id: 'rd.u6.g1',
        exercise: read({ low: 60, high: 67, bars: 2, rhythm: 'rests' }, { bpm: 60, lit: true }),
      },
      {
        kind: 'graded',
        id: 'rd.u6.t1',
        passScore: 0.75,
        exercise: read({ low: 60, high: 67, bars: 2, rhythm: 'rests' }, { bpm: 60 }),
      },
    ],
  }),
  lesson({
    id: 'rd.u7',
    ordinal: 6,
    title: tr('Eighth notes: two per beat'),
    concepts: ['read:staff:treble:c'],
    minutes: 4,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('Two notes joined by a beam are **eighths**: half a beat each. Count *1-and, 2-and*.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Hear it, then play it.'),
            clef: 'treble',
            notes: ['C4', 'D4', 'E4', 'D4', 'C4'],
            beats: [0.5, 0.5, 0.5, 0.5, 2],
            listen: true,
          },
        ],
      },
      {
        kind: 'guided',
        id: 'rd.u7.g1',
        exercise: read({ low: 60, high: 67, bars: 2, rhythm: 'eighths' }, { bpm: 56, lit: true }),
      },
      {
        kind: 'graded',
        id: 'rd.u7.t1',
        passScore: 0.75,
        exercise: read({ low: 60, high: 67, bars: 2, rhythm: 'eighths' }, { bpm: 56 }),
      },
    ],
  }),
  lesson({
    id: 'rd.u8',
    ordinal: 7,
    title: tr('Your first tunes'),
    concepts: ['read:staff:treble:c'],
    minutes: 6,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u8.e1',
        blocks: [
          { kind: 'text', md: tr('Real tunes now. Read slowly, and keep going after a wrong note.') },
          {
            kind: 'staffCheck',
            ask: tr('The first notes of a famous tune. Play them.'),
            clef: 'treble',
            notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4'],
            listen: true,
          },
        ],
      },
      { kind: 'guided', id: 'rd.u8.g1', exercise: tune(ODE_TO_JOY, 4, { lit: true }) },
      { kind: 'guided', id: 'rd.u8.g2', exercise: tune(AU_CLAIR, 4, { lit: true }) },
      { kind: 'graded', id: 'rd.u8.t1', passScore: 0.75, exercise: tune(ODE_TO_JOY, 8, { lit: false }) },
    ],
  }),
  lesson({
    id: 'rd.u9',
    ordinal: 8,
    title: tr('Sight-reading'),
    concepts: ['read:staff:treble:g', 'read:staff:bass:c'],
    minutes: 6,
    steps: [
      {
        kind: 'explain',
        id: 'rd.u9.e1',
        blocks: [
          {
            kind: 'text',
            md: tr('**Sight-reading** is playing music you have never seen. Never stop, and look one note ahead.'),
          },
          {
            kind: 'text',
            md: tr('A sharp at the start of each line is a **key signature**: here, every F is F♯.'),
          },
          {
            kind: 'staffCheck',
            ask: tr('Play the G major scale from the staff. Watch the F.'),
            clef: 'treble',
            key: { tonic: 'G', mode: 'major' },
            notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
          },
        ],
      },
      {
        kind: 'guided',
        id: 'rd.u9.g1',
        exercise: read({ key: { tonic: 'G', mode: 'major' }, bars: 2, rhythm: 'halves' }, { bpm: 56 }),
      },
      {
        kind: 'graded',
        id: 'rd.u9.t1',
        passScore: 0.75,
        exercise: read({ key: { tonic: 'G', mode: 'major' }, bars: 4, rhythm: 'halves' }, { bpm: 56 }),
      },
      {
        kind: 'graded',
        id: 'rd.u9.t2',
        passScore: 0.75,
        exercise: read({ clef: 'bass', bars: 4, rhythm: 'halves' }, { bpm: 56 }),
      },
    ],
  }),
];
