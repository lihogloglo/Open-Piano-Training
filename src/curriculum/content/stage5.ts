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
const F = { tonic: 'F', mode: 'major' } as const;
const Am = { tonic: 'A', mode: 'minor' } as const;

const ALL_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

export const stage5: Stage = {
  id: 's5',
  ordinal: 5,
  title: 'The whole map',
  tagline: 'Sevenths, minor, all 12 keys',
  summary:
    'Everything so far has lived in a few friendly keys with three-note chords. Now the map opens: a fourth note turns triads into colours, minor gets its own gravity, and the twelve keys stop being twelve separate problems.',
  unitIds: ['s5.u1', 's5.u2', 's5.u3', 's5.u4', 's5.u5', 's5.u6', 's5.u7', 's5.u8', 's5.u9', 's5.cp'],
};

export const stage5Units: Unit[] = [
  {
    id: 's5.u1',
    stageId: 's5',
    ordinal: 0,
    title: 'Four notes: maj7 & 7',
    strandWeights: { theory: 3, ear: 2 },
    concepts: ['spell:maj7', 'spell:7', 'ear:quality:maj7', 'ear:quality:7'],
    prerequisites: ['s4.cp'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Keep stacking thirds. A triad is 1-3-5; add one more third on top and you get a **seventh chord** — 1-3-5-7. Two of them run most of the music you know.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'C, then Cmaj7 (add B), then C7 (add B♭). Same base, two different moods.',
            demo: {
              bpm: 56,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 0, durBeats: 1 },
                { midi: 67, atBeat: 0, durBeats: 1 },
                { midi: 60, atBeat: 1.5, durBeats: 1 },
                { midi: 64, atBeat: 1.5, durBeats: 1 },
                { midi: 67, atBeat: 1.5, durBeats: 1 },
                { midi: 71, atBeat: 1.5, durBeats: 1 },
                { midi: 60, atBeat: 3, durBeats: 1.5 },
                { midi: 64, atBeat: 3, durBeats: 1.5 },
                { midi: 67, atBeat: 3, durBeats: 1.5 },
                { midi: 70, atBeat: 3, durBeats: 1.5 },
              ],
            },
          },
          {
            kind: 'text',
            md: '**maj7** (7th a half step under the octave) is the dreamy one — it sits still. **7**, the *dominant*, drops that 7th a half step and creates a tritone against the 3rd. That interval is unstable on purpose: it *pulls*, and where it pulls is home.',
          },
          {
            kind: 'earCheck',
            question: 'Which one wants to go somewhere?',
            demo: {
              bpm: 60,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 2 },
                { midi: 64, atBeat: 0, durBeats: 2 },
                { midi: 67, atBeat: 0, durBeats: 2 },
                { midi: 70, atBeat: 0, durBeats: 2 },
              ],
            },
            options: ['This one rests', 'This one pulls'],
            correctIndex: 1,
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u1.g1',
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'F', 'G'],
          qualities: ['maj7', '7'],
          count: 6,
        }),
      },
      {
        kind: 'graded',
        id: 's5.u1.q1',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
          qualities: ['maj7', '7'],
          count: 10,
        }),
      },
      {
        kind: 'graded',
        id: 's5.u1.q2',
        passScore: 0.75,
        exercise: wait(
          'ear-quality',
          { qualityPool: ['maj7', '7'], roots: ['C', 'F', 'G'], count: 6 },
          'rh',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's5.u2',
    stageId: 's5',
    ordinal: 1,
    title: 'm7 and the ii-V-I cell',
    strandWeights: { theory: 2, keys: 3, ear: 1 },
    concepts: ['spell:m7', 'prog:ii-v-i:c', 'prog:ii-v-i:g', 'prog:ii-v-i:f', 'ear:quality:m7'],
    prerequisites: ['s5.u1'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The third seventh chord: **m7** — a minor triad with a minor 7th on top. Soft, open, completely at home in the middle of a phrase.',
          },
          {
            kind: 'text',
            md: 'Now put all three together. **ii-V-I** is the most-used three chords in music after I-IV-V: Dm7 wants G7, G7 wants Cmaj7. Learn this cell and you have learned the engine of a thousand standards.',
          },
          {
            kind: 'progressionCard',
            roman: ['ii7', 'V7', 'Imaj7'],
            key: C,
            songRefs: ['Jazz standards, bossa nova, most film ballads'],
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u2.g1',
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['D', 'A', 'E', 'G'],
          qualities: ['m7'],
          count: 6,
        }),
      },
      {
        kind: 'ladder',
        id: 's5.u2.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['ii7', 'V7', 'Imaj7'], beatsPerChord: 4, loops: 2 },
          66,
        ),
      },
      {
        kind: 'graded',
        id: 's5.u2.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: G, roman: ['ii7', 'V7', 'Imaj7'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          66,
        ),
      },
      {
        kind: 'graded',
        id: 's5.u2.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: F, roman: ['ii7', 'V7', 'Imaj7'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          66,
        ),
      },
    ],
  },
  {
    id: 's5.u3',
    stageId: 's5',
    ordinal: 2,
    title: 'The dark ones: m7♭5 & dim7',
    strandWeights: { theory: 3 },
    concepts: ['spell:m7b5', 'spell:dim7'],
    prerequisites: ['s5.u2'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Two more sevenths, both built on a diminished triad. **m7♭5** (also written ø) is the seventh chord on the 7th degree of a major key — it is the vii of the family, and it leans hard on V.',
          },
          {
            kind: 'text',
            md: '**dim7** stacks minor thirds all the way up: every note is 3 semitones from the next. It has no home key of its own, which is exactly why it can slide anywhere — the great connective tissue chord.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'Bm7♭5, then Bdim7. Listen for the last note dropping a half step.',
            demo: {
              bpm: 56,
              loop: false,
              events: [
                { midi: 59, atBeat: 0, durBeats: 1.5 },
                { midi: 62, atBeat: 0, durBeats: 1.5 },
                { midi: 65, atBeat: 0, durBeats: 1.5 },
                { midi: 69, atBeat: 0, durBeats: 1.5 },
                { midi: 59, atBeat: 2, durBeats: 2 },
                { midi: 62, atBeat: 2, durBeats: 2 },
                { midi: 65, atBeat: 2, durBeats: 2 },
                { midi: 68, atBeat: 2, durBeats: 2 },
              ],
            },
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u3.g1',
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['B', 'E', 'A', 'D'],
          qualities: ['m7b5'],
          count: 5,
        }),
      },
      {
        kind: 'graded',
        id: 's5.u3.q1',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
          qualities: ['m7b5', 'dim7'],
          count: 10,
        }),
      },
    ],
  },
  {
    id: 's5.u4',
    stageId: 's5',
    ordinal: 3,
    title: 'Relative minor',
    strandWeights: { theory: 2, keys: 3 },
    concepts: ['scale:a:natminor:rh', 'scale:a:natminor:lh', 'scale:a:harmminor:rh', 'theory:relative'],
    prerequisites: ['s5.u3'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: "A minor is C major's **relative minor** — the exact same white keys, started from a different note. Nothing changes under your hands; what changes is which note feels like home.",
          },
          {
            kind: 'keyboardDemo',
            caption: 'C major up, then the same notes from A. Same keys, different gravity.',
            demo: {
              bpm: 100,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 62, atBeat: 1, durBeats: 1 },
                { midi: 64, atBeat: 2, durBeats: 1 },
                { midi: 65, atBeat: 3, durBeats: 1 },
                { midi: 67, atBeat: 4, durBeats: 1 },
                { midi: 69, atBeat: 5, durBeats: 1 },
                { midi: 71, atBeat: 6, durBeats: 1 },
                { midi: 72, atBeat: 7, durBeats: 1 },
                { midi: 69, atBeat: 9, durBeats: 1 },
                { midi: 71, atBeat: 10, durBeats: 1 },
                { midi: 72, atBeat: 11, durBeats: 1 },
                { midi: 74, atBeat: 12, durBeats: 1 },
                { midi: 76, atBeat: 13, durBeats: 1 },
                { midi: 77, atBeat: 14, durBeats: 1 },
                { midi: 79, atBeat: 15, durBeats: 1 },
                { midi: 81, atBeat: 16, durBeats: 1 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'The rule: **relative minor is three half steps down from the major tonic** (C → A). One catch — natural minor has no leading tone, so its v chord is limp. Raise the 7th (G → G♯) and you get **harmonic minor**, which hands minor keys a real dominant: E7 → Am.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's5.u4.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'A', scaleType: 'natural-minor', hand: 'rh', direction: 'updown' },
          70,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u4.q1',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'A', scaleType: 'natural-minor', hand: 'lh', direction: 'up' },
          70,
          'lh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u4.q2',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'A', scaleType: 'harmonic-minor', hand: 'rh', direction: 'up' },
          66,
          'rh',
          'keys-lit',
        ),
      },
    ],
  },
  {
    id: 's5.u5',
    stageId: 's5',
    ordinal: 4,
    title: 'Minor progressions',
    strandWeights: { keys: 3, create: 1 },
    concepts: ['prog:i-vi-iii-vii:am', 'prog:i-iv-v:am', 'song:ember'],
    prerequisites: ['s5.u4'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Minor keys have their own four-chord loop: **i-VI-III-VII**. The capitals are not a typo — in a minor key those degrees really are major chords, and that mix of dark root and bright neighbours is the whole sound.',
          },
          {
            kind: 'progressionCard',
            roman: ['i', 'VI', 'III', 'VII'],
            key: Am,
            songRefs: ['Minor-key folk, film cues, half of modern pop in a sad mood'],
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's5.u5.l1',
        tempos: [0.75, 1],
        exercise: tempo(
          'progression-play',
          { key: Am, roman: ['i', 'VI', 'III', 'VII'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'graded',
        id: 's5.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: Am, roman: ['i', 'iv', 'v'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'graded',
        id: 's5.u5.q2',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'ember', style: 'brokenLH', voiceLead: 'smooth' },
          76,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'create',
        id: 's5.u5.c1',
        prompt:
          'Loop i-VI-III-VII in A minor and find a melody in the right hand that only uses the white keys. Let one note hang over a chord change — that tension is the point.',
      },
    ],
  },
  {
    id: 's5.u6',
    stageId: 's5',
    ordinal: 5,
    title: 'Around the circle: sharps',
    strandWeights: { keys: 3, theory: 2 },
    concepts: [
      'scale:a:major:rh',
      'scale:e:major:rh',
      'scale:b:major:rh',
      // C anchors the circle at 12 o'clock — the one signature with nothing in it.
      'keysig:c:major',
      'keysig:a:major',
      'keysig:e:major',
      'keysig:b:major',
    ],
    prerequisites: ['s5.u5'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'You already know C, G, D and F. Keep walking up in fifths and each new key adds exactly one sharp: **A** (3), **E** (4), **B** (5). The order the sharps arrive never changes — F♯ C♯ G♯ D♯ A♯.',
          },
          {
            kind: 'circleOfFifths',
            highlight: ['C', 'G', 'D', 'A', 'E', 'B'],
          },
          {
            kind: 'text',
            md: 'Here is the part nobody tells beginners: A, E and B are **easier** under the hand than C, not harder. The black keys give your long fingers somewhere to sit. Same fingering as C major, better ergonomics.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's5.u6.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'A', scaleType: 'major', hand: 'rh', direction: 'updown' },
          70,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u6.q1',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'E', scaleType: 'major', hand: 'rh', direction: 'up' },
          70,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u6.q2',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'B', scaleType: 'major', hand: 'rh', direction: 'up' },
          66,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u6.q3',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'roman',
          keys: [
            { tonic: 'A', mode: 'major' },
            { tonic: 'E', mode: 'major' },
            { tonic: 'B', mode: 'major' },
          ],
          romans: ['I', 'IV', 'V', 'vi'],
          count: 9,
        }),
      },
    ],
  },
  {
    id: 's5.u7',
    stageId: 's5',
    ordinal: 6,
    title: 'Around the circle: flats',
    strandWeights: { keys: 3, theory: 2 },
    concepts: [
      'scale:bb:major:rh',
      'scale:eb:major:rh',
      'scale:ab:major:rh',
      'keysig:bb:major',
      'keysig:eb:major',
      'keysig:ab:major',
    ],
    prerequisites: ['s5.u6'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Now walk the other way — down in fifths from C — and each key adds a flat: **B♭** (2), **E♭** (3), **A♭** (4). The flats arrive in their own fixed order: B♭ E♭ A♭ D♭ G♭.',
          },
          {
            kind: 'circleOfFifths',
            highlight: ['C', 'F', 'Bb', 'Eb', 'Ab'],
          },
          {
            kind: 'text',
            md: 'These are the horn keys — brass and reeds live here, so most jazz and soul charts do too. The fingering family is different from C: your thumb learns to avoid the black keys, which is why B♭ starts on finger 4.',
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's5.u7.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'Bb', scaleType: 'major', hand: 'rh', direction: 'updown' },
          66,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u7.q1',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'Eb', scaleType: 'major', hand: 'rh', direction: 'up' },
          66,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u7.q2',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'Ab', scaleType: 'major', hand: 'rh', direction: 'up' },
          66,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u7.q3',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'roman',
          keys: [
            { tonic: 'Bb', mode: 'major' },
            { tonic: 'Eb', mode: 'major' },
            { tonic: 'Ab', mode: 'major' },
          ],
          romans: ['I', 'IV', 'V', 'vi'],
          count: 9,
        }),
      },
    ],
  },
  {
    id: 's5.u8',
    stageId: 's5',
    ordinal: 7,
    title: 'The far side',
    strandWeights: { keys: 2, theory: 3 },
    concepts: ['scale:db:major:rh', 'scale:gb:major:rh', 'keysig:db:major', 'keysig:gb:major'],
    prerequisites: ['s5.u7'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u8.e1',
        blocks: [
          {
            kind: 'text',
            md: 'At the bottom of the circle the two directions meet. **D♭ major and C♯ major are the same five black keys and two white keys** — the same sound, spelled two different ways. Same for G♭ and F♯.',
          },
          {
            kind: 'text',
            md: "Which spelling a chart uses is a scribe's choice, not a musical one: D♭ needs 5 flats, C♯ needs 7 sharps, so most writers pick D♭. Your hands do not care. **Enharmonic** is the word for two names, one sound.",
          },
          {
            kind: 'circleOfFifths',
            highlight: ['Db', 'Gb', 'B'],
          },
          {
            kind: 'text',
            md: "Good news: D♭ is many pianists' favourite key. Five black keys under the long fingers, thumbs on the two whites — it almost plays itself.",
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's5.u8.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'Db', scaleType: 'major', hand: 'rh', direction: 'updown' },
          66,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u8.q1',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'Gb', scaleType: 'major', hand: 'rh', direction: 'up' },
          60,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u8.q2',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'roman',
          keys: [
            { tonic: 'Db', mode: 'major' },
            { tonic: 'Gb', mode: 'major' },
          ],
          romans: ['I', 'IV', 'V'],
          count: 6,
        }),
      },
    ],
  },
  {
    id: 's5.u9',
    stageId: 's5',
    ordinal: 8,
    title: 'ii-V-I everywhere',
    strandWeights: { keys: 3, ear: 2 },
    concepts: ['prog:ii-v-i:all', 'ear:prog:iivi', 'song:round-the-circle'],
    prerequisites: ['s5.u8'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u9.e1',
        blocks: [
          {
            kind: 'text',
            md: 'This is the unit that turns twelve keys into one skill. **ii-V-I is a shape, not a set of notes.** Once your hand knows the shape, moving it to a new key is a transposition, not a new lesson.',
          },
          {
            kind: 'text',
            md: 'Round the Circle walks the cell down in fourths — C, F, B♭, E♭. Four keys, one gesture, repeated until it stops feeling like four things.',
          },
          {
            kind: 'earCheck',
            question: 'ii-V-I, or IV-V-I?',
            demo: {
              bpm: 66,
              loop: false,
              events: [
                { midi: 62, atBeat: 0, durBeats: 1 },
                { midi: 65, atBeat: 0, durBeats: 1 },
                { midi: 69, atBeat: 0, durBeats: 1 },
                { midi: 72, atBeat: 0, durBeats: 1 },
                { midi: 55, atBeat: 1, durBeats: 1 },
                { midi: 59, atBeat: 1, durBeats: 1 },
                { midi: 62, atBeat: 1, durBeats: 1 },
                { midi: 65, atBeat: 1, durBeats: 1 },
                { midi: 60, atBeat: 2, durBeats: 2 },
                { midi: 64, atBeat: 2, durBeats: 2 },
                { midi: 67, atBeat: 2, durBeats: 2 },
                { midi: 71, atBeat: 2, durBeats: 2 },
              ],
            },
            options: ['ii-V-I', 'IV-V-I'],
            correctIndex: 0,
          },
        ],
      },
      {
        kind: 'ladder',
        id: 's5.u9.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'round-the-circle', voiceLead: 'smooth' },
          66,
          'rh',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u9.q1',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'round-the-circle', voiceLead: 'smooth' },
          66,
          'rh',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u9.q2',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['ii7', 'V7', 'Imaj7'],
              ['IV', 'V', 'I'],
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
    id: 's5.cp',
    stageId: 's5',
    ordinal: 9,
    title: 'Checkpoint: The whole map',
    strandWeights: { keys: 3, theory: 2, ear: 1 },
    concepts: [],
    prerequisites: ['s5.u9'],
    minutes: 12,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's5.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The whole-map test: a scale in a key you did not choose, sevenths spelled on sight, ii-V-I away from C, a minor progression played for real, and sevenths by ear.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's5.cp.q1',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'Eb', scaleType: 'major', hand: 'rh', direction: 'updown' },
          66,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.cp.q2',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ALL_KEYS,
          qualities: ['maj7', '7', 'm7', 'm7b5'],
          count: 10,
        }),
      },
      {
        kind: 'graded',
        id: 's5.cp.q3',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: F, roman: ['ii7', 'V7', 'Imaj7'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          66,
        ),
      },
      {
        kind: 'graded',
        id: 's5.cp.q4',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: Am, roman: ['i', 'VI', 'III', 'VII'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'graded',
        id: 's5.cp.q5',
        passScore: 0.85,
        exercise: wait(
          'ear-quality',
          { qualityPool: ['maj7', '7', 'm7'], roots: ['C', 'F', 'G'], count: 6 },
          'rh',
          'by-ear',
        ),
      },
    ],
  },
];
