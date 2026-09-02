import type { Stage, Unit } from '../schema';
import type { ExerciseDef } from '@/engine/types';

type Hand = 'rh' | 'lh' | 'both';

const wait = (generator: string, params: Record<string, unknown>, hand: Hand = 'rh', rung = 'keys-lit'): ExerciseDef =>
  ({ generator, params, mode: 'wait', rung, hand, seedPolicy: 'random' }) as ExerciseDef;

const tempo = (
  generator: string,
  params: Record<string, unknown>,
  bpm: number,
  hand: Hand = 'rh',
  rung = 'keys-lit',
): ExerciseDef =>
  ({ generator, params, mode: 'tempo', bpm, timingTier: 'standard', rung, hand, seedPolicy: 'random' }) as ExerciseDef;

const WHITE_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ALL_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const stage2: Stage = {
  id: 's2',
  ordinal: 2,
  title: 'The spelling engine',
  tagline: 'Build anything from any note',
  summary:
    'Stop memorizing shapes and start deriving them: intervals as the ruler, triads as stacked thirds, and three new keys via the circle of fifths.',
  unitIds: ['s2.u1', 's2.u2', 's2.u3', 's2.u4', 's2.u5', 's2.u6', 's2.u7', 's2.cp'],
};

export const stage2Units: Unit[] = [
  {
    id: 's2.u1',
    stageId: 's2',
    ordinal: 0,
    title: 'Measuring music: intervals',
    strandWeights: { theory: 3 },
    concepts: ['theory:interval:seconds-thirds', 'theory:interval:fourths-fifths'],
    prerequisites: ['s1.cp'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'An **interval** is a distance in half steps, with a name: 1 half step = **minor 2nd**, 2 = **major 2nd**, 3 = **minor 3rd**, 4 = **major 3rd**, 5 = **perfect 4th**, 7 = **perfect 5th**.',
          },
          {
            kind: 'text',
            md: 'Intervals are the ruler behind everything: the scale recipe was intervals; chords are about to become intervals too.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u1.g1',
        exercise: wait('flashcard', { kind: 'interval', roots: ['C', 'F', 'G'], intervals: ['M3', 'm3'], count: 6 }),
      },
      {
        kind: 'graded',
        id: 's2.u1.q1',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'interval',
          roots: WHITE_ROOTS,
          intervals: ['M3', 'm3', 'P4', 'P5'],
          count: 10,
        }),
      },
    ],
  },
  {
    id: 's2.u2',
    stageId: 's2',
    ordinal: 1,
    title: 'Stacking thirds',
    strandWeights: { theory: 2, keys: 2 },
    concepts: ['spell:triad:maj', 'spell:triad:min'],
    prerequisites: ['s2.u1'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Here is the engine: **major triad = major 3rd + minor 3rd** stacked. **Minor triad = minor 3rd + major 3rd.** From ANY root. No more memorizing shapes — you can now *build* them.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'D major, built live: D, up a major 3rd, up a minor 3rd.',
            demo: {
              bpm: 80,
              loop: false,
              events: [
                { midi: 62, atBeat: 0, durBeats: 1 },
                { midi: 66, atBeat: 1, durBeats: 1 },
                { midi: 69, atBeat: 2, durBeats: 1 },
                { midi: 62, atBeat: 3, durBeats: 2 },
                { midi: 66, atBeat: 3, durBeats: 2 },
                { midi: 69, atBeat: 3, durBeats: 2 },
              ],
            },
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u2.g1',
        exercise: wait('flashcard', { kind: 'spell', roots: ['D', 'E', 'A'], qualities: ['maj', 'min'], count: 6 }, 'rh', 'chord-symbols'),
      },
      {
        kind: 'graded',
        id: 's2.u2.q1',
        passScore: 0.8,
        exercise: wait('flashcard', { kind: 'spell', roots: WHITE_ROOTS, qualities: ['maj', 'min'], count: 10 }, 'rh', 'chord-symbols'),
      },
    ],
  },
  {
    id: 's2.u3',
    stageId: 's2',
    ordinal: 2,
    title: 'The black-key roots',
    strandWeights: { keys: 3, theory: 1 },
    concepts: ['spell:triad:allroots'],
    prerequisites: ['s2.u2'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The engine doesn\'t care about key color. **E♭ major** is still a major 3rd plus a minor 3rd. Twelve roots, two qualities — twenty-four triads, one rule.',
          },
          {
            kind: 'text',
            md: 'This drill mixes them on purpose. Mixed practice feels harder than repeating one chord — that\'s exactly why it sticks.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u3.g1',
        exercise: wait('grip-interleave', { roots: ['Db', 'Eb', 'F#', 'Ab', 'Bb'], qualities: ['maj'], count: 6 }, 'rh', 'chord-symbols'),
      },
      {
        kind: 'graded',
        id: 's2.u3.q1',
        passScore: 0.8,
        exercise: wait('grip-interleave', { roots: ALL_ROOTS, qualities: ['maj', 'min'], count: 14 }, 'rh', 'chord-symbols'),
      },
    ],
  },
  {
    id: 's2.u4',
    stageId: 's2',
    ordinal: 3,
    title: 'A new key: G',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['scale:g:major:rh:1oct', 'scale:g:major:lh:1oct', 'keysig:g:major', 'prog:i-iv-v:g'],
    prerequisites: ['s2.u3'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Run the scale recipe from **G** and one note bends: the recipe demands **F♯**. That single sharp *is* G major\'s key signature.',
          },
          { kind: 'circleOfFifths', highlight: ['C', 'G'] },
          {
            kind: 'text',
            md: 'Same fingering as C. And your I–IV–V system? It transposes instantly: **G, C and D** are the I, IV and V of G.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u4.g1',
        exercise: wait('scale-run', { tonic: 'G', scaleType: 'major', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'graded',
        id: 's2.u4.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'G', scaleType: 'major', hand: 'rh', direction: 'up' }, 60),
      },
      {
        kind: 'graded',
        id: 's2.u4.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: { tonic: 'G', mode: 'major' }, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 2 },
          70,
        ),
      },
    ],
  },
  {
    id: 's2.u5',
    stageId: 's2',
    ordinal: 4,
    title: 'The circle appears',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['scale:d:major:rh:1oct', 'keysig:d:major', 'theory:circle:sharps'],
    prerequisites: ['s2.u4'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Start the recipe a fifth higher each time and a pattern emerges: each new key keeps the old sharps and adds **one more**. That spiral has a name.',
          },
          { kind: 'circleOfFifths', highlight: ['C', 'G', 'D'] },
          {
            kind: 'text',
            md: '**D major**: two sharps (F♯, C♯). The circle of fifths isn\'t trivia — it\'s the map of every key you\'ll ever meet.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u5.g1',
        exercise: wait('scale-run', { tonic: 'D', scaleType: 'major', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'graded',
        id: 's2.u5.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'D', scaleType: 'major', hand: 'rh', direction: 'updown' }, 60),
      },
    ],
  },
  {
    id: 's2.u6',
    stageId: 's2',
    ordinal: 5,
    title: 'The flat side: F',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['scale:f:major:rh:1oct', 'keysig:f:major'],
    prerequisites: ['s2.u5'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Walk the circle the *other* way from C and flats appear: **F major** needs a **B♭**. One flat, counterclockwise.',
          },
          { kind: 'circleOfFifths', highlight: ['F', 'C'] },
          {
            kind: 'text',
            md: 'F breaks the usual fingering: the right hand runs **1-2-3-4** then tucks — the thumb refuses to land on the black B♭. Watch the finger labels.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u6.g1',
        exercise: wait('scale-run', { tonic: 'F', scaleType: 'major', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'graded',
        id: 's2.u6.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'F', scaleType: 'major', hand: 'rh', direction: 'updown' }, 60),
      },
    ],
  },
  {
    id: 's2.u7',
    stageId: 's2',
    ordinal: 6,
    title: 'Ear: major or minor?',
    strandWeights: { ear: 3, keys: 1 },
    concepts: ['ear:quality:majmin-solid'],
    prerequisites: ['s2.u6'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: 'You can *build* both triads. Time to *hear* them cold: bright and settled = **major**; shaded and inward = **minor**. Rebuild each chord you hear.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's2.u7.q1',
        passScore: 0.9,
        exercise: wait('ear-quality', { qualityPool: ['maj', 'min'], roots: ['C', 'F', 'G'], count: 8 }, 'rh', 'by-ear'),
      },
      {
        kind: 'graded',
        id: 's2.u7.q2',
        passScore: 0.8,
        exercise: {
          generator: 'chart-play',
          params: { songId: 'first-light', transposeTo: 'G' },
          mode: 'tempo',
          bpm: 72,
          timingTier: 'relaxed',
          rung: 'chord-symbols',
          hand: 'both',
          seedPolicy: 'random',
        },
      },
      {
        kind: 'create',
        id: 's2.u7.c1',
        prompt: 'Play any major chord, then sink its middle note a half step. Do it slowly, listening for the exact moment the light changes.',
      },
    ],
  },
  {
    id: 's2.cp',
    stageId: 's2',
    ordinal: 7,
    title: 'Checkpoint: Spelling engine',
    strandWeights: { keys: 2, theory: 2, ear: 1 },
    concepts: [],
    prerequisites: ['s2.u7'],
    minutes: 9,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's2.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The engine test: triads from any root, scales in four keys, intervals on demand, qualities by ear.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's2.cp.q1',
        passScore: 0.8,
        exercise: wait('grip-interleave', { roots: ALL_ROOTS, qualities: ['maj', 'min'], count: 12 }, 'rh', 'chord-symbols'),
      },
      {
        kind: 'graded',
        id: 's2.cp.q2',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'G', scaleType: 'major', hand: 'rh', direction: 'up' }, 60),
      },
      {
        kind: 'graded',
        id: 's2.cp.q3',
        passScore: 0.8,
        exercise: wait('flashcard', { kind: 'interval', roots: WHITE_ROOTS, intervals: ['m3', 'M3', 'P5'], count: 8 }),
      },
      {
        kind: 'graded',
        id: 's2.cp.q4',
        passScore: 0.85,
        exercise: wait('ear-quality', { qualityPool: ['maj', 'min'], roots: ['C', 'F', 'G'], count: 6 }, 'rh', 'by-ear'),
      },
    ],
  },
];
