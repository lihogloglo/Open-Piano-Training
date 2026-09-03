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
    timingTier: 'standard',
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

const WHITE_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ALL_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ALL_DEGREES = [1, 2, 3, 4, 5, 6, 7];

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
    strandWeights: { theory: 3, keys: 2, create: 1 },
    concepts: ['theory:interval:seconds-thirds', 'theory:interval:fourths-fifths'],
    prerequisites: ['s1.cp'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'An **interval** is the distance between two notes, and it has two parts: a **size** and a **quality**. Size first, because size is just counting.',
          },
          {
            kind: 'text',
            md: 'Count letter names, including both ends. C to E is C–D–E: three letters, so it is a **3rd**. C to G is five letters, a **5th**. Black keys never change the size — only the letters do.',
          },
          {
            kind: 'playCheck',
            ask: 'Play a **3rd** above C: skip a letter and land on the next one.',
            // Both an E and an E flat are 3rds above C — size is the letter
            // count, and the quality question has not been asked yet.
            notes: ['E', 'Eb'],
            count: 1,
            distinct: 'octave',
            hint: 'C, D, E — three letters. Any key called some kind of E counts.',
          },
          {
            kind: 'playCheck',
            ask: 'Play a **5th** above C.',
            notes: ['G'],
            count: 1,
            distinct: 'octave',
            hint: 'C, D, E, F, G. Counting letters, not keys.',
          },
          {
            kind: 'text',
            md: 'Now quality. C→E and C→E♭ are **both 3rds** — same three letters. But one is four half steps and the other three. The wide one is a **major 3rd**, the narrow one a **minor 3rd**. Size says which letters; quality says how far.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'Major 3rd, then minor 3rd. Same size, different shade.',
            demo: {
              bpm: 70,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 2 },
                { midi: 64, atBeat: 0, durBeats: 2 },
                { midi: 60, atBeat: 2, durBeats: 2 },
                { midi: 63, atBeat: 2, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'playCheck',
            ask: 'Play a **minor 3rd** above D.',
            notes: ['F'],
            count: 1,
            distinct: 'octave',
            hint: 'D to F is a 3rd (D, E, F). Count the half steps: three. It is already the narrow one.',
          },
          {
            kind: 'text',
            md: 'Two sizes are so stable they refuse the major/minor question: the **4th** and the **5th** are **perfect**. C to F, C to G. Every scale you know is made of these four names.',
          },
          {
            kind: 'earCheck',
            question: 'Major 3rd or minor 3rd?',
            options: ['Major 3rd', 'Minor 3rd'],
            correctIndex: 1,
            demo: {
              bpm: 70,
              loop: false,
              events: [
                { midi: 65, atBeat: 0, durBeats: 3 },
                { midi: 68, atBeat: 0, durBeats: 3 },
              ],
            },
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u1.g1',
        exercise: wait('flashcard', {
          kind: 'interval',
          roots: ['C', 'F', 'G'],
          intervals: ['M3', 'm3'],
          count: 6,
        }),
      },
      {
        kind: 'guided',
        id: 's2.u1.g2',
        exercise: wait('flashcard', {
          kind: 'interval',
          roots: WHITE_ROOTS,
          intervals: ['P4', 'P5'],
          count: 6,
        }),
      },
      {
        kind: 'ladder',
        id: 's2.u1.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'flashcard',
          { kind: 'interval', roots: WHITE_ROOTS, intervals: ['m3', 'M3', 'P4', 'P5'], count: 8 },
          50,
        ),
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
      {
        kind: 'create',
        id: 's2.u1.c1',
        prompt:
          'Hold a 3rd in one hand — any two keys with one letter skipped between them — and walk the pair up the white keys over the drone. Some come out wide, some narrow, and the tune does not care. Parallel 3rds are half of pop music.',
        exercise: play(
          {
            key: { tonic: 'C', mode: 'major' },
            palette: 'degrees123',
            roman: [],
            loops: 4,
            tintDegrees: ALL_DEGREES,
          },
          'rh',
          70,
        ),
      },
    ],
  },
  {
    id: 's2.u2',
    stageId: 's2',
    ordinal: 1,
    title: 'Stacking thirds',
    strandWeights: { theory: 3, keys: 2, create: 1 },
    concepts: ['spell:triad:maj', 'spell:triad:min'],
    prerequisites: ['s2.u1'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Here is the engine: a **major triad is a major 3rd with a minor 3rd stacked on top**. A **minor triad is the same two intervals, swapped**. From any root, no shapes memorized.',
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
          {
            kind: 'playCheck',
            ask: 'Build **D major** yourself: D, up a major 3rd, then up a minor 3rd.',
            notes: ['D', 'F#', 'A'],
            count: 3,
            distinct: 'name',
            hint: 'Four half steps from D lands on a black key. That is the F♯ your ear expects.',
          },
          {
            kind: 'text',
            md: 'Swap the two intervals and the mood swaps with them. **D minor** is a minor 3rd (three half steps) then a major 3rd — and the middle note drops onto a white key.',
          },
          {
            kind: 'playCheck',
            ask: 'Build **D minor**: D, F, A.',
            notes: ['D', 'F', 'A'],
            count: 3,
            distinct: 'name',
          },
          {
            kind: 'text',
            md: 'Nothing here is a new shape. It is the same two rulers, applied twice. That is why this stage costs one lesson and buys you all twenty-four triads.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u2.g1',
        exercise: wait(
          'flashcard',
          { kind: 'spell', roots: ['D', 'E', 'A'], qualities: ['maj', 'min'], count: 6 },
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'guided',
        id: 's2.u2.g2',
        exercise: wait(
          'grip-interleave',
          { roots: WHITE_ROOTS, qualities: ['maj', 'min'], count: 8 },
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'ladder',
        id: 's2.u2.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'grip-interleave',
          { roots: WHITE_ROOTS, qualities: ['maj', 'min'], count: 8 },
          54,
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'graded',
        id: 's2.u2.q1',
        passScore: 0.8,
        exercise: wait(
          'flashcard',
          { kind: 'spell', roots: WHITE_ROOTS, qualities: ['maj', 'min'], count: 10 },
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'create',
        id: 's2.u2.c1',
        prompt:
          'Pick a white key. Build major on it, then minor, and let each ring before you decide which you prefer. Work along all seven. Three of the minors will send you to a black key — that is the next lesson, arriving early.',
        exercise: play(
          {
            key: { tonic: 'C', mode: 'major' },
            palette: 'chordtones',
            roman: ['I', 'vi'],
            loops: 4,
            tintDegrees: ALL_DEGREES,
          },
          'both',
          70,
        ),
      },
    ],
  },
  {
    id: 's2.u3',
    stageId: 's2',
    ordinal: 2,
    title: 'The black-key roots',
    strandWeights: { keys: 4, theory: 1, create: 1 },
    concepts: ['spell:triad:allroots'],
    prerequisites: ['s2.u2'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: "The engine doesn't care what colour the keys are. **E♭ major** is still a major 3rd plus a minor 3rd. Twelve roots, two qualities — twenty-four triads, one rule.",
          },
          {
            kind: 'playCheck',
            ask: 'Build **E♭ major**: E♭, G, B♭.',
            notes: ['Eb', 'G', 'Bb'],
            count: 3,
            distinct: 'name',
            hint: 'Two black keys and a white one in the middle. The hand likes this shape more than the eye does.',
          },
          {
            kind: 'text',
            md: 'Spelling matters more than colour: the middle note of E♭ major is **G**, not F♯♯ — a 3rd is always three letters. Say the letters and the accidentals sort themselves out.',
          },
          {
            kind: 'playCheck',
            ask: 'Build **F♯ minor**: F♯, A, C♯.',
            notes: ['F#', 'A', 'C#'],
            count: 3,
            distinct: 'name',
            hint: 'Minor first: three half steps up from F♯ is A. Then four more.',
          },
          {
            kind: 'text',
            md: 'The drill ahead mixes roots on purpose. Interleaved practice feels worse than repeating one chord and works better — you have to rebuild each time instead of coasting.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u3.g1',
        exercise: wait(
          'grip-interleave',
          { roots: ['Db', 'Eb', 'F#', 'Ab', 'Bb'], qualities: ['maj'], count: 6 },
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'guided',
        id: 's2.u3.g2',
        exercise: wait(
          'grip-interleave',
          { roots: ['Db', 'Eb', 'F#', 'Ab', 'Bb'], qualities: ['min'], count: 6 },
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'ladder',
        id: 's2.u3.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'grip-interleave',
          { roots: ALL_ROOTS, qualities: ['maj', 'min'], count: 10 },
          50,
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'graded',
        id: 's2.u3.q1',
        passScore: 0.8,
        exercise: tempo(
          'grip-interleave',
          { roots: ALL_ROOTS, qualities: ['maj', 'min'], count: 16 },
          50,
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'create',
        id: 's2.u3.c1',
        prompt:
          'The backing sits in E♭ — a key with three flats and no white-key comfort. Play chord tones over it with the right hand and let the left take the roots. Flat keys feel foreign for about four minutes.',
        exercise: play(
          {
            key: { tonic: 'Eb', mode: 'major' },
            palette: 'chordtones',
            roman: ['I', 'IV', 'V', 'I'],
            loops: 3,
          },
          'both',
          70,
        ),
      },
    ],
  },
  {
    id: 's2.u4',
    stageId: 's2',
    ordinal: 3,
    title: 'A new key: G',
    strandWeights: { keys: 4, theory: 2, create: 1 },
    concepts: ['scale:g:major:rh:1oct', 'scale:g:major:lh:1oct', 'keysig:g:major', 'prog:i-iv-v:g'],
    prerequisites: ['s2.u3'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Run the recipe — W W H W W W H — from **G**, and seven notes fit the white keys. The eighth refuses: the recipe wants a half step at the top, so F becomes **F♯**.',
          },
          {
            kind: 'playCheck',
            ask: 'Play the one note G major bends.',
            notes: ['F#'],
            count: 1,
            distinct: 'octave',
            hint: 'The note under the top tonic. One black key, and it is the whole key signature.',
          },
          { kind: 'circleOfFifths', highlight: ['C', 'G'] },
          {
            kind: 'text',
            md: "That single sharp **is** G major's key signature. And your I–IV–V transposes without rethinking: in G they are **G, C and D**.",
          },
          {
            kind: 'playCheck',
            ask: 'Play the three roots: **G, C, D**.',
            notes: ['G', 'C', 'D'],
            count: 3,
            distinct: 'name',
            hint: 'Degrees 1, 4 and 5 of the new key — the same three jobs, a fifth higher.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u4.g1',
        exercise: wait('scale-run', { tonic: 'G', scaleType: 'major', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'guided',
        id: 's2.u4.g2',
        exercise: wait('scale-run', { tonic: 'G', scaleType: 'major', hand: 'lh', direction: 'up' }, 'lh'),
      },
      {
        kind: 'ladder',
        id: 's2.u4.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('scale-run', { tonic: 'G', scaleType: 'major', hand: 'rh', direction: 'updown' }, 70),
      },
      {
        kind: 'graded',
        id: 's2.u4.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'G', scaleType: 'major', hand: 'rh', direction: 'up' }, 70),
      },
      {
        kind: 'graded',
        id: 's2.u4.q2',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'G', scaleType: 'major', hand: 'lh', direction: 'up' },
          60,
          'lh',
        ),
      },
      {
        kind: 'graded',
        id: 's2.u4.q3',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: { tonic: 'G', mode: 'major' },
            roman: ['I', 'IV', 'V', 'I'],
            beatsPerChord: 4,
            loops: 2,
            style: 'rootchord',
          },
          70,
          'both',
          'chord-symbols',
        ),
      },
      {
        kind: 'create',
        id: 's2.u4.c1',
        prompt:
          'A backing in G, and one black key in play. Improvise on the chord tones and let your hand find F♯ by feel — the first key change is where "I know C major" turns into "I know how keys work".',
        exercise: play(
          {
            key: { tonic: 'G', mode: 'major' },
            palette: 'chordtones',
            roman: ['I', 'IV', 'V', 'I'],
            loops: 3,
          },
          'both',
          72,
        ),
      },
    ],
  },
  {
    id: 's2.u5',
    stageId: 's2',
    ordinal: 4,
    title: 'The circle appears',
    strandWeights: { keys: 3, theory: 3, create: 1 },
    concepts: ['scale:d:major:rh:1oct', 'scale:d:major:lh:1oct', 'keysig:d:major', 'theory:circle:sharps'],
    prerequisites: ['s2.u4'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Start the recipe a fifth higher each time and a pattern falls out: every new key keeps the sharps of the last one and adds exactly **one more**. C has none, G has one, D has two.',
          },
          { kind: 'circleOfFifths', highlight: ['C', 'G', 'D'] },
          {
            kind: 'playCheck',
            ask: "D major keeps G's F♯ and adds one. Play **both** of its sharps.",
            notes: ['F#', 'C#'],
            count: 2,
            distinct: 'name',
            hint: 'The new one is always the 7th degree of the new key — the note that leans home.',
          },
          {
            kind: 'text',
            md: 'That spiral is the **circle of fifths**, and it is not trivia. It is the map: neighbours on the circle share almost every note, which is why a song can slip from one to the next without anyone noticing.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u5.g1',
        exercise: wait('scale-run', { tonic: 'D', scaleType: 'major', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'guided',
        id: 's2.u5.g2',
        exercise: wait('scale-run', { tonic: 'D', scaleType: 'major', hand: 'lh', direction: 'up' }, 'lh'),
      },
      {
        kind: 'ladder',
        id: 's2.u5.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('scale-run', { tonic: 'D', scaleType: 'major', hand: 'rh', direction: 'updown' }, 70),
      },
      {
        kind: 'graded',
        id: 's2.u5.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'D', scaleType: 'major', hand: 'rh', direction: 'updown' }, 70),
      },
      {
        kind: 'graded',
        id: 's2.u5.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: { tonic: 'D', mode: 'major' },
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 2,
            style: 'rootchord',
          },
          70,
          'both',
          'chord-symbols',
        ),
      },
      {
        kind: 'create',
        id: 's2.u5.c1',
        prompt:
          'The Axis progression again, but in D. You have never practised it here and it will still work, because you learned the numbers rather than the letters. Play until that stops feeling like a trick.',
        exercise: play(
          {
            key: { tonic: 'D', mode: 'major' },
            palette: 'chordtones',
            roman: ['I', 'V', 'vi', 'IV'],
            loops: 3,
          },
          'both',
          72,
        ),
      },
    ],
  },
  {
    id: 's2.u6',
    stageId: 's2',
    ordinal: 5,
    title: 'The flat side: F',
    strandWeights: { keys: 3, theory: 2, create: 1 },
    concepts: ['scale:f:major:rh:1oct', 'scale:f:major:lh:1oct', 'keysig:f:major'],
    prerequisites: ['s2.u5'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Walk the circle the *other* way from C and the accidentals arrive as flats instead. **F major** needs one: the recipe asks for a half step between degrees 3 and 4, so B becomes **B♭**.',
          },
          { kind: 'circleOfFifths', highlight: ['F', 'C'] },
          {
            kind: 'playCheck',
            ask: 'Play the note F major bends.',
            notes: ['Bb'],
            count: 1,
            distinct: 'octave',
            hint: 'The black key just left of B. Call it B♭, never A♯ — in this key it has to be a B of some kind.',
          },
          {
            kind: 'text',
            md: 'F is also where the fingering stops being polite. The right hand runs **1 2 3 4** and *then* tucks, because the thumb refuses to live on a black key. Watch the labels rather than assuming.',
          },
          {
            kind: 'playCheck',
            ask: 'The I, IV and V roots of F: play **F, B♭, C**.',
            notes: ['F', 'Bb', 'C'],
            count: 3,
            distinct: 'name',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u6.g1',
        exercise: wait('scale-run', { tonic: 'F', scaleType: 'major', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'guided',
        id: 's2.u6.g2',
        exercise: wait('scale-run', { tonic: 'F', scaleType: 'major', hand: 'lh', direction: 'up' }, 'lh'),
      },
      {
        kind: 'ladder',
        id: 's2.u6.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('scale-run', { tonic: 'F', scaleType: 'major', hand: 'rh', direction: 'updown' }, 66),
      },
      {
        kind: 'graded',
        id: 's2.u6.q1',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'F', scaleType: 'major', hand: 'rh', direction: 'updown' }, 66),
      },
      {
        kind: 'graded',
        id: 's2.u6.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: { tonic: 'F', mode: 'major' },
            roman: ['I', 'IV', 'V', 'I'],
            beatsPerChord: 4,
            loops: 2,
            style: 'rootchord',
          },
          70,
          'both',
          'chord-symbols',
        ),
      },
      {
        kind: 'create',
        id: 's2.u6.c1',
        prompt:
          'Flat keys sit differently under the hand — B♭ sits up and back, and your thumb has to plan ahead. Improvise slowly in F and let the hand learn the geography before the ear gets bored.',
        exercise: play(
          {
            key: { tonic: 'F', mode: 'major' },
            palette: 'chordtones',
            roman: ['I', 'IV', 'V', 'I'],
            loops: 3,
          },
          'both',
          70,
        ),
      },
    ],
  },
  {
    id: 's2.u7',
    stageId: 's2',
    ordinal: 6,
    title: 'Ear: major or minor?',
    strandWeights: { ear: 4, keys: 2, create: 1 },
    concepts: ['ear:quality:majmin-solid'],
    prerequisites: ['s2.u6'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's2.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: 'You can build both triads now. Time to hear them cold. The difference is one note and three half steps: **major** sits open and settled, **minor** leans inward.',
          },
          {
            kind: 'earCheck',
            question: 'Which one is this?',
            options: ['Major', 'Minor'],
            correctIndex: 0,
            demo: {
              bpm: 70,
              loop: false,
              events: [
                { midi: 65, atBeat: 0, durBeats: 3 },
                { midi: 69, atBeat: 0, durBeats: 3 },
                { midi: 72, atBeat: 0, durBeats: 3 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'Do not analyse it. Match it: hum the middle note, then find the chord that fits your hum. The drill answers on the keyboard, so your hands do the reporting.',
          },
          {
            kind: 'earCheck',
            question: 'And this one?',
            options: ['Major', 'Minor'],
            correctIndex: 1,
            demo: {
              bpm: 70,
              loop: false,
              events: [
                { midi: 67, atBeat: 0, durBeats: 3 },
                { midi: 70, atBeat: 0, durBeats: 3 },
                { midi: 74, atBeat: 0, durBeats: 3 },
              ],
            },
          },
        ],
      },
      {
        kind: 'guided',
        id: 's2.u7.g1',
        exercise: wait(
          'ear-quality',
          { qualityPool: ['maj', 'min'], roots: ['C', 'F', 'G'], count: 4 },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's2.u7.q1',
        passScore: 0.9,
        exercise: wait(
          'ear-quality',
          { qualityPool: ['maj', 'min'], roots: ['C', 'F', 'G'], count: 8 },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'ladder',
        id: 's2.u7.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'first-light', transposeTo: 'G', style: 'rootchord' },
          72,
          'both',
          'chord-symbols',
        ),
      },
      {
        kind: 'graded',
        id: 's2.u7.q2',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'first-light', transposeTo: 'G', style: 'rootchord' },
          72,
          'both',
          'chord-symbols',
        ),
      },
      {
        kind: 'create',
        id: 's2.u7.c1',
        prompt:
          'Play any major chord, then sink its middle note a half step and hold both versions in your ear. Do it in three different keys over the backing. You are training one interval, and it is the one that carries the mood of everything.',
        exercise: play(
          {
            key: { tonic: 'G', mode: 'major' },
            palette: 'chordtones',
            roman: ['I', 'vi', 'IV', 'V'],
            loops: 3,
          },
          'both',
          72,
        ),
      },
    ],
  },
  {
    id: 's2.cp',
    stageId: 's2',
    ordinal: 7,
    title: 'Checkpoint: Spelling engine',
    strandWeights: { keys: 3, theory: 2, ear: 1 },
    concepts: [],
    prerequisites: ['s2.u7'],
    minutes: 14,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's2.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The engine test: triads from any root, scales in three new keys, intervals on demand, qualities by ear, and a two-handed progression in a key you have never drilled it in. Six takes, no hints.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's2.cp.q1',
        passScore: 0.8,
        exercise: wait(
          'grip-interleave',
          { roots: ALL_ROOTS, qualities: ['maj', 'min'], count: 12 },
          'rh',
          'chord-symbols',
        ),
      },
      {
        kind: 'graded',
        id: 's2.cp.q2',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'G', scaleType: 'major', hand: 'rh', direction: 'up' }, 70),
      },
      {
        kind: 'graded',
        id: 's2.cp.q3',
        passScore: 0.8,
        exercise: tempo('scale-run', { tonic: 'F', scaleType: 'major', hand: 'rh', direction: 'updown' }, 66),
      },
      {
        kind: 'graded',
        id: 's2.cp.q4',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'interval',
          roots: WHITE_ROOTS,
          intervals: ['m3', 'M3', 'P4', 'P5'],
          count: 8,
        }),
      },
      {
        kind: 'graded',
        id: 's2.cp.q5',
        passScore: 0.85,
        exercise: wait(
          'ear-quality',
          { qualityPool: ['maj', 'min'], roots: ['C', 'F', 'G'], count: 6 },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's2.cp.q6',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: { tonic: 'D', mode: 'major' },
            roman: ['I', 'IV', 'V', 'I'],
            beatsPerChord: 4,
            loops: 2,
            style: 'rootchord',
          },
          70,
          'both',
          'chord-symbols',
        ),
      },
    ],
  },
];
