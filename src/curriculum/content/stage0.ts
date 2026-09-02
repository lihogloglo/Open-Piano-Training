import type { Stage, Unit } from '../schema';
import type { ExerciseDef } from '@/engine/types';

const wait = (
  generator: string,
  params: Record<string, unknown>,
  hand: 'rh' | 'lh' | 'both' = 'rh',
): ExerciseDef => ({
  generator,
  params,
  mode: 'wait',
  rung: 'keys-lit',
  hand,
  seedPolicy: 'random',
});

const tempo = (
  generator: string,
  params: Record<string, unknown>,
  bpm: number,
  hand: 'rh' | 'lh' | 'both' = 'rh',
): ExerciseDef => ({
  generator,
  params,
  mode: 'tempo',
  bpm,
  timingTier: 'relaxed',
  rung: 'keys-lit',
  hand,
  seedPolicy: 'random',
});

export const stage0: Stage = {
  id: 's0',
  ordinal: 0,
  title: 'Bearings',
  tagline: 'Find your way around',
  summary:
    'The keyboard looks like 88 keys. It is really one pattern of 12, repeated. Learn to see the pattern, find any note instantly, and get both hands moving.',
  unitIds: ['s0.u1', 's0.u2', 's0.u3', 's0.u4', 's0.u5', 's0.u6', 's0.cp'],
};

export const stage0Units: Unit[] = [
  {
    id: 's0.u1',
    stageId: 's0',
    ordinal: 0,
    title: 'Meet the keyboard',
    strandWeights: { keys: 2, theory: 1 },
    concepts: ['note:find:c', 'note:find:f'],
    prerequisites: [],
    minutes: 6,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The black keys come in groups of **two** and **three**. That pattern repeats all the way up — one repeat is called an **octave**.',
          },
          {
            kind: 'text',
            md: '**C** sits just left of every group of two black keys. Find one C and you can find them all.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'Every C on the keyboard — same spot in every octave.',
            demo: {
              bpm: 110,
              loop: false,
              events: [
                { midi: 36, atBeat: 0, durBeats: 1 },
                { midi: 48, atBeat: 1, durBeats: 1 },
                { midi: 60, atBeat: 2, durBeats: 1 },
                { midi: 72, atBeat: 3, durBeats: 1 },
                { midi: 84, atBeat: 4, durBeats: 2 },
              ],
            },
          },
        ],
      },
      { kind: 'guided', id: 's0.u1.g1', exercise: wait('note-find', { notes: ['C'], count: 5 }) },
      {
        kind: 'explain',
        id: 's0.u1.e2',
        blocks: [
          {
            kind: 'text',
            md: '**F** has a landmark too: just left of every group of **three** black keys.',
          },
        ],
      },
      { kind: 'guided', id: 's0.u1.g2', exercise: wait('note-find', { notes: ['C', 'F'], count: 8 }) },
      {
        kind: 'create',
        id: 's0.u1.c1',
        prompt:
          'Free play: wander the keys for a minute. Try playing only Cs and Fs — low, high, both hands.',
      },
    ],
  },
  {
    id: 's0.u2',
    stageId: 's0',
    ordinal: 1,
    title: 'Every note has a name',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['note:find:d', 'note:find:e', 'note:find:g', 'note:find:a', 'note:find:b'],
    prerequisites: ['s0.u1'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The white keys walk up the alphabet from C: **C D E F G A B** — then C again. D lives *between* the two black keys. G and A live inside the group of three.',
          },
        ],
      },
      { kind: 'guided', id: 's0.u2.g1', exercise: wait('note-find', { notes: ['C', 'D', 'E'], count: 6 }) },
      {
        kind: 'guided',
        id: 's0.u2.g2',
        exercise: wait('note-find', { notes: ['F', 'G', 'A', 'B'], count: 8 }),
      },
      {
        kind: 'graded',
        id: 's0.u2.q1',
        passScore: 0.8,
        exercise: wait('note-find', { notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], count: 12 }),
      },
      {
        kind: 'create',
        id: 's0.u2.c1',
        prompt: 'Pick any three note names and play them as a little pattern. Repeat it low, then high.',
      },
    ],
  },
  {
    id: 's0.u3',
    stageId: 's0',
    ordinal: 2,
    title: 'Half steps & the black keys',
    strandWeights: { keys: 1, theory: 2 },
    concepts: ['note:find:sharps', 'theory:halfwhole'],
    prerequisites: ['s0.u2'],
    minutes: 7,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The smallest move on the keyboard is a **half step** — the very next key, black or white. A black key is named from its neighbors: a half step *up* from C is **C♯**; the same key seen from D is **D♭**.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'A chromatic walk: twelve half steps from C to C.',
            demo: {
              bpm: 140,
              loop: false,
              events: Array.from({ length: 13 }, (_, i) => ({ midi: 60 + i, atBeat: i, durBeats: 1 })),
            },
          },
          {
            kind: 'text',
            md: 'Two half steps make a **whole step** (C to D). Whole and half steps are the rulers every scale is measured with — they come back in the next stage.',
          },
        ],
      },
      { kind: 'guided', id: 's0.u3.g1', exercise: wait('note-find', { notes: ['C#', 'F#'], count: 6 }) },
      {
        kind: 'graded',
        id: 's0.u3.q1',
        passScore: 0.8,
        exercise: wait('note-find', { notes: ['C', 'Eb', 'F#', 'A', 'Bb', 'D'], count: 10 }),
      },
    ],
  },
  {
    id: 's0.u4',
    stageId: 's0',
    ordinal: 3,
    title: 'Your right hand: the five-finger home',
    strandWeights: { keys: 3 },
    concepts: ['fivefinger:c:maj:rh'],
    prerequisites: ['s0.u3'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Rest your right hand so the **thumb sits on C** and one finger covers each of the next four white keys. Curved fingers, loose wrist — like holding a bubble.',
          },
          {
            kind: 'text',
            md: 'Fingers are numbered **1 (thumb) to 5 (pinky)**. The key labels below show which finger plays each note.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u4.g1',
        exercise: wait('five-finger', { tonic: 'C', hand: 'rh', pattern: 'asc' }),
      },
      {
        kind: 'ladder',
        id: 's0.u4.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'updown' }, 80),
      },
      {
        kind: 'graded',
        id: 's0.u4.q1',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'updown' }, 80),
      },
      {
        kind: 'create',
        id: 's0.u4.c1',
        prompt:
          'Make a tiny melody using only these five keys. Start and end on C — hear how that feels like home.',
      },
    ],
  },
  {
    id: 's0.u5',
    stageId: 's0',
    ordinal: 4,
    title: 'Your left hand joins',
    strandWeights: { keys: 3 },
    concepts: ['fivefinger:c:maj:lh', 'fivefinger:g:maj:rh', 'fivefinger:g:maj:lh', 'fivefinger:f:maj:rh'],
    prerequisites: ['s0.u4'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Left hand mirrors right: the **pinky (5)** takes the low C, thumb the G above. Same shape, other direction.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u5.g1',
        exercise: wait('five-finger', { tonic: 'C', hand: 'lh', pattern: 'asc' }, 'lh'),
      },
      {
        kind: 'explain',
        id: 's0.u5.e2',
        blocks: [
          {
            kind: 'text',
            md: 'The five-finger shape moves anywhere. Shift it up to **G**, then over to **F** — new home, same hand.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u5.g2',
        exercise: wait('five-finger', { tonic: 'G', hand: 'rh', pattern: 'updown' }),
      },
      {
        kind: 'guided',
        id: 's0.u5.g3',
        exercise: wait('five-finger', { tonic: 'G', hand: 'lh', pattern: 'asc' }, 'lh'),
      },
      {
        kind: 'graded',
        id: 's0.u5.q1',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'F', hand: 'rh', pattern: 'updown' }, 76),
      },
    ],
  },
  {
    id: 's0.u6',
    stageId: 's0',
    ordinal: 5,
    title: 'Keeping time',
    strandWeights: { keys: 2, theory: 1 },
    concepts: ['rhythm:basic'],
    prerequisites: ['s0.u5'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Music lives on a steady pulse. The metronome clicks it; you place notes **on** it. From now on, timing gets feedback too.',
          },
          {
            kind: 'text',
            md: 'Colors after each note: **green** = on the beat, **amber** = early, **blue** = late. Early and late still count — they just tell you which way to lean.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's0.u6.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'asc' }, 80),
      },
      {
        kind: 'graded',
        id: 's0.u6.q1',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'updown' }, 80),
      },
    ],
  },
  {
    id: 's0.cp',
    stageId: 's0',
    ordinal: 6,
    title: 'Checkpoint: Bearings',
    strandWeights: { keys: 2, theory: 1 },
    concepts: [],
    prerequisites: ['s0.u6'],
    minutes: 6,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's0.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Show what you found: any note on demand, and a steady five-finger pattern in three keys. Pass this and Stage 1 opens.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's0.cp.q1',
        passScore: 0.8,
        exercise: wait('note-find', { notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'F#', 'Bb'], count: 12 }),
      },
      {
        kind: 'graded',
        id: 's0.cp.q2',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'G', hand: 'rh', pattern: 'updown' }, 80),
      },
      {
        kind: 'graded',
        id: 's0.cp.q3',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'C', hand: 'lh', pattern: 'asc' }, 80, 'lh'),
      },
    ],
  },
];
