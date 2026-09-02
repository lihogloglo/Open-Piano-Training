import type { Stage, Unit } from '../schema';
import type { ExerciseDef } from '@/engine/types';

type Hand = 'rh' | 'lh' | 'both';

const wait = (
  generator: string,
  params: Record<string, unknown>,
  hand: Hand = 'rh',
  rung = 'chord-symbols',
): ExerciseDef => ({ generator, params, mode: 'wait', rung, hand, seedPolicy: 'random' }) as ExerciseDef;

const tempo = (
  generator: string,
  params: Record<string, unknown>,
  bpm: number,
  hand: Hand = 'rh',
  rung = 'chord-symbols',
): ExerciseDef =>
  ({
    generator,
    params,
    mode: 'tempo',
    bpm,
    timingTier: 'standard',
    rung,
    hand,
    seedPolicy: 'random',
  }) as ExerciseDef;

const C = { tonic: 'C', mode: 'major' } as const;
const G = { tonic: 'G', mode: 'major' } as const;

export const stage4: Stage = {
  id: 's4',
  ordinal: 4,
  title: 'Smooth hands',
  tagline: 'Inversions & voice leading',
  summary:
    'Stop leaping between root positions. Inversions put every chord change under your hand, and voice leading — moving each finger as little as possible — is what makes chords sound like music.',
  unitIds: ['s4.u1', 's4.u2', 's4.u3', 's4.u4', 's4.u5', 's4.u6', 's4.u7', 's4.cp'],
};

export const stage4Units: Unit[] = [
  {
    id: 's4.u1',
    stageId: 's4',
    ordinal: 0,
    title: 'The same chord, three grips',
    strandWeights: { keys: 3, theory: 1 },
    concepts: [
      'chord:c:maj:inv1',
      'chord:c:maj:inv2',
      'chord:f:maj:inv1',
      'chord:f:maj:inv2',
      'chord:g:maj:inv1',
      'chord:g:maj:inv2',
    ],
    prerequisites: ['s3.cp'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Any triad has three grips: root on the bottom, or **rotated** so the 3rd or the 5th sits lowest. Same notes, same chord — different handful.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'C major three ways: C-E-G, then E-G-C (1st inversion), then G-C-E (2nd).',
            demo: {
              bpm: 60,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 0, durBeats: 1 },
                { midi: 67, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 1, durBeats: 1 },
                { midi: 67, atBeat: 1, durBeats: 1 },
                { midi: 72, atBeat: 1, durBeats: 1 },
                { midi: 67, atBeat: 2, durBeats: 1 },
                { midi: 72, atBeat: 2, durBeats: 1 },
                { midi: 76, atBeat: 2, durBeats: 1 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'Written as a **slash chord**: C/E means "C major, E in the bass". When a chart says C/E, it wants that first inversion.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u1.g1',
        exercise: wait('grip-interleave', {
          roots: ['C'],
          qualities: ['maj'],
          inversions: [0, 1, 2],
          count: 6,
        }),
      },
      {
        kind: 'graded',
        id: 's4.u1.q1',
        passScore: 0.8,
        exercise: wait('grip-interleave', {
          roots: ['C', 'F', 'G'],
          qualities: ['maj'],
          inversions: [0, 1, 2],
          count: 12,
        }),
      },
    ],
  },
  {
    id: 's4.u2',
    stageId: 's4',
    ordinal: 1,
    title: 'The shortest way',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['theory:voiceleading'],
    prerequisites: ['s4.u1'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: "The voice-leading law: **keep common tones, move the rest as little as possible.** I→IV in C isn't a leap to F — it's C staying put while E and G slide up one step each: **C→F/C**.",
          },
          {
            kind: 'keyboardDemo',
            caption: 'C to F the long way, then the short way. Hear the difference.',
            demo: {
              bpm: 70,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 0, durBeats: 1 },
                { midi: 67, atBeat: 0, durBeats: 1 },
                { midi: 65, atBeat: 1, durBeats: 1 },
                { midi: 69, atBeat: 1, durBeats: 1 },
                { midi: 72, atBeat: 1, durBeats: 1 },
                { midi: 60, atBeat: 2.5, durBeats: 1 },
                { midi: 64, atBeat: 2.5, durBeats: 1 },
                { midi: 67, atBeat: 2.5, durBeats: 1 },
                { midi: 60, atBeat: 3.5, durBeats: 1 },
                { midi: 65, atBeat: 3.5, durBeats: 1 },
                { midi: 69, atBeat: 3.5, durBeats: 1 },
              ],
            },
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u2.g1',
        exercise: wait('progression-play', {
          key: C,
          roman: ['I', 'IV', 'V', 'I'],
          loops: 1,
          voiceLead: 'smooth',
        }),
      },
      {
        kind: 'graded',
        id: 's4.u2.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          60,
        ),
      },
    ],
  },
  {
    id: 's4.u3',
    stageId: 's4',
    ordinal: 2,
    title: 'Smooth pop',
    strandWeights: { keys: 3 },
    concepts: ['prog-smooth:i-v-vi-iv:c', 'prog-smooth:i-v-vi-iv:g'],
    prerequisites: ['s4.u2'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The four-chord loop, minimum motion. Your score now includes a **smoothness** number — it measures how far your fingers traveled versus the ideal path.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's4.u3.l1',
        tempos: [0.75, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'graded',
        id: 's4.u3.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'graded',
        id: 's4.u3.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: G, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
    ],
  },
  {
    id: 's4.u4',
    stageId: 's4',
    ordinal: 3,
    title: 'All grips, all keys (part 1)',
    strandWeights: { keys: 3 },
    concepts: ['spell:triad:inversions'],
    prerequisites: ['s4.u3'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Interleaved grips again — now with inversions in the deck, over the triads of C, G, D and F. Mixed on purpose: recall under mild pressure is what makes it permanent.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u4.g1',
        exercise: wait('grip-interleave', {
          roots: ['C', 'D', 'G', 'A'],
          qualities: ['maj', 'min'],
          inversions: [0, 1],
          count: 8,
        }),
      },
      {
        kind: 'graded',
        id: 's4.u4.q1',
        passScore: 0.8,
        exercise: tempo(
          'grip-interleave',
          {
            roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            qualities: ['maj', 'min'],
            inversions: [0, 1, 2],
            count: 16,
          },
          48, // 2 beats per grip at 48 BPM = 2.5s each
        ),
      },
    ],
  },
  {
    id: 's4.u5',
    stageId: 's4',
    ordinal: 4,
    title: 'Left hand grows up',
    strandWeights: { keys: 3 },
    concepts: ['pattern:lh:rootfifth', 'pattern:lh:broken'],
    prerequisites: ['s4.u4'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: "The left hand's real job isn't chords — it's **foundation**. The broken pattern *root · fifth · octave · fifth* outlines the harmony while the right hand does the talking.",
          },
          {
            kind: 'keyboardDemo',
            caption: 'C bar, LH broken pattern: C2 · G2 · C3 · G2.',
            demo: {
              bpm: 80,
              loop: true,
              events: [
                { midi: 36, atBeat: 0, durBeats: 1 },
                { midi: 43, atBeat: 1, durBeats: 1 },
                { midi: 48, atBeat: 2, durBeats: 1 },
                { midi: 43, atBeat: 3, durBeats: 1 },
              ],
            },
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's4.u5.l1',
        tempos: [0.5, 0.75, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 1, style: 'brokenLH' },
          80,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's4.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 1,
            style: 'brokenLH',
            voiceLead: 'smooth',
          },
          72,
          'both',
        ),
      },
    ],
  },
  {
    id: 's4.u6',
    stageId: 's4',
    ordinal: 5,
    title: 'Cadences',
    strandWeights: { theory: 2, ear: 2 },
    concepts: ['theory:cadence', 'ear:cadence'],
    prerequisites: ['s4.u5'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'A **cadence** is how a phrase ends. **Authentic** (V→I): the full stop. **Plagal** (IV→I): the soft amen. **Half** (…→V): a comma — the music stops mid-sentence, waiting.',
          },
          {
            kind: 'earCheck',
            question: 'Full stop or comma?',
            demo: {
              bpm: 76,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 0, durBeats: 1 },
                { midi: 67, atBeat: 0, durBeats: 1 },
                { midi: 65, atBeat: 1, durBeats: 1 },
                { midi: 69, atBeat: 1, durBeats: 1 },
                { midi: 72, atBeat: 1, durBeats: 1 },
                { midi: 55, atBeat: 2, durBeats: 2 },
                { midi: 59, atBeat: 2, durBeats: 2 },
                { midi: 62, atBeat: 2, durBeats: 2 },
              ],
            },
            options: ['Full stop (lands home)', 'Comma (left hanging)'],
            correctIndex: 1,
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u6.g1',
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['V', 'I'],
              ['IV', 'I'],
            ],
            count: 2,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's4.u6.q1',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['V', 'I'],
              ['IV', 'I'],
              ['I', 'V'],
            ],
            count: 3,
          },
          'rh',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's4.u7',
    stageId: 's4',
    ordinal: 6,
    title: 'Song lab: texture',
    strandWeights: { keys: 3, create: 1 },
    concepts: ['song:northline:texture'],
    prerequisites: ['s4.u6'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: '**Northline** again — but grown up: left hand plays the broken pattern, right hand takes the smoothest grip of each chord. Same chart, twice the music.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's4.u7.l1',
        tempos: [0.75, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'northline', style: 'brokenLH', voiceLead: 'smooth' },
          80,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's4.u7.q1',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'northline', style: 'brokenLH', voiceLead: 'smooth' },
          80,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'create',
        id: 's4.u7.c1',
        prompt:
          'Play Paper Sun with any left-hand pattern you invent — straight roots, root-fifth pulses, your own broken shape. Pick the one that fits its groove.',
      },
    ],
  },
  {
    id: 's4.cp',
    stageId: 's4',
    ordinal: 7,
    title: 'Checkpoint: Smooth hands',
    strandWeights: { keys: 3, ear: 1 },
    concepts: [],
    prerequisites: ['s4.u7'],
    minutes: 10,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's4.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The smooth-hands test: voice-led progressions in two keys, inversion recall at speed, cadences by ear, and a full-texture take.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's4.cp.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          80,
        ),
      },
      {
        kind: 'graded',
        id: 's4.cp.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: G, roman: ['I', 'vi', 'IV', 'V'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          80,
        ),
      },
      {
        kind: 'graded',
        id: 's4.cp.q3',
        passScore: 0.8,
        exercise: tempo(
          'grip-interleave',
          {
            roots: ['C', 'D', 'F', 'G', 'A'],
            qualities: ['maj', 'min'],
            inversions: [0, 1, 2],
            count: 12,
          },
          48,
        ),
      },
      {
        kind: 'graded',
        id: 's4.cp.q4',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['V', 'I'],
              ['IV', 'I'],
              ['I', 'V'],
            ],
            count: 3,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's4.cp.q5',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 1,
            style: 'brokenLH',
            voiceLead: 'smooth',
          },
          76,
          'both',
        ),
      },
    ],
  },
];
