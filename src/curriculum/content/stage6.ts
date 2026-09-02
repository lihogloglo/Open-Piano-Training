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
const F = { tonic: 'F', mode: 'major' } as const;
const Bb = { tonic: 'Bb', mode: 'major' } as const;
const II_V_I = ['ii7', 'V7', 'Imaj7'];

export const stage6: Stage = {
  id: 's6',
  ordinal: 6,
  title: 'Charts for real',
  tagline: 'Comping craft',
  summary:
    'A chord chart is not sheet music — it tells you what, never how. This stage is the how: the voicings working pianists actually use, the rhythms that turn chords into a groove, and the confidence to read a chart you have never seen.',
  unitIds: ['s6.u1', 's6.u2', 's6.u3', 's6.u4', 's6.u5', 's6.u6', 's6.u7', 's6.u8', 's6.cp'],
};

export const stage6Units: Unit[] = [
  {
    id: 's6.u1',
    stageId: 's6',
    ordinal: 0,
    title: 'Reading the language',
    strandWeights: { theory: 3 },
    concepts: ['read:symbols:full'],
    prerequisites: ['s5.cp'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Time to read every symbol a chart can throw at you. The grammar is regular: **root**, then **quality**, then **extensions**, then an optional **/bass**.',
          },
          {
            kind: 'text',
            md: '`Am` minor · `A7` dominant · `Amaj7` major 7th · `Am7♭5` half-diminished · `Asus4` the 3rd replaced by the 4th · `A6` add the 6th · `Aadd9` add the 9th without a 7th · `A/C♯` A major with C♯ in the bass.\n\nThe one that trips people: **`A7` is not "A major 7"** — it is a dominant. Major 7 always says `maj7`.',
          },
          {
            kind: 'earCheck',
            question: 'Which is the dominant?',
            demo: {
              bpm: 56,
              loop: false,
              events: [
                { midi: 57, atBeat: 0, durBeats: 1.5 },
                { midi: 61, atBeat: 0, durBeats: 1.5 },
                { midi: 64, atBeat: 0, durBeats: 1.5 },
                { midi: 67, atBeat: 0, durBeats: 1.5 },
              ],
            },
            options: ['A7 (dominant)', 'Amaj7'],
            correctIndex: 0,
          },
        ],
      },
      {
        kind: 'guided',
        id: 's6.u1.g1',
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'F', 'G', 'A', 'D'],
          qualities: ['sus4', '6', 'add9'],
          count: 6,
        }),
      },
      {
        kind: 'graded',
        id: 's6.u1.q1',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb'],
          qualities: ['maj7', '7', 'm7', 'm7b5', 'sus4', '6', 'add9'],
          count: 12,
        }),
      },
    ],
  },
  {
    id: 's6.u2',
    stageId: 's6',
    ordinal: 1,
    title: 'Shells',
    strandWeights: { keys: 3 },
    concepts: ['voicing:shell17', 'voicing:shell13'],
    prerequisites: ['s6.u1'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: "You do not need all four notes. A **shell** is two: the **root** and the one note that decides the chord's identity — the **7th**, or the **3rd**. Everything else is decoration.",
          },
          {
            kind: 'keyboardDemo',
            caption:
              'Dm7 · G7 · Cmaj7 as 1-7 shells in the left hand. Two notes each, and it still says ii-V-I.',
            demo: {
              bpm: 60,
              loop: false,
              events: [
                { midi: 38, atBeat: 0, durBeats: 1 },
                { midi: 48, atBeat: 0, durBeats: 1 },
                { midi: 43, atBeat: 1, durBeats: 1 },
                { midi: 53, atBeat: 1, durBeats: 1 },
                { midi: 36, atBeat: 2, durBeats: 2 },
                { midi: 47, atBeat: 2, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'Why bother? Because two notes leave your right hand free for the melody, they never sound muddy down low, and they are fast enough to keep up with a chart at tempo.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's6.u2.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: II_V_I, beatsPerChord: 4, loops: 2, voicing: 'shell17' },
          66,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u2.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: F, roman: II_V_I, beatsPerChord: 4, loops: 2, voicing: 'shell17' },
          66,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u2.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'vi', 'IV', 'V'], beatsPerChord: 4, loops: 2, voicing: 'shell13' },
          72,
          'lh',
        ),
      },
    ],
  },
  {
    id: 's6.u3',
    stageId: 's6',
    ordinal: 2,
    title: 'Guide tones',
    strandWeights: { keys: 3, theory: 1 },
    concepts: ['voicing:guidetones'],
    prerequisites: ['s6.u2'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Here is the secret of ii-V-I. While the roots leap around, the **3rd and 7th barely move** — and when they do, they move by a half step. Those two notes are the **guide tones**, and they are what your ear is actually following.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'Dm7 → G7 → Cmaj7: watch F stay, C slide down to B. Roots in the left hand.',
            demo: {
              bpm: 60,
              loop: false,
              events: [
                { midi: 38, atBeat: 0, durBeats: 1 },
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 65, atBeat: 0, durBeats: 1 },
                { midi: 43, atBeat: 1, durBeats: 1 },
                { midi: 59, atBeat: 1, durBeats: 1 },
                { midi: 65, atBeat: 1, durBeats: 1 },
                { midi: 36, atBeat: 2, durBeats: 2 },
                { midi: 59, atBeat: 2, durBeats: 2 },
                { midi: 64, atBeat: 2, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'Two notes in the right hand, one in the left, and the harmony is complete. This is the voicing to reach for when a chart moves faster than you can build full chords.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's6.u3.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: II_V_I, beatsPerChord: 4, loops: 2, voicing: 'guidetones' },
          66,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u3.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: Bb, roman: II_V_I, beatsPerChord: 4, loops: 2, voicing: 'guidetones' },
          66,
          'both',
        ),
      },
    ],
  },
  {
    id: 's6.u4',
    stageId: 's6',
    ordinal: 3,
    title: 'Groove school: straight eighths',
    strandWeights: { keys: 3 },
    concepts: ['comp:straight8'],
    prerequisites: ['s6.u3'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Chords with no rhythm are not music yet. **Comping** is playing the harmony *in time* — bass on the strong beats, chord stabs in the gaps.',
          },
          {
            kind: 'keyboardDemo',
            caption:
              'One bar of straight eighths over C: bass on 1 and 3, stabs on 2, the "and" of 3, and 4.',
            demo: {
              bpm: 88,
              loop: true,
              events: [
                { midi: 36, atBeat: 0, durBeats: 1 },
                { midi: 60, atBeat: 1, durBeats: 0.5 },
                { midi: 64, atBeat: 1, durBeats: 0.5 },
                { midi: 67, atBeat: 1, durBeats: 0.5 },
                { midi: 36, atBeat: 2, durBeats: 1 },
                { midi: 60, atBeat: 2.5, durBeats: 0.5 },
                { midi: 64, atBeat: 2.5, durBeats: 0.5 },
                { midi: 67, atBeat: 2.5, durBeats: 0.5 },
                { midi: 60, atBeat: 3, durBeats: 1 },
                { midi: 64, atBeat: 3, durBeats: 1 },
                { midi: 67, atBeat: 3, durBeats: 1 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'Your score here is mostly **timing**. Play fewer notes and land them exactly — that is what makes a groove.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's6.u4.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 1,
            style: 'straight8',
            voicing: 'shell17',
          },
          84,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u4.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: F,
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 1,
            style: 'straight8',
            voicing: 'shell17',
          },
          84,
          'both',
        ),
      },
    ],
  },
  {
    id: 's6.u5',
    stageId: 's6',
    ordinal: 4,
    title: 'Groove school: ballad & boom-chuck',
    strandWeights: { keys: 3, create: 1 },
    concepts: ['comp:ballad', 'comp:boomchuck'],
    prerequisites: ['s6.u4'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Two more grooves for the toolkit. **Ballad**: the bass lands on 1, then the chord unfolds one note per beat — patient, and it fills a slow bar without crowding a singer.',
          },
          {
            kind: 'text',
            md: '**Boom-chuck**: bass on 1 and 3, chord on 2 and 4. It is the oldest trick in the book — ragtime, country, folk, half of everything — and it works because it puts the pulse where a foot taps.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's6.u5.l1',
        tempos: [0.75, 1],
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'vi', 'IV', 'V'],
            beatsPerChord: 4,
            loops: 1,
            style: 'ballad',
            voicing: 'shell13',
          },
          66,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'IV', 'V', 'I'],
            beatsPerChord: 4,
            loops: 1,
            style: 'boomchuck',
            voicing: 'shell13',
          },
          92,
          'both',
        ),
      },
      {
        kind: 'create',
        id: 's6.u5.c1',
        prompt:
          'Play Cassette Summer three times: once boom-chuck, once ballad, once straight eighths. Same chords, three different songs. Keep the one that fits the title.',
      },
    ],
  },
  {
    id: 's6.u6',
    stageId: 's6',
    ordinal: 5,
    title: 'Melody on top',
    strandWeights: { keys: 3 },
    concepts: ['texture:melody-lh'],
    prerequisites: ['s6.u5'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The full arrangement: **left hand carries the harmony, right hand sings the tune.** This is why shells matter — a two-note left hand leaves the right hand somewhere to go.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's6.u6.l1',
        tempos: [0.75, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'northline', style: 'ballad', voicing: 'shell17' },
          72,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u6.q1',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'slow-tide', style: 'ballad', voicing: 'shell17' },
          60,
          'both',
          'lead-sheet',
        ),
      },
    ],
  },
  {
    id: 's6.u7',
    stageId: 's6',
    ordinal: 6,
    title: 'Transpose anything',
    strandWeights: { keys: 3, theory: 2 },
    concepts: ['skill:transpose'],
    prerequisites: ['s6.u6'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: '"Can we do it a third lower?" — the question every singer asks. The answer is not to rewrite the chart. **Read it in romans, play it in the new key.**',
          },
          {
            kind: 'text',
            md: "The workflow: name the progression by degree (I-vi-ii-V), find the new key's I, and let the shapes follow. You did this in Stage 3 without knowing it was a professional skill.",
          },
          {
            kind: 'progressionCard',
            roman: ['I', 'vi', 'ii', 'V'],
            key: C,
            songRefs: ['The turnaround that ends a thousand standards'],
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's6.u7.l1',
        tempos: [0.75, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'vi', 'ii', 'V'], beatsPerChord: 4, loops: 2, voicing: 'shell17' },
          72,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u7.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: Bb, roman: ['I', 'vi', 'ii', 'V'], beatsPerChord: 4, loops: 2, voicing: 'shell17' },
          72,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u7.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: { tonic: 'Eb', mode: 'major' },
            roman: ['I', 'vi', 'ii', 'V'],
            beatsPerChord: 4,
            loops: 2,
            voicing: 'shell17',
          },
          72,
          'lh',
        ),
      },
    ],
  },
  {
    id: 's6.u8',
    stageId: 's6',
    ordinal: 7,
    title: 'The unseen chart',
    strandWeights: { keys: 3 },
    concepts: ['skill:sightcomp'],
    prerequisites: ['s6.u7'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u8.e1',
        blocks: [
          {
            kind: 'text',
            md: 'This one is generated fresh: a chart nobody has ever played, in a key chosen for you. Everything in it is familiar — the forms and the chords are ones you already know — but the exact sequence is new.',
          },
          {
            kind: 'text',
            md: 'Two passes allowed. First time through, look ahead a bar and keep the left hand simple. Do not stop to fix mistakes — **keeping time matters more than any single chord**.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's6.u8.g1',
        exercise: tempo(
          'unseen-chart',
          { form: 'verse-chorus', sevenths: false, voicing: 'shell17' },
          60,
          'lh',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's6.u8.q1',
        passScore: 0.8,
        exercise: tempo(
          'unseen-chart',
          { form: 'aaba', sevenths: true, style: 'straight8', voicing: 'shell17' },
          66,
          'both',
          'lead-sheet',
        ),
      },
    ],
  },
  {
    id: 's6.cp',
    stageId: 's6',
    ordinal: 8,
    title: 'Checkpoint: Comping',
    strandWeights: { keys: 3, theory: 1 },
    concepts: [],
    prerequisites: ['s6.u8'],
    minutes: 12,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's6.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The comping test: a chart you have never seen, the same turnaround in two keys, and shells and guide tones at tempo.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's6.cp.q1',
        passScore: 0.8,
        exercise: tempo(
          'unseen-chart',
          { form: 'aaba', sevenths: true, style: 'straight8', voicing: 'shell17' },
          66,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's6.cp.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: { tonic: 'Ab', mode: 'major' },
            roman: ['I', 'vi', 'ii', 'V'],
            beatsPerChord: 4,
            loops: 2,
            voicing: 'shell17',
          },
          72,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's6.cp.q3',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: F, roman: II_V_I, beatsPerChord: 4, loops: 2, voicing: 'guidetones' },
          66,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's6.cp.q4',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 1,
            style: 'boomchuck',
            voicing: 'shell13',
          },
          92,
          'both',
        ),
      },
    ],
  },
];
