import { tr } from '@/i18n';
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

/** Free play over a backing loop — the Make strand, with something behind it. */
const play = (params: Record<string, unknown>, hand: Hand = 'both', bpm = 76): ExerciseDef => ({
  generator: 'improv',
  params: { bpm, ...params },
  mode: 'wait',
  bpm,
  rung: 'chord-symbols',
  hand,
  seedPolicy: 'random',
});

const C = { tonic: 'C', mode: 'major' } as const;
const G = { tonic: 'G', mode: 'major' } as const;
const F = { tonic: 'F', mode: 'major' } as const;
const Am = { tonic: 'A', mode: 'minor' } as const;

const ALL_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

export const stage5: Stage = {
  id: 's5',
  ordinal: 5,
  title: tr('The whole map'),
  tagline: tr('Sevenths, minor, all 12 keys'),
  summary: tr(
    'Everything so far has lived in a few friendly keys with three-note chords. Now the map opens: a fourth note turns triads into colours, minor gets its own gravity, and the twelve keys stop being twelve separate problems.',
  ),
  unitIds: ['s5.u1', 's5.u2', 's5.u3', 's5.u4', 's5.u5', 's5.u6', 's5.u7', 's5.u8', 's5.u9', 's5.cp'],
};

export const stage5Units: Unit[] = [
  {
    id: 's5.u1',
    stageId: 's5',
    ordinal: 0,
    title: tr('Four notes: maj7 & 7'),
    strandWeights: { theory: 3, ear: 2 },
    concepts: ['spell:maj7', 'spell:7', 'ear:quality:maj7', 'ear:quality:7'],
    prerequisites: ['s4.cp'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Keep stacking thirds. A triad is 1-3-5; add one more third on top and you get a **seventh chord** — 1-3-5-7. Two of them run most of the music you know.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('C, then Cmaj7 (add B), then C7 (add B♭). Same base, two different moods.'),
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
            md: tr(
              '**maj7** (7th a half step under the octave) is the dreamy one — it sits still. **7**, the *dominant*, drops that 7th a half step. That leaves a **tritone** between it and the 3rd — three whole steps, exactly half an octave. It is the most unstable gap in music, and it is there on purpose: it *pulls*, and where it pulls is home.',
            ),
          },
          {
            kind: 'earCheck',
            question: tr('Which one wants to go somewhere?'),
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
            options: [tr('This one rests'), tr('This one pulls')],
            correctIndex: 1,
          },
          {
            kind: 'playCheck',
            ask: tr('Build **Cmaj7**: the triad, plus one more third on top.'),
            notes: ['C', 'E', 'G', 'B'],
            count: 4,
            distinct: 'name',
            hint: tr(
              'C–E–G, then B. The 7th sits a half step under the octave, which is why it glows rather than pushes.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Now make it a **C7**: play the note that replaces the B.'),
            notes: ['Bb'],
            count: 1,
            distinct: 'octave',
            hint: tr('Drop the 7th a half step. One black key, and the chord stops resting.'),
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
        kind: 'ladder',
        id: 's5.u1.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'flashcard',
          { kind: 'spell', roots: ['C', 'D', 'F', 'G', 'A'], qualities: ['maj7', '7'], count: 8 },
          50,
        ),
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
      {
        kind: 'create',
        id: 's5.u1.c1',
        prompt: tr(
          'The backing rocks between Imaj7 and V7 — rest and pull, over and over. Play anything you like on top, then try landing on the 7th of each chord as it turns over. One note, and you can hear which of the two you are sitting in.',
        ),
        exercise: play({ key: C, palette: 'chordtones', roman: ['Imaj7', 'V7'], loops: 3, bpm: 72 }),
      },
    ],
  },
  {
    id: 's5.u2',
    stageId: 's5',
    ordinal: 1,
    title: tr('m7 and the ii-V-I cell'),
    strandWeights: { theory: 2, keys: 3, ear: 1 },
    concepts: ['spell:m7', 'prog:ii-v-i:c', 'prog:ii-v-i:g', 'prog:ii-v-i:f', 'ear:quality:m7'],
    prerequisites: ['s5.u1'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'The third seventh chord: **m7** — a minor triad with a minor 7th on top. Soft, open, completely at home in the middle of a phrase.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'Now put all three together. **ii-V-I** is the most-used three chords in music after I-IV-V: Dm7 wants G7, G7 wants Cmaj7. Learn this cell and you have learned the engine of a thousand standards.',
            ),
          },
          {
            kind: 'progressionCard',
            roman: ['ii7', 'V7', 'Imaj7'],
            key: C,
            songRefs: [tr('Jazz standards, bossa nova, most film ballads')],
          },
          {
            kind: 'playCheck',
            ask: tr('Play **Dm7** — the ii of C major.'),
            notes: ['D', 'F', 'A', 'C'],
            count: 4,
            distinct: 'name',
            hint: tr('D minor with a C on top. Four notes, and every one of them is a white key.'),
          },
          {
            kind: 'playCheck',
            ask: tr('Now the three roots of the cell, left hand: **D, G, C**.'),
            notes: ['D', 'G', 'C'],
            count: 3,
            distinct: 'name',
            hint: tr(
              'Down a fourth, then down a fifth. That bass line says the cell more than the chords do.',
            ),
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
        kind: 'guided',
        id: 's5.u2.g2',
        exercise: wait(
          'progression-play',
          { key: C, roman: ['ii7', 'V7', 'Imaj7'], loops: 1, style: 'rootchord', voiceLead: 'smooth' },
          'both',
        ),
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
      {
        kind: 'create',
        id: 's5.u2.c1',
        prompt: tr(
          'ii–V–I under your hands, round and round. Try playing only the 3rds and 7ths of each chord — two notes — and hear how little it takes to say the whole progression. That discovery is what Stage 6 is built on.',
        ),
        exercise: play({ key: C, palette: 'chordtones', roman: ['ii7', 'V7', 'Imaj7'], loops: 3, bpm: 72 }),
      },
    ],
  },
  {
    id: 's5.u3',
    stageId: 's5',
    ordinal: 2,
    title: tr('The dark ones: m7♭5 & dim7'),
    strandWeights: { theory: 3 },
    concepts: ['spell:m7b5', 'spell:dim7'],
    prerequisites: ['s5.u2'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Two more sevenths, both built on a diminished triad. **m7♭5** (also written ø) sits on the 7th degree of a major key, where it is dominant-function and leans hard on **I**. Its day job is elsewhere: in a *minor* key it is the **iiø7**, the chord that opens a minor ii–V–i.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              '**dim7** stacks minor thirds all the way up: every note is 3 semitones from the next. It has no home key of its own, which is exactly why it can slide anywhere — the great connective tissue chord.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('Bm7♭5, then Bdim7. Listen for the last note dropping a half step.'),
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
          {
            kind: 'playCheck',
            ask: tr('Play **Bm7♭5**: B, D, F, A.'),
            notes: ['B', 'D', 'F', 'A'],
            count: 4,
            distinct: 'name',
            hint: tr('The diminished triad B–D–F, with a plain minor 7th on top. All white keys.'),
          },
          {
            kind: 'playCheck',
            ask: tr('Make it **Bdim7**: play the note that replaces the A.'),
            notes: ['Ab'],
            count: 1,
            distinct: 'octave',
            hint: tr(
              'Drop the 7th a half step so every gap is three semitones. Now it is perfectly symmetrical — and homeless.',
            ),
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
        kind: 'ladder',
        id: 's5.u3.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'flashcard',
          { kind: 'spell', roots: ['B', 'E', 'A', 'D', 'G'], qualities: ['m7b5', 'dim7'], count: 8 },
          46,
        ),
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
      {
        kind: 'create',
        id: 's5.u3.c1',
        prompt: tr(
          'A minor loop is playing. Between any two of its chords, slide a dim7 in — any root, one beat. It will fit, because a chord with no home cannot be in the wrong place. Find the two or three spots where it sounds deliberate rather than lucky.',
        ),
        exercise: play({
          key: Am,
          palette: 'chordtones',
          roman: ['i', 'VI', 'III', 'VII'],
          loops: 3,
          bpm: 70,
        }),
      },
    ],
  },
  {
    id: 's5.u4',
    stageId: 's5',
    ordinal: 3,
    title: tr('Relative minor'),
    strandWeights: { theory: 2, keys: 3 },
    concepts: ['scale:a:natminor:rh', 'scale:a:natminor:lh', 'scale:a:harmminor:rh', 'theory:relative'],
    prerequisites: ['s5.u3'],
    minutes: 16,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              "A minor is C major's **relative minor** — the exact same white keys, started from a different note. Nothing changes under your hands; what changes is which note feels like home.",
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('C major up, then the same notes from A. Same keys, different gravity.'),
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
            md: tr(
              'The rule: **relative minor is three half steps down from the major tonic** (C → A). One catch — natural minor has no leading tone, so its v chord is limp. Raise the 7th (G → G♯) and you get **harmonic minor**, which hands minor keys a real dominant: E7 → Am.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Three half steps down from C — play the home note of its relative minor.'),
            notes: ['A'],
            count: 1,
            distinct: 'octave',
            hint: tr('C, B, B♭, A. Same seven white keys as C major; different note in charge.'),
          },
          {
            kind: 'playCheck',
            ask: tr('Play the one note harmonic minor changes: the raised 7th of A minor.'),
            notes: ['G#'],
            count: 1,
            distinct: 'octave',
            hint: tr(
              'G becomes G♯, a half step under A. That is the leading tone minor keys borrow to get a real V.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u4.g1',
        exercise: wait(
          'scale-run',
          { tonic: 'A', scaleType: 'natural-minor', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'guided',
        id: 's5.u4.g2',
        exercise: wait(
          'scale-run',
          { tonic: 'A', scaleType: 'harmonic-minor', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        // The unit claims `scale:a:natminor:lh` and used to grade it without
        // the hand ever playing it. Left hand alone, then ramped.
        kind: 'guided',
        id: 's5.u4.g3',
        exercise: wait(
          'scale-run',
          { tonic: 'A', scaleType: 'natural-minor', hand: 'lh', direction: 'up' },
          'lh',
          'keys-lit',
        ),
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
        kind: 'ladder',
        id: 's5.u4.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'A', scaleType: 'natural-minor', hand: 'lh', direction: 'updown' },
          70,
          'lh',
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
        // Wait mode, not tempo. Harmonic minor is one raised note and a wider
        // reach between 6 and 7; the lesson is about finding it, not speed. It
        // gets no tempo ramp of its own, so it is not scored against a clock.
        kind: 'graded',
        id: 's5.u4.q2',
        passScore: 0.8,
        exercise: wait(
          'scale-run',
          { tonic: 'A', scaleType: 'harmonic-minor', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'create',
        id: 's5.u4.c1',
        prompt: tr(
          'Play over the A minor backing using only white keys — then, on the bar before the loop turns over, raise the G to G♯ and hold it. You have just borrowed harmonic minor for one beat, which is exactly how real music uses it.',
        ),
        exercise: play({ key: Am, palette: 'chordtones', roman: ['i', 'iv', 'V7', 'i'], loops: 3, bpm: 70 }),
      },
    ],
  },
  {
    id: 's5.u5',
    stageId: 's5',
    ordinal: 4,
    title: tr('Minor progressions'),
    strandWeights: { keys: 3, create: 1 },
    concepts: ['prog:i-vi-iii-vii:am', 'prog:i-iv-v:am', 'song:ember'],
    prerequisites: ['s5.u4'],
    minutes: 18,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Minor keys have their own four-chord loop: **i-VI-III-VII**. The capitals are not a typo — in a minor key those degrees really are major chords, and that mix of dark root and bright neighbours is the whole sound.',
            ),
          },
          {
            kind: 'progressionCard',
            roman: ['i', 'VI', 'III', 'VII'],
            key: Am,
            songRefs: [tr('Minor-key folk, film cues, half of modern pop in a sad mood')],
          },
          {
            kind: 'playCheck',
            ask: tr('Play the **VI** of A minor: F, A, C.'),
            notes: ['F', 'A', 'C'],
            count: 3,
            distinct: 'name',
            hint: tr(
              'Capital numeral, major chord — and it is the same F major you have played since Stage 1.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('And the **VII**: G, B, D.'),
            notes: ['G', 'B', 'D'],
            count: 3,
            distinct: 'name',
            hint: tr(
              'A whole step under the tonic, major, and no leading tone anywhere. That flat 7th is why minor loops sound modal rather than classical.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u5.g1',
        exercise: wait(
          'progression-play',
          { key: Am, roman: ['i', 'VI', 'III', 'VII'], loops: 1, style: 'rootchord', voiceLead: 'smooth' },
          'both',
        ),
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
        kind: 'ladder',
        id: 's5.u5.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'ember', style: 'brokenLH', voiceLead: 'smooth' },
          76,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: Am, roman: ['i', 'iv', 'V'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        // Ember is the stage's first minor chart and its first broken-left-hand
        // texture since s4. A read at wait speed, then a ramp, then the take.
        kind: 'guided',
        id: 's5.u5.g2',
        exercise: wait(
          'chart-play',
          { songId: 'ember', style: 'brokenLH', voiceLead: 'smooth' },
          'both',
          'lead-sheet',
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
        prompt: tr(
          'Loop i-VI-III-VII in A minor and find a melody in the right hand that only uses the white keys. Let one note hang over a chord change — the note stays, the chord moves under it, and that friction is the point.',
        ),
        exercise: play({
          key: Am,
          palette: 'chordtones',
          roman: ['i', 'VI', 'III', 'VII'],
          loops: 3,
          bpm: 76,
        }),
      },
    ],
  },
  {
    id: 's5.u6',
    stageId: 's5',
    ordinal: 5,
    title: tr('Around the circle: sharps'),
    strandWeights: { keys: 3, theory: 2 },
    concepts: [
      'scale:a:major:rh',
      'scale:a:major:lh',
      'scale:e:major:rh',
      'scale:b:major:rh',
      // C anchors the circle at 12 o'clock — the one signature with nothing in it.
      'keysig:c:major',
      'keysig:a:major',
      'keysig:e:major',
      'keysig:b:major',
    ],
    prerequisites: ['s5.u5'],
    minutes: 17,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'You already know C, G, D and F. Keep walking up in fifths and each new key adds exactly one sharp: **A** (3), **E** (4), **B** (5). The order the sharps arrive never changes — F♯ C♯ G♯ D♯ A♯.',
            ),
          },
          {
            kind: 'circleOfFifths',
            highlight: ['C', 'G', 'D', 'A', 'E', 'B'],
          },
          {
            kind: 'text',
            md: tr(
              'Here is the part nobody tells beginners: A, E and B are **easier** under the hand than C, not harder. The black keys give your long fingers somewhere to sit. Same fingering as C major, better ergonomics.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('A major has three sharps. Play them: F♯, C♯, G♯.'),
            notes: ['F#', 'C#', 'G#'],
            count: 3,
            distinct: 'name',
            hint: tr(
              'The order never changes: F♯ first, then C♯, then G♯. Each new key keeps the previous ones.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('E major keeps those three and adds one. Play the fourth sharp.'),
            notes: ['D#'],
            count: 1,
            distinct: 'octave',
            hint: tr(
              'Next along the same chain: F♯ C♯ G♯ **D♯**. It is always the 7th degree of the new key.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u6.g1',
        exercise: wait(
          'scale-run',
          { tonic: 'A', scaleType: 'major', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'guided',
        id: 's5.u6.g2',
        exercise: wait(
          'scale-run',
          { tonic: 'A', scaleType: 'major', hand: 'lh', direction: 'up' },
          'lh',
          'keys-lit',
        ),
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
        // The left hand has not been ramped on a major scale since s1.u2, at
        // 60. This unit grades it at 66, so it ramps it here first. A, E and B
        // all take C major's left-hand fingering, so one ladder covers all
        // three keys.
        kind: 'ladder',
        id: 's5.u6.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'A', scaleType: 'major', hand: 'lh', direction: 'updown' },
          66,
          'lh',
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
      {
        kind: 'graded',
        id: 's5.u6.q4',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'A', scaleType: 'major', hand: 'lh', direction: 'up' },
          66,
          'lh',
          'keys-lit',
        ),
      },
      {
        kind: 'create',
        id: 's5.u6.c1',
        prompt: tr(
          'Improvise in E major — four sharps, and your hand will want to sit on the black keys rather than reach for them. Notice that it is more comfortable than C, not less. That is the ergonomic secret of the sharp keys.',
        ),
        exercise: play({
          key: { tonic: 'E', mode: 'major' },
          palette: 'chordtones',
          roman: ['I', 'V', 'vi', 'IV'],
          loops: 3,
        }),
      },
    ],
  },
  {
    id: 's5.u7',
    stageId: 's5',
    ordinal: 6,
    title: tr('Around the circle: flats'),
    strandWeights: { keys: 3, theory: 2 },
    concepts: [
      'scale:bb:major:rh',
      'scale:bb:major:lh',
      'scale:eb:major:rh',
      'scale:ab:major:rh',
      'keysig:bb:major',
      'keysig:eb:major',
      'keysig:ab:major',
    ],
    prerequisites: ['s5.u6'],
    minutes: 19,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Now walk the other way — down in fifths from C — and each key adds a flat: **B♭** (2), **E♭** (3), **A♭** (4). The flats arrive in their own fixed order: B♭ E♭ A♭ D♭ G♭.',
            ),
          },
          {
            kind: 'circleOfFifths',
            highlight: ['C', 'F', 'Bb', 'Eb', 'Ab'],
          },
          {
            kind: 'text',
            md: tr(
              'These are the horn keys — brass and reeds live here, so most jazz and soul charts do too. The rule everywhere on this side: the thumb avoids the black keys. That is why B♭ starts on finger 4, and it is why the right hand needs a slightly different route for each flat key. Your left hand gets off lightly — one fingering covers all of them.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Play the two flats of **B♭ major**: B♭ and E♭.'),
            notes: ['Bb', 'Eb'],
            count: 2,
            distinct: 'name',
            hint: tr('Flats arrive in their own order: B♭ E♭ A♭ D♭ G♭. Two of them, and the key is B♭.'),
          },
          {
            kind: 'playCheck',
            ask: tr('A♭ major has four. Play the two that B♭ major did **not** have.'),
            notes: ['Ab', 'Db'],
            count: 2,
            distinct: 'name',
            hint: tr('Keep going down the same chain: B♭ E♭ **A♭ D♭**.'),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u7.g1',
        exercise: wait(
          'scale-run',
          { tonic: 'Bb', scaleType: 'major', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'guided',
        id: 's5.u7.g2',
        exercise: wait(
          'scale-run',
          { tonic: 'Bb', scaleType: 'major', hand: 'lh', direction: 'up' },
          'lh',
          'keys-lit',
        ),
      },
      {
        // Each flat key has its own right-hand fingering, so meeting E-flat and
        // A-flat needs a rep each. The old unit graded both at tempo having
        // only ever ramped B-flat.
        kind: 'guided',
        id: 's5.u7.g3',
        exercise: wait(
          'scale-run',
          { tonic: 'Eb', scaleType: 'major', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'guided',
        id: 's5.u7.g4',
        exercise: wait(
          'scale-run',
          { tonic: 'Ab', scaleType: 'major', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
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
        // B-flat, E-flat, A-flat and D-flat all share one left-hand fingering,
        // so this single ladder covers the whole flat side for that hand.
        kind: 'ladder',
        id: 's5.u7.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'Bb', scaleType: 'major', hand: 'lh', direction: 'updown' },
          60,
          'lh',
          'keys-lit',
        ),
      },
      {
        // Wait mode, not tempo. B-flat is the key this unit ramps; E-flat and
        // A-flat are scored on finding the notes and the fingering, and speed
        // comes later through review.
        kind: 'graded',
        id: 's5.u7.q1',
        passScore: 0.8,
        exercise: wait(
          'scale-run',
          { tonic: 'Eb', scaleType: 'major', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's5.u7.q2',
        passScore: 0.8,
        exercise: wait(
          'scale-run',
          { tonic: 'Ab', scaleType: 'major', hand: 'rh', direction: 'up' },
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
      {
        kind: 'graded',
        id: 's5.u7.q4',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'Bb', scaleType: 'major', hand: 'lh', direction: 'up' },
          60,
          'lh',
          'keys-lit',
        ),
      },
      {
        kind: 'create',
        id: 's5.u7.c1',
        prompt: tr(
          'A backing in E♭ — three flats, and the key half the soul records you love were cut in. Play chord tones over it until the geography stops feeling like a foreign country. Flat keys are only awkward while they are unfamiliar.',
        ),
        exercise: play({
          key: { tonic: 'Eb', mode: 'major' },
          palette: 'chordtones',
          roman: ['I', 'vi', 'ii', 'V'],
          loops: 3,
        }),
      },
    ],
  },
  {
    id: 's5.u8',
    stageId: 's5',
    ordinal: 7,
    title: tr('The far side'),
    strandWeights: { keys: 2, theory: 3 },
    concepts: ['scale:db:major:rh', 'scale:gb:major:rh', 'keysig:db:major', 'keysig:gb:major'],
    prerequisites: ['s5.u7'],
    minutes: 15,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u8.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'At the bottom of the circle the two directions meet. **D♭ major and C♯ major are the same five black keys and two white keys** — the same sound, spelled two different ways. Same for G♭ and F♯.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              "Which spelling a chart uses is a scribe's choice, not a musical one: D♭ needs 5 flats, C♯ needs 7 sharps, so most writers pick D♭. Your hands do not care. **Enharmonic** is the word for two names, one sound.",
            ),
          },
          {
            kind: 'circleOfFifths',
            highlight: ['Db', 'Gb', 'B'],
          },
          {
            kind: 'text',
            md: tr(
              "Good news: D♭ is many pianists' favourite key. Five black keys under the long fingers, thumbs on the two whites — it almost plays itself.",
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('D♭ major has exactly two white keys in it. Play them.'),
            notes: ['F', 'C'],
            count: 2,
            distinct: 'name',
            hint: tr('D♭ E♭ F G♭ A♭ B♭ C — the 3rd and the 7th. Those two are where your thumbs go.'),
          },
          {
            kind: 'playCheck',
            ask: tr('Play the key that is both **F♯ and G♭**.'),
            notes: ['F#'],
            count: 1,
            distinct: 'octave',
            hint: tr(
              'One key, two names. Which name a chart uses depends on the key signature it is trying to keep tidy.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u8.g1',
        exercise: wait(
          'scale-run',
          { tonic: 'Db', scaleType: 'major', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
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
        // G-flat has its own right-hand fingering, so it gets its own rep.
        kind: 'guided',
        id: 's5.u8.g2',
        exercise: wait(
          'scale-run',
          { tonic: 'Gb', scaleType: 'major', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        // Wait mode: D-flat is the key this unit ramps. G-flat is scored on
        // the notes and the fingering, not against a clock.
        kind: 'graded',
        id: 's5.u8.q1',
        passScore: 0.8,
        exercise: wait(
          'scale-run',
          { tonic: 'Gb', scaleType: 'major', hand: 'rh', direction: 'up' },
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
      {
        kind: 'create',
        id: 's5.u8.c1',
        prompt: tr(
          'Improvise in D♭ using only the black keys. Those five are D♭ major **pentatonic** — five notes, no half steps anywhere, so nothing in the set can clash. Then add the F and the C when you want the light to change. This is the key that convinces people the black keys are the easy ones.',
        ),
        exercise: play({
          key: { tonic: 'Db', mode: 'major' },
          palette: 'pentatonic',
          roman: ['I', 'IV', 'V', 'I'],
          loops: 3,
          bpm: 70,
        }),
      },
    ],
  },
  {
    id: 's5.u9',
    stageId: 's5',
    ordinal: 8,
    title: tr('ii-V-I everywhere'),
    strandWeights: { keys: 3, ear: 2 },
    concepts: ['prog:ii-v-i:all', 'ear:prog:iivi', 'song:round-the-circle'],
    prerequisites: ['s5.u8'],
    minutes: 14,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's5.u9.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'This is the unit that turns twelve keys into one skill. **ii-V-I keeps the same chord roles in every key.** The notes and finger positions change. Find ii, V and I in the new key, then practice the changes slowly.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'Round the Circle walks the cell down in fourths — C, F, B♭, E♭. Four keys, one gesture, repeated until it stops feeling like four things.',
            ),
          },
          {
            kind: 'earCheck',
            question: tr('ii-V-I, or IV-V-I?'),
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
            options: [tr('ii-V-I'), tr('IV-V-I')],
            correctIndex: 0,
          },
          {
            kind: 'playCheck',
            ask: tr('Left hand: the three roots of a ii–V–I in **B♭** — C, F, B♭.'),
            notes: ['C', 'F', 'Bb'],
            count: 3,
            distinct: 'name',
            hint: tr(
              'Down a fourth, down a fifth — the same shape as D, G, C was in the key of C. The gesture never changes.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's5.u9.g1',
        exercise: wait('chart-play', { songId: 'round-the-circle', voiceLead: 'smooth' }, 'rh', 'lead-sheet'),
      },
      {
        kind: 'ladder',
        // Twelve bars is a long unbroken take; at 60% of 66 BPM it runs over a
        // minute without a break, which trains endurance, not the cell. Two
        // rungs, same as the Stage 4 chart ladder.
        id: 's5.u9.l1',
        tempos: [0.75, 1],
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
      {
        kind: 'create',
        id: 's5.u9.c1',
        prompt: tr(
          'ii–V–I in F, looping. Play it with the left hand taking roots and the right hand taking whatever it likes — then move the whole thing to B♭ by ear when the loop comes round. If your hand can find it without being told the letters, this stage has done its job.',
        ),
        exercise: play({
          key: { tonic: 'F', mode: 'major' },
          palette: 'chordtones',
          roman: ['ii7', 'V7', 'Imaj7'],
          loops: 3,
          bpm: 70,
        }),
      },
    ],
  },
  {
    id: 's5.cp',
    stageId: 's5',
    ordinal: 9,
    title: tr('Checkpoint: The whole map'),
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
            md: tr(
              'The whole-map test: a scale in a key you did not choose, sevenths spelled on sight, ii-V-I away from C, a minor progression played for real, and sevenths by ear.',
            ),
          },
        ],
      },
      {
        kind: 'graded',
        id: 's5.cp.q1',
        passScore: 0.8,
        exercise: wait(
          'scale-run',
          { tonic: 'Eb', scaleType: 'major', hand: 'rh', direction: 'updown' },
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
          {
            key: F,
            roman: ['ii7', 'V7', 'Imaj7'],
            beatsPerChord: 4,
            loops: 2,
            voiceLead: 'smooth',
            style: 'rootchord',
          },
          66,
          'both',
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
