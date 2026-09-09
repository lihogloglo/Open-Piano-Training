import { tr } from '@/i18n';
import type { Stage, Unit } from '../schema';
import type { ExerciseDef } from '@/engine/types';

type Hand = 'rh' | 'lh' | 'both';

const wait = (
  generator: string,
  params: Record<string, unknown>,
  hand: Hand = 'rh',
  rung = 'keys-lit',
): ExerciseDef => ({ generator, params, mode: 'wait', rung, hand, seedPolicy: 'random' }) as ExerciseDef;

const tempo = (
  generator: string,
  params: Record<string, unknown>,
  bpm: number,
  hand: Hand = 'rh',
  rung = 'keys-lit',
): ExerciseDef =>
  ({
    generator,
    params,
    mode: 'tempo',
    bpm,
    timingTier: 'relaxed',
    rung,
    hand,
    seedPolicy: 'random',
  }) as ExerciseDef;

/** Free play over a backing loop — the Make strand, with something behind it. */
const play = (params: Record<string, unknown>, hand: Hand = 'rh', bpm = 72): ExerciseDef => ({
  generator: 'improv',
  params: { bpm, ...params },
  mode: 'wait',
  bpm,
  rung: 'keys-lit',
  hand,
  seedPolicy: 'random',
});

const C_MAJOR = { tonic: 'C', mode: 'major' } as const;

/** Every degree of the scale lit — "the notes you are allowed" is the whole key here. */
const ALL_DEGREES = [1, 2, 3, 4, 5, 6, 7];

export const stage1: Stage = {
  id: 's1',
  ordinal: 1,
  title: tr('One key, whole system'),
  tagline: tr('C major from the inside'),
  summary: tr(
    'One key, learned deeply: the scale as a recipe, degrees as an address system, and your first four chords — enough to accompany a real song by the end.',
  ),
  unitIds: ['s1.u1', 's1.u2', 's1.u3', 's1.u4', 's1.u5', 's1.u6', 's1.u7', 's1.cp'],
};

export const stage1Units: Unit[] = [
  {
    id: 's1.u1',
    stageId: 's1',
    ordinal: 0,
    title: tr('The major scale recipe'),
    strandWeights: { keys: 3, theory: 2, create: 1 },
    concepts: ['scale:c:major:rh:1oct', 'theory:scale-recipe'],
    prerequisites: ['s0.cp'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'A **scale** is the small set of notes a piece of music lives in. Every major scale is built by the same recipe of steps: **W W H W W W H** — whole, whole, half, whole, whole, whole, half.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'A **half step** is the very next key up, black or white. A **whole step** skips one key. You met both in Stage 0 — now they do a job.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Start on **C**. Take a **whole step** up and play where you land.'),
            notes: ['D'],
            count: 1,
            distinct: 'octave',
            hint: tr('Skip the black key in between. Any octave.'),
          },
          {
            kind: 'playCheck',
            ask: tr('Another **whole step**. Play it.'),
            notes: ['E'],
            count: 1,
            distinct: 'octave',
            hint: tr('Skip one key again — the black key between D and E.'),
          },
          {
            kind: 'playCheck',
            ask: tr('Now the recipe asks for a **half step**. Play the very next key up.'),
            notes: ['F'],
            count: 1,
            distinct: 'octave',
            hint: tr('There is no black key between E and F. The next key up is white.'),
          },
          {
            kind: 'text',
            md: tr(
              'Keep going — W W W H — and you get G, A, B, then home to C. Eight notes, all white, and you never picked one of them. The recipe did.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('C major, one octave. The two half steps are E→F and B→C.'),
            demo: {
              bpm: 100,
              loop: false,
              events: [60, 62, 64, 65, 67, 69, 71, 72].map((midi, i) => ({
                midi,
                atBeat: i,
                durBeats: 1,
              })),
            },
          },
        ],
      },
      {
        kind: 'guided',
        id: 's1.u1.g1',
        exercise: wait('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'explain',
        id: 's1.u1.e2',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Five fingers, eight notes — so one finger has to move house. Right hand: **1 2 3** on C D E, then the **thumb tucks under** to F, and **2 3 4 5** finish G A B C.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Play the note your thumb tucks under to.'),
            notes: ['F'],
            count: 1,
            distinct: 'octave',
            hint: tr('The fourth note of the scale — right after the first half step.'),
          },
          {
            kind: 'text',
            md: tr(
              'The numbers on the keys are the standard route, and it never changes. Follow it now and you will never have to unlearn it later.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's1.u1.g2',
        exercise: wait('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'down' }),
      },
      {
        kind: 'ladder',
        id: 's1.u1.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'updown' }, 60),
      },
      {
        kind: 'graded',
        id: 's1.u1.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'up' }, 60),
      },
      {
        kind: 'create',
        id: 's1.u1.c1',
        prompt: tr(
          'Press Play: a C **drone** — one low C that just keeps sounding — and every note of the scale lit. Make a short tune out of them, four or five notes, then stop. Wherever you stop, try ending on C instead and hear the door close.',
        ),
        exercise: play(
          { key: C_MAJOR, palette: 'degrees123', roman: [], loops: 4, tintDegrees: ALL_DEGREES },
          'rh',
          72,
        ),
      },
    ],
  },
  {
    id: 's1.u2',
    stageId: 's1',
    ordinal: 1,
    title: tr('Thumb-under, both hands'),
    strandWeights: { keys: 4, create: 1 },
    concepts: ['scale:c:major:lh:1oct'],
    prerequisites: ['s1.u1'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'The tuck is the whole trick. Going up, after **3** on E, your thumb travels *under* the palm and lands on F while the hand stays level. Nothing jumps, nothing tilts.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('Slow enough to hear the seam at F. There should not be one.'),
            demo: {
              bpm: 72,
              loop: false,
              events: [60, 62, 64, 65, 67, 69, 71, 72].map((midi, i) => ({
                midi,
                atBeat: i,
                durBeats: 1,
              })),
            },
          },
          {
            kind: 'playCheck',
            ask: tr('Right hand: play C, D, E with 1 2 3, tuck, and land on the fourth note.'),
            notes: ['F'],
            count: 1,
            distinct: 'octave',
            hint: tr('Move the thumb while 2 and 3 are still down. Play F when you get there.'),
          },
          {
            kind: 'text',
            md: tr(
              'The left hand mirrors it, and mirrors mean opposites. Going **up** from C the left hand starts on **5**, and after the thumb plays G, finger **3 crosses over** the top.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Left hand, going up: play the note finger 3 crosses over to.'),
            notes: ['A'],
            count: 1,
            distinct: 'octave',
            hint: tr('LH up is 5 4 3 2 1 on C D E F G — the crossing lands on the next note after G.'),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's1.u2.g1',
        exercise: wait('scale-run', { tonic: 'C', scaleType: 'major', hand: 'lh', direction: 'up' }, 'lh'),
      },
      {
        kind: 'guided',
        id: 's1.u2.g2',
        exercise: wait('scale-run', { tonic: 'C', scaleType: 'major', hand: 'lh', direction: 'down' }, 'lh'),
      },
      {
        kind: 'ladder',
        id: 's1.u2.l1',
        tempos: [0.7, 0.85, 1],
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'updown' }, 70),
      },
      {
        kind: 'ladder',
        id: 's1.u2.l2',
        tempos: [0.7, 0.85, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'C', scaleType: 'major', hand: 'lh', direction: 'updown' },
          60,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's1.u2.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'up' }, 70),
      },
      {
        kind: 'graded',
        id: 's1.u2.q2',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'C', scaleType: 'major', hand: 'lh', direction: 'up' },
          60,
          'lh',
        ),
      },
      {
        kind: 'create',
        id: 's1.u2.c1',
        prompt: tr(
          'No metronome, no score. Both hands, an octave apart, walk the scale up and down together over the drone — slowly enough that the tuck is not an event. When it stops being one, try it with your eyes shut.',
        ),
        exercise: play(
          { key: C_MAJOR, palette: 'degrees123', roman: [], loops: 4, tintDegrees: ALL_DEGREES },
          'both',
          66,
        ),
      },
    ],
  },
  {
    id: 's1.u3',
    stageId: 's1',
    ordinal: 2,
    title: tr('Degrees: the scale gets numbers'),
    strandWeights: { theory: 2, ear: 3, create: 1 },
    concepts: ['theory:degrees', 'ear:degree:135'],
    prerequisites: ['s1.u2'],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              "Inside a key, notes answer to **numbers** rather than letters. In C major: C is **1**, D is **2**, on up to B as **7**. The number is the note's job — and the job is what you actually hear.\n\nDegree 1 has a name of its own: the **tonic**. It is the note the key is named after, and the note everything else leans back towards. In C major the tonic is C.",
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Play degree **5**.'),
            notes: ['G'],
            count: 1,
            distinct: 'octave',
            hint: tr('Count up from C: C is 1, D is 2, E is 3, F is 4…'),
          },
          {
            kind: 'playCheck',
            ask: tr('Play degree **3** — the note that decides happy or sad.'),
            notes: ['E'],
            count: 1,
            distinct: 'octave',
          },
          {
            kind: 'playCheck',
            ask: tr('Play degree **7**, then let it fall to **1**. Feel the lean.'),
            notes: ['B', 'C'],
            count: 2,
            distinct: 'name',
            hint: tr('B wants to go somewhere, and there is only one place it wants to go.'),
          },
          {
            kind: 'text',
            md: tr(
              'Numbers travel. In G major, G becomes 1 and the same tune comes out in a new key with no rethinking. Learn the numbers once and eleven keys come free.',
            ),
          },
          {
            kind: 'earCheck',
            question: tr('Against the C drone — which degree is that?'),
            options: ['1', '3', '5'],
            correctIndex: 2,
            demo: {
              bpm: 80,
              loop: false,
              events: [
                { midi: 48, atBeat: 0, durBeats: 4 },
                { midi: 67, atBeat: 1, durBeats: 2 },
              ],
            },
          },
        ],
      },
      {
        kind: 'guided',
        id: 's1.u3.g1',
        exercise: wait('ear-degree', { key: C_MAJOR, degreePool: [1, 3, 5], count: 4 }, 'rh', 'by-ear'),
      },
      {
        kind: 'graded',
        id: 's1.u3.q1',
        passScore: 0.8,
        exercise: wait('ear-degree', { key: C_MAJOR, degreePool: [1, 3, 5], count: 6 }, 'rh', 'by-ear'),
      },
      {
        kind: 'create',
        id: 's1.u3.c1',
        prompt: tr(
          'Only 1, 3 and 5 are lit — three notes are plenty for a melody. Sing a number out loud, then find it on the keys. Singing first is the exercise; the playing is just checking your work.',
        ),
        exercise: play({ key: C_MAJOR, palette: 'degrees123', roman: [], loops: 4, tintDegrees: [1, 3, 5] }),
      },
    ],
  },
  {
    id: 's1.u4',
    stageId: 's1',
    ordinal: 3,
    title: tr('Your first chord: home'),
    strandWeights: { keys: 3, theory: 2, create: 1 },
    concepts: ['chord:c:maj:inv0', 'theory:triad135'],
    prerequisites: ['s1.u3'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Take degrees **1, 3 and 5** — C, E and G — and sound them together. That is a **triad**: a chord with three different notes. These notes make **C major**.\n\nThe **root** is the note the chord is built on and named after: C, here. It is the lowest note in this example, but it does not have to stay lowest.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('One, three, five — then all at once.'),
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
          {
            kind: 'playCheck',
            ask: tr('Play all three: **C, E and G**.'),
            notes: ['C', 'E', 'G'],
            count: 3,
            distinct: 'name',
            hint: tr('Thumb on C, middle finger on E, little finger on G. Any octave.'),
          },
          {
            kind: 'text',
            md: tr(
              'Feel the shape rather than reading it: fingers **1, 3, 5**, with one white key skipped under each gap. Your hand can learn that gap, and from then on the gap *is* the chord.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Now the left hand: play a low **C** underneath it.'),
            notes: ['C'],
            count: 1,
            distinct: 'octave',
            hint: tr(
              'Down where the bass lives. Root in the left, chord in the right — that is the whole texture.',
            ),
          },
        ],
      },
      { kind: 'guided', id: 's1.u4.g1', exercise: wait('chord-grip', { root: 'C', quality: 'maj' }) },
      {
        kind: 'guided',
        id: 's1.u4.g2',
        exercise: wait('chord-grip', { root: 'C', quality: 'maj', hand: 'lh' }, 'lh'),
      },
      {
        kind: 'ladder',
        id: 's1.u4.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('grip-interleave', { roots: ['C'], qualities: ['maj'], count: 6 }, 60),
      },
      {
        kind: 'graded',
        id: 's1.u4.q1',
        passScore: 0.8,
        exercise: tempo('grip-interleave', { roots: ['C'], qualities: ['maj'], count: 6 }, 60),
      },
      {
        kind: 'create',
        id: 's1.u4.c1',
        prompt: tr(
          'Left hand holds a low C, right hand has C–E–G. Now stop playing them together: let the three notes fall one at a time, in any order, any rhythm. That is not an exercise any more, it is accompaniment.',
        ),
        exercise: play(
          { key: C_MAJOR, palette: 'chordtones', roman: [], loops: 4, tintDegrees: [1, 3, 5] },
          'both',
          72,
        ),
      },
    ],
  },
  {
    id: 's1.u5',
    stageId: 's1',
    ordinal: 4,
    title: tr('Three chords, a thousand songs'),
    strandWeights: { keys: 4, theory: 2, create: 1 },
    concepts: ['chord:f:maj:inv0', 'chord:g:maj:inv0', 'prog:i-iv-v:c'],
    prerequisites: ['s1.u4'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Stand the same 1-3-5 shape on degree **4** and degree **5** of the scale. On F that gives F–A–C. On G, G–B–D. Same shape, same fingers, moved along.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Build the chord on **F**: F, A, C.'),
            notes: ['F', 'A', 'C'],
            count: 3,
            distinct: 'name',
            hint: tr('Skip a white key under each gap, exactly like C major did.'),
          },
          {
            kind: 'playCheck',
            ask: tr('And on **G**: G, B, D.'),
            notes: ['G', 'B', 'D'],
            count: 3,
            distinct: 'name',
          },
          {
            kind: 'text',
            md: tr(
              'Chords are named after the degree they stand on, in roman numerals: **I**, **IV**, **V**. Capitals mean major. Name them that way and the same three chords work in any key you like.',
            ),
          },
          {
            kind: 'progressionCard',
            roman: ['I', 'IV', 'V'],
            key: C_MAJOR,
          },
          {
            kind: 'text',
            md: tr(
              'Many folk, blues and rock songs use I, IV and V. Practice changing between these three chords without stopping.',
            ),
          },
        ],
      },
      { kind: 'guided', id: 's1.u5.g1', exercise: wait('chord-grip', { root: 'F', quality: 'maj' }) },
      { kind: 'guided', id: 's1.u5.g2', exercise: wait('chord-grip', { root: 'G', quality: 'maj' }) },
      {
        kind: 'guided',
        id: 's1.u5.g3',
        exercise: wait('progression-play', { key: C_MAJOR, roman: ['I', 'IV', 'V', 'I'], loops: 1 }),
      },
      {
        kind: 'guided',
        id: 's1.u5.g4',
        exercise: wait(
          'progression-play',
          { key: C_MAJOR, roman: ['I', 'IV', 'V', 'I'], loops: 1, style: 'rootchord' },
          'both',
        ),
      },
      {
        kind: 'ladder',
        id: 's1.u5.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C_MAJOR, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 1, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's1.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C_MAJOR, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'create',
        id: 's1.u5.c1',
        prompt: tr(
          'The backing walks I–IV–V–I underneath you. Play the roots with your left hand if you want company, or leave it alone and pick out single chord tones on top. Land on something that belongs each time the chord turns over.',
        ),
        exercise: play(
          { key: C_MAJOR, palette: 'chordtones', roman: ['I', 'IV', 'V', 'I'], loops: 3 },
          'both',
          70,
        ),
      },
    ],
  },
  {
    id: 's1.u6',
    stageId: 's1',
    ordinal: 5,
    title: tr('The sad one: vi'),
    strandWeights: { keys: 3, theory: 1, ear: 3, create: 1 },
    concepts: ['chord:a:min:inv0', 'ear:quality:majmin', 'prog:i-v-vi-iv:c'],
    prerequisites: ['s1.u5'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'One note decides the mood. Take C–E–G and move only the **middle** note down a half step: C–E♭–G. Nothing else changed, and the whole chord went from bright to bruised.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('C major, then C minor. Only the middle note moved.'),
            demo: {
              bpm: 80,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 2 },
                { midi: 64, atBeat: 0, durBeats: 2 },
                { midi: 67, atBeat: 0, durBeats: 2 },
                { midi: 60, atBeat: 2, durBeats: 2 },
                { midi: 63, atBeat: 2, durBeats: 2 },
                { midi: 67, atBeat: 2, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'playCheck',
            ask: tr('Play it yourself: **C, E♭, G**.'),
            notes: ['C', 'Eb', 'G'],
            count: 3,
            distinct: 'name',
            hint: tr('E♭ is the black key just left of E. That half step is the entire difference.'),
          },
          {
            kind: 'text',
            md: tr(
              'A chord with the small gap on the bottom is **minor**. Build 1-3-5 on degree **6** of C major — A, C, E — and it comes out minor by itself, using only the keys you are already in. Lowercase numeral: **vi**.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Play **A minor**: A, C, E.'),
            notes: ['A', 'C', 'E'],
            count: 3,
            distinct: 'name',
          },
          {
            kind: 'earCheck',
            question: tr('Major or minor?'),
            options: [tr('Major'), tr('Minor')],
            correctIndex: 1,
            demo: {
              bpm: 80,
              loop: false,
              events: [
                { midi: 57, atBeat: 0, durBeats: 3 },
                { midi: 60, atBeat: 0, durBeats: 3 },
                { midi: 64, atBeat: 0, durBeats: 3 },
              ],
            },
          },
          {
            kind: 'progressionCard',
            roman: ['I', 'V', 'vi', 'IV'],
            key: C_MAJOR,
          },
          {
            kind: 'text',
            md: tr(
              '**I–V–vi–IV** is a common pop progression. In C, play C major, G major, A minor and F major. Listen for the change to a minor chord on vi.',
            ),
          },
        ],
      },
      { kind: 'guided', id: 's1.u6.g1', exercise: wait('chord-grip', { root: 'A', quality: 'min' }) },
      {
        kind: 'guided',
        id: 's1.u6.g2',
        exercise: wait(
          'ear-quality',
          { qualityPool: ['maj', 'min'], roots: ['C', 'F', 'G', 'A'], count: 4 },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'ladder',
        id: 's1.u6.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C_MAJOR, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 1, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's1.u6.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C_MAJOR, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's1.u6.q2',
        passScore: 0.8,
        exercise: wait(
          'ear-quality',
          { qualityPool: ['maj', 'min'], roots: ['C', 'F', 'G', 'A'], count: 8 },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'create',
        id: 's1.u6.c1',
        prompt: tr(
          'I–V–vi–IV, round and round. Try the same handful of notes over every bar and listen to how the vi bends them — the notes stay put, the meaning moves. That is what chords do to a melody.',
        ),
        exercise: play(
          { key: C_MAJOR, palette: 'chordtones', roman: ['I', 'V', 'vi', 'IV'], loops: 3 },
          'both',
          72,
        ),
      },
    ],
  },
  {
    id: 's1.u7',
    stageId: 's1',
    ordinal: 6,
    title: tr('Play a real song'),
    strandWeights: { keys: 4, create: 2 },
    concepts: ['song:first-light'],
    prerequisites: ['s1.u6'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's1.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              '*First Light* is sixteen bars long and uses exactly the four chords you own. A **chart** gives you one chord per bar and nothing else — no note-by-note notation. This is how most working musicians read pop music.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'Verse: **I V vi IV**, twice. Chorus: **I vi IV V**, twice. Left hand takes the root, right hand takes the chord, and both land together on the bar line.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Play the four roots of the verse in order: C, G, A, F.'),
            notes: ['C', 'G', 'A', 'F'],
            count: 4,
            distinct: 'name',
            hint: tr('Left hand, low. These are the notes your bass player would play.'),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's1.u7.g1',
        exercise: wait('chart-play', { songId: 'first-light', style: 'rootchord' }, 'both', 'chord-symbols'),
      },
      {
        kind: 'ladder',
        id: 's1.u7.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'first-light', style: 'rootchord' },
          72,
          'both',
          'chord-symbols',
        ),
      },
      {
        kind: 'guided',
        id: 's1.u7.g-roman',

        exercise: wait(
          'flashcard',
          { kind: 'roman', keys: [C_MAJOR], romans: ['I', 'IV', 'V', 'vi'], count: 8 },
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'graded',
        id: 's1.u7.q1',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'first-light', style: 'rootchord' },
          72,
          'both',
          'chord-symbols',
        ),
      },
      {
        kind: 'create',
        id: 's1.u7.c1',
        prompt: tr(
          'Same four chords, rotated to start on vi — the backing plays your new loop. Play along with the roots, or float single notes on top. One reordering, and the sunny song turns cinematic.',
        ),
        exercise: play(
          { key: C_MAJOR, palette: 'chordtones', roman: ['vi', 'IV', 'I', 'V'], loops: 3 },
          'both',
          72,
        ),
      },
    ],
  },
  {
    id: 's1.cp',
    stageId: 's1',
    ordinal: 7,
    title: tr('Checkpoint: C major'),
    strandWeights: { keys: 3, theory: 1, ear: 2 },
    concepts: [],
    prerequisites: ['s1.u7'],
    minutes: 12,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's1.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'One key, owned: the scale in time with both hands, all four chords on demand, degrees by ear, and eight bars of a song from its chart. Five takes, no hints.',
            ),
          },
        ],
      },
      {
        kind: 'graded',
        id: 's1.cp.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'C', scaleType: 'major', hand: 'rh', direction: 'up' }, 70),
      },
      {
        kind: 'graded',
        id: 's1.cp.q2',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'C', scaleType: 'major', hand: 'lh', direction: 'up' },
          60,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's1.cp.q3',
        passScore: 0.8,
        exercise: wait(
          'flashcard',
          { kind: 'roman', keys: [C_MAJOR], romans: ['I', 'IV', 'V', 'vi'], count: 8 },
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'graded',
        id: 's1.cp.q4',
        passScore: 0.8,
        exercise: wait('ear-degree', { key: C_MAJOR, degreePool: [1, 3, 5], count: 6 }, 'rh', 'by-ear'),
      },
      {
        kind: 'graded',
        id: 's1.cp.q5',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C_MAJOR, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
          'chord-symbols',
        ),
      },
    ],
  },
];
