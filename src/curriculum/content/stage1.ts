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
  ({ generator, params, mode: 'tempo', bpm, timingTier: 'relaxed', rung, hand, seedPolicy: 'random' }) as ExerciseDef;

export const stage1: Stage = {
  id: 's1',
  ordinal: 1,
  title: 'One key, whole system',
  tagline: 'C major from the inside',
  summary:
    'One key, learned deeply: the scale as a recipe, degrees as an address system, and your first four chords — enough to accompany a real song by the end.',
  unitIds: ['s1.u1', 's1.u2', 's1.u3', 's1.u4', 's1.u5', 's1.u6', 's1.u7', 's1.cp'],
};

export const stage1Units: Unit[] = [
  {
    id: 's1.u1',
    stageId: 's1',
    ordinal: 0,
    title: 'The major scale recipe',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['scale:c:major:rh:1oct', 'theory:scale-recipe'],
    prerequisites: ['s0.cp'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Every major scale is the same recipe: **whole, whole, half, whole, whole, whole, half**. Start on C and the recipe lands on all white keys.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'C major — the recipe walked out loud.',
            demo: {
              bpm: 100,
              loop: false,
              events: [60, 62, 64, 65, 67, 69, 71, 72].map((midi, i) => ({ midi, atBeat: i, durBeats: 1 })),
            },
          },
          {
            kind: 'text',
            md: 'Eight notes need a trick: after finger 3, the **thumb tucks under** to keep going. The finger numbers on the keys show the standard route — it never changes.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's1.u1.g1',
        exercise: wait('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'guided',
        id: 's1.u1.g2',
        exercise: wait('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'down' }),
      },
      {
        kind: 'create',
        id: 's1.u1.c1',
        prompt: 'Walk up the scale, but pause anywhere that sounds unfinished. Feel how it wants to land back on C.',
      },
    ],
  },
  {
    id: 's1.u2',
    stageId: 's1',
    ordinal: 1,
    title: 'Thumb-under, both hands',
    strandWeights: { keys: 3 },
    concepts: ['scale:c:major:lh:1oct'],
    prerequisites: ['s1.u1'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Left hand runs the mirror route: start on finger **5**, and after the thumb, finger **3 crosses over**. Slow is the fast way to learn this.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's1.u2.g1',
        exercise: wait('scale-run', { tonic: 'C', scaleType: 'major', hand: 'lh', direction: 'up' }, 'lh'),
      },
      {
        kind: 'ladder',
        id: 's1.u2.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'updown' }, 60),
      },
      {
        kind: 'graded',
        id: 's1.u2.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'up' }, 60),
      },
      {
        kind: 'graded',
        id: 's1.u2.q2',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'lh', direction: 'up' }, 60, 'lh'),
      },
    ],
  },
  {
    id: 's1.u3',
    stageId: 's1',
    ordinal: 2,
    title: 'Degrees: the scale gets numbers',
    strandWeights: { theory: 2, ear: 2 },
    concepts: ['theory:degrees', 'ear:degree:135'],
    prerequisites: ['s1.u2'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Forget letter names for a minute. Inside a key, notes have **numbers**: C is **1**, D is **2**… up to B as **7**. The numbers carry the *meaning* — 1 feels like home, 5 pulls, 7 leans.',
          },
          {
            kind: 'text',
            md: 'These numbers travel: in G major, G becomes 1. Learn the numbers once and every key comes free. From here, degree colors light up across the app.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's1.u3.g1',
        exercise: wait('ear-degree', { key: { tonic: 'C', mode: 'major' }, degreePool: [1, 3, 5], count: 4 }, 'rh', 'by-ear'),
      },
      {
        kind: 'graded',
        id: 's1.u3.q1',
        passScore: 0.8,
        exercise: wait('ear-degree', { key: { tonic: 'C', mode: 'major' }, degreePool: [1, 3, 5], count: 6 }, 'rh', 'by-ear'),
      },
      {
        kind: 'create',
        id: 's1.u3.c1',
        prompt: 'Sing along as you play degrees 1–5 by number ("one, two, three…"). Silly? Yes. It wires the ear.',
      },
    ],
  },
  {
    id: 's1.u4',
    stageId: 's1',
    ordinal: 3,
    title: 'Your first chord: home',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['chord:c:maj:inv0', 'theory:triad135'],
    prerequisites: ['s1.u3'],
    minutes: 7,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: 'A **chord** is degrees **1, 3 and 5 sounded together**. Built on C, that\'s C–E–G: the C major triad — the sound of "home".',
          },
          {
            kind: 'keyboardDemo',
            caption: 'One, three, five — then all at once.',
            demo: {
              bpm: 90,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 1, durBeats: 1 },
                { midi: 67, atBeat: 2, durBeats: 1 },
                { midi: 60, atBeat: 3, durBeats: 2 },
                { midi: 64, atBeat: 3, durBeats: 2 },
                { midi: 67, atBeat: 3, durBeats: 2 },
              ],
            },
          },
        ],
      },
      { kind: 'guided', id: 's1.u4.g1', exercise: wait('chord-grip', { root: 'C', quality: 'maj' }) },
      {
        kind: 'graded',
        id: 's1.u4.q1',
        passScore: 0.8,
        exercise: wait('grip-interleave', { roots: ['C'], qualities: ['maj'], count: 4 }),
      },
      {
        kind: 'create',
        id: 's1.u4.c1',
        prompt: 'Left hand plays a low C, right hand the chord. Let it ring. That\'s already accompaniment.',
      },
    ],
  },
  {
    id: 's1.u5',
    stageId: 's1',
    ordinal: 4,
    title: 'Three chords, a thousand songs',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['chord:f:maj:inv0', 'chord:g:maj:inv0', 'prog:i-iv-v:c'],
    prerequisites: ['s1.u4'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Build the same 1-3-5 shape starting on degree **4** (F) and degree **5** (G). Chords get roman numerals for their degree: **I**, **IV**, **V**.',
          },
          {
            kind: 'progressionCard',
            roman: ['I', 'IV', 'V'],
            key: { tonic: 'C', mode: 'major' },
          },
          {
            kind: 'text',
            md: 'I–IV–V is half of folk, blues and rock. Once your hands know these three shapes, hundreds of songs are one chart away.',
          },
        ],
      },
      { kind: 'guided', id: 's1.u5.g1', exercise: wait('chord-grip', { root: 'F', quality: 'maj' }) },
      { kind: 'guided', id: 's1.u5.g2', exercise: wait('chord-grip', { root: 'G', quality: 'maj' }) },
      {
        kind: 'guided',
        id: 's1.u5.g3',
        exercise: wait('progression-play', { key: { tonic: 'C', mode: 'major' }, roman: ['I', 'IV', 'V', 'I'], loops: 1 }),
      },
      {
        kind: 'graded',
        id: 's1.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: { tonic: 'C', mode: 'major' }, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 2 },
          70,
        ),
      },
    ],
  },
  {
    id: 's1.u6',
    stageId: 's1',
    ordinal: 5,
    title: 'The sad one: vi',
    strandWeights: { keys: 1, theory: 1, ear: 2 },
    concepts: ['chord:a:min:inv0', 'ear:quality:majmin', 'prog:i-v-vi-iv:c'],
    prerequisites: ['s1.u5'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Build 1-3-5 on degree **6** (A) and something changes: the middle note sits a half step lower. That small move makes a **minor** chord — the wistful one. Lowercase numeral: **vi**.',
          },
          {
            kind: 'progressionCard',
            roman: ['I', 'V', 'vi', 'IV'],
            key: { tonic: 'C', mode: 'major' },
          },
          {
            kind: 'text',
            md: '**I–V–vi–IV** is the most-used progression in modern pop. You are four shapes away from most of the radio.',
          },
        ],
      },
      { kind: 'guided', id: 's1.u6.g1', exercise: wait('chord-grip', { root: 'A', quality: 'min' }) },
      {
        kind: 'guided',
        id: 's1.u6.g2',
        exercise: wait('ear-quality', { qualityPool: ['maj', 'min'], roots: ['C'], count: 4 }, 'rh', 'by-ear'),
      },
      {
        kind: 'graded',
        id: 's1.u6.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: { tonic: 'C', mode: 'major' }, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2 },
          70,
        ),
      },
    ],
  },
  {
    id: 's1.u7',
    stageId: 's1',
    ordinal: 6,
    title: 'Play a real song',
    strandWeights: { keys: 2, create: 2 },
    concepts: ['song:first-light'],
    prerequisites: ['s1.u6'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: '*First Light* uses exactly your four chords. The chart shows one chord per bar — play each as it comes, any octave, root at the bottom.',
          },
          {
            kind: 'text',
            md: 'This is how working musicians read most pop music: **chords over bars**, not note-by-note sheet music.',
          },
        ],
      },
      { kind: 'guided', id: 's1.u7.g1', exercise: wait('chart-play', { songId: 'first-light' }, 'both', 'chord-symbols') },
      {
        kind: 'graded',
        id: 's1.u7.q1',
        passScore: 0.8,
        exercise: {
          generator: 'chart-play',
          params: { songId: 'first-light' },
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
        id: 's1.u7.c1',
        prompt: 'Reorder the four chords into your own loop. Start somewhere other than C — notice how the story changes.',
      },
    ],
  },
  {
    id: 's1.cp',
    stageId: 's1',
    ordinal: 7,
    title: 'Checkpoint: C major',
    strandWeights: { keys: 2, theory: 1, ear: 1 },
    concepts: [],
    prerequisites: ['s1.u7'],
    minutes: 8,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's1.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'One key, owned: the scale in time, all four chords on demand, degrees by ear, and a song from its chart.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's1.cp.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'up' }, 60),
      },
      {
        kind: 'graded',
        id: 's1.cp.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: { tonic: 'C', mode: 'major' }, roman: ['I', 'IV', 'V', 'vi'], beatsPerChord: 4, loops: 2 },
          70,
        ),
      },
      {
        kind: 'graded',
        id: 's1.cp.q3',
        passScore: 0.8,
        exercise: wait('ear-degree', { key: { tonic: 'C', mode: 'major' }, degreePool: [1, 3, 5], count: 6 }, 'rh', 'by-ear'),
      },
    ],
  },
];
