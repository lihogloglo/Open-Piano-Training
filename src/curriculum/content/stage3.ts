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
const FOUR_KEYS = [
  { tonic: 'C', mode: 'major' },
  { tonic: 'G', mode: 'major' },
  { tonic: 'D', mode: 'major' },
  { tonic: 'F', mode: 'major' },
] as const;

export const stage3: Stage = {
  id: 's3',
  ordinal: 3,
  title: 'The Roman lens',
  tagline: 'Chords get jobs',
  summary:
    'Every key hides the same seven chords doing the same seven jobs. Learn to see I, IV and V instead of letters, and every song you meet becomes a pattern you already know.',
  unitIds: ['s3.u1', 's3.u2', 's3.u3', 's3.u4', 's3.u5', 's3.u6', 's3.u7', 's3.u8', 's3.cp'],
};

export const stage3Units: Unit[] = [
  {
    id: 's3.u1',
    stageId: 's3',
    ordinal: 0,
    title: 'Seven chords hiding in every scale',
    strandWeights: { theory: 2, keys: 2 },
    concepts: ['theory:diatonic-pattern', 'chord:b:dim:inv0'],
    prerequisites: ['s2.cp'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Stack a third and a fifth on **every** note of C major, using only white keys. Seven chords appear — and their qualities follow one fixed pattern: **M m m M M m dim**.',
          },
          {
            kind: 'text',
            md: "That pattern is the same in *every* major key. Learn it once, own it everywhere. The odd one out is the seventh: **B diminished** — two minor 3rds, tense on purpose.",
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u1.g1',
        exercise: wait('progression-play', {
          key: C,
          roman: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
          loops: 1,
        }),
      },
      {
        kind: 'graded',
        id: 's3.u1.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'I'], beatsPerChord: 4, loops: 1 },
          66,
        ),
      },
      {
        kind: 'create',
        id: 's3.u1.c1',
        prompt:
          'Walk the seven chords in any order you like. Notice which ones feel like home, which feel like leaving, and what B diminished wants to do.',
      },
    ],
  },
  {
    id: 's3.u2',
    stageId: 's3',
    ordinal: 1,
    title: 'Roman numerals',
    strandWeights: { theory: 3 },
    concepts: ['theory:roman'],
    prerequisites: ['s3.u1'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Name chords by **job**, not letter: capital numerals for major (**I, IV, V**), small for minor (**ii, iii, vi**), a ° for diminished (**vii°**).',
          },
          {
            kind: 'text',
            md: '"vi in G" asks: *sixth note of G major, minor quality* — E minor. The letter changes with the key; the numeral never does.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u2.g1',
        exercise: wait('flashcard', {
          kind: 'roman',
          keys: [C, G],
          romans: ['I', 'IV', 'V', 'vi'],
          count: 6,
        }),
      },
      {
        kind: 'graded',
        id: 's3.u2.q1',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'roman',
          keys: [...FOUR_KEYS],
          romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi'],
          count: 10,
        }),
      },
    ],
  },
  {
    id: 's3.u3',
    stageId: 's3',
    ordinal: 2,
    title: 'Home, away, tension',
    strandWeights: { theory: 2, ear: 2 },
    concepts: ['theory:function', 'ear:chord-function:145'],
    prerequisites: ['s3.u2'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Chords do three jobs. **Tonic** (I, vi, iii) is home. **Subdominant** (IV, ii) steps away. **Dominant** (V, vii°) leans hard toward home — its leading tone sits one half step under the tonic, and the 5→1 bass drop seals it.',
          },
          {
            kind: 'earCheck',
            question: 'Home, then… which job is the second chord doing?',
            demo: {
              bpm: 80,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 2 },
                { midi: 64, atBeat: 0, durBeats: 2 },
                { midi: 67, atBeat: 0, durBeats: 2 },
                { midi: 55, atBeat: 2, durBeats: 2 },
                { midi: 59, atBeat: 2, durBeats: 2 },
                { midi: 62, atBeat: 2, durBeats: 2 },
              ],
            },
            options: ['Away (IV)', 'Tension (V)'],
            correctIndex: 1,
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u3.g1',
        exercise: wait(
          'ear-progression',
          { key: C, pool: [['I', 'IV', 'I'], ['I', 'V', 'I']], count: 2 },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's3.u3.q1',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          { key: C, pool: [['I', 'IV', 'I'], ['I', 'V', 'I'], ['I', 'IV', 'V', 'I']], count: 3 },
          'rh',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's3.u4',
    stageId: 's3',
    ordinal: 3,
    title: 'The four-chord families',
    strandWeights: { keys: 3, theory: 1 },
    concepts: ['prog:i-vi-iv-v:c', 'prog:i-vi-iv-v:g', 'prog:vi-iv-i-v:c', 'prog:vi-iv-i-v:g'],
    prerequisites: ['s3.u3'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: "I–V–vi–IV, I–vi–IV–V and vi–IV–I–V aren't three progressions — they're **one loop entered at different doors**. Same four chords, rotated.",
          },
          {
            kind: 'progressionCard',
            roman: ['I', 'vi', 'IV', 'V'],
            key: { tonic: 'C', mode: 'major' },
            songRefs: [
              'Half the doo-wop era',
              'Countless prom ballads',
              'Modern pop hooks',
              'Campfire standards',
              'Wedding first-dance staples',
              'Arena singalongs',
            ],
          },
          {
            kind: 'progressionCard',
            roman: ['vi', 'IV', 'I', 'V'],
            key: { tonic: 'C', mode: 'major' },
            songRefs: ['Melancholy radio pop', 'Singer-songwriter anthems', 'Epic film-trailer cues'],
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u4.g1',
        exercise: wait('progression-play', { key: C, roman: ['I', 'vi', 'IV', 'V'], loops: 1 }),
      },
      {
        kind: 'graded',
        id: 's3.u4.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['vi', 'IV', 'I', 'V'], beatsPerChord: 4, loops: 2 },
          70,
        ),
      },
      {
        kind: 'graded',
        id: 's3.u4.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: G, roman: ['I', 'vi', 'IV', 'V'], beatsPerChord: 4, loops: 2 },
          70,
        ),
      },
      {
        kind: 'create',
        id: 's3.u4.c1',
        prompt: 'Pick a door: start the four-chord loop on vi, then on IV. Which entrance feels saddest? Loop your favorite.',
      },
    ],
  },
  {
    id: 's3.u5',
    stageId: 's3',
    ordinal: 4,
    title: 'ii and iii, the connectors',
    strandWeights: { keys: 2, theory: 2 },
    concepts: ['chord:d:min:inv0', 'prog:i-ii-v:c', 'theory:ii-v'],
    prerequisites: ['s3.u4'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: '**ii** is the professional way into V — the **ii→V** move powers everything from pop pre-choruses to jazz. **iii** is color: home, but leaning somewhere.',
          },
          {
            kind: 'text',
            md: 'In C: ii is **D minor**, iii is **E minor**. Feel how ii→V→I lands harder than IV→V→I.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u5.g1',
        exercise: wait('progression-play', { key: C, roman: ['I', 'ii', 'V', 'I'], loops: 1 }),
      },
      {
        kind: 'graded',
        id: 's3.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'ii', 'V', 'I'], beatsPerChord: 4, loops: 2 },
          70,
        ),
      },
    ],
  },
  {
    id: 's3.u6',
    stageId: 's3',
    ordinal: 5,
    title: 'Harmonize a melody',
    strandWeights: { create: 2, theory: 2 },
    concepts: ['create:harmonize:1'],
    prerequisites: ['s3.u5'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: "A melody note fits any chord that **contains it** — and often a chord doing the **same job** works too. That means most melodies have *several* right harmonies. You're choosing, not solving.",
          },
          {
            kind: 'text',
            md: "You'll hear a melody note and see its degree. Answer with any chord that fits. Trust your ear on ties.",
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u6.g1',
        exercise: wait('progression-play', {
          key: C,
          roman: ['I', 'IV', 'V', 'I'],
          acceptAlternatives: true,
        }),
      },
      {
        kind: 'graded',
        id: 's3.u6.q1',
        passScore: 0.8,
        exercise: wait('progression-play', {
          key: C,
          roman: ['I', 'IV', 'V', 'I', 'vi', 'IV', 'V', 'I'],
          acceptAlternatives: true,
        }),
      },
      {
        kind: 'create',
        id: 's3.u6.c1',
        prompt:
          'Hum any three long notes and harmonize each one two different ways. Same melody, different story — that gap is where arranging lives.',
      },
    ],
  },
  {
    id: 's3.u7',
    stageId: 's3',
    ordinal: 6,
    title: 'Ear: name the progression',
    strandWeights: { ear: 3 },
    concepts: ['ear:prog:pop4'],
    prerequisites: ['s3.u6'],
    minutes: 8,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: "Four chords play. Answer them back in order — the whole chord, or just its bass note. Hunt the **bass motion** first; it gives most of the answer away.",
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u7.g1',
        exercise: wait(
          'ear-progression',
          { key: C, pool: [['I', 'IV', 'V', 'I'], ['I', 'V', 'vi', 'IV']], count: 2 },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's3.u7.q1',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['I', 'IV', 'V', 'I'],
              ['I', 'V', 'vi', 'IV'],
              ['I', 'vi', 'IV', 'V'],
              ['vi', 'IV', 'I', 'V'],
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
    id: 's3.u8',
    stageId: 's3',
    ordinal: 7,
    title: 'Song lab',
    strandWeights: { keys: 3, create: 1 },
    concepts: ['song:northline', 'song:paper-sun'],
    prerequisites: ['s3.u7'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u8.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Two new charts. **Northline** climbs through iii — your new color chord — in G. **Paper Sun** rides the ii→V turnaround in F. Read the romans, not the letters.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's3.u8.q1',
        passScore: 0.8,
        exercise: tempo('chart-play', { songId: 'northline' }, 66, 'both', 'lead-sheet'),
      },
      {
        kind: 'graded',
        id: 's3.u8.q2',
        passScore: 0.8,
        exercise: tempo('chart-play', { songId: 'paper-sun' }, 84, 'both', 'lead-sheet'),
      },
      {
        kind: 'create',
        id: 's3.u8.c1',
        prompt:
          "Transpose Paper Sun's loop to C in your head: I–vi–ii–V becomes C, Am, Dm, G. Play a chorus from the romans alone.",
      },
    ],
  },
  {
    id: 's3.cp',
    stageId: 's3',
    ordinal: 8,
    title: 'Checkpoint: Roman lens',
    strandWeights: { theory: 2, keys: 2, ear: 1 },
    concepts: [],
    prerequisites: ['s3.u8'],
    minutes: 10,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's3.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The lens test: numerals in four keys, functions by ear, a harmonization, and a progression on demand.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's3.cp.q1',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'roman',
          keys: [...FOUR_KEYS],
          romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
          count: 10,
        }),
      },
      {
        kind: 'graded',
        id: 's3.cp.q2',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          { key: C, pool: [['I', 'IV', 'I'], ['I', 'V', 'I'], ['I', 'IV', 'V', 'I']], count: 3 },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's3.cp.q3',
        passScore: 0.8,
        exercise: wait('progression-play', {
          key: C,
          roman: ['I', 'IV', 'V', 'I', 'vi', 'IV', 'V', 'I'],
          acceptAlternatives: true,
        }),
      },
      {
        kind: 'graded',
        id: 's3.cp.q4',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: G, roman: ['vi', 'IV', 'I', 'V'], beatsPerChord: 4, loops: 2 },
          70,
        ),
      },
    ],
  },
];
