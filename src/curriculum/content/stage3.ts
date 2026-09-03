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
const play = (params: Record<string, unknown>, hand: Hand = 'both', bpm = 72): ExerciseDef => ({
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
const D = { tonic: 'D', mode: 'major' } as const;
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
    strandWeights: { theory: 3, keys: 3, create: 1 },
    concepts: ['theory:diatonic-pattern', 'chord:b:dim:inv0'],
    prerequisites: ['s2.cp'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Stack a 3rd and a 5th on **every** note of C major, using only white keys. Seven chords appear, and you did not choose any of them — the key did.',
          },
          {
            kind: 'playCheck',
            ask: 'Build the chord standing on **D**: D, F, A.',
            notes: ['D', 'F', 'A'],
            count: 3,
            distinct: 'name',
            hint: 'Same skip-a-letter shape as always. Listen to what comes out: the key made this one minor.',
          },
          {
            kind: 'text',
            md: 'Their qualities follow one fixed pattern, every time: **M m m M M m dim**. Major, minor, minor, major, major, minor, diminished. It is the same in every major key, so learn it once.',
          },
          {
            kind: 'playCheck',
            ask: 'The odd one out sits on **B**: play B, D, F.',
            notes: ['B', 'D', 'F'],
            count: 3,
            distinct: 'name',
            hint: 'Two minor 3rds stacked. It sounds unfinished because it is — that is its job.',
          },
          {
            kind: 'text',
            md: 'That last one is **B diminished**: tense on purpose, and desperate to resolve. Play it, then drop to C and hear the relief.',
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
        kind: 'guided',
        id: 's3.u1.g2',
        exercise: wait(
          'progression-play',
          { key: C, roman: ['I', 'ii', 'iii', 'IV'], loops: 1, style: 'rootchord' },
          'both',
        ),
      },
      {
        kind: 'ladder',
        id: 's3.u1.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'I'],
            beatsPerChord: 2,
            loops: 1,
          },
          66,
        ),
      },
      {
        kind: 'graded',
        id: 's3.u1.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'I'],
            beatsPerChord: 4,
            loops: 1,
          },
          66,
        ),
      },
      {
        kind: 'create',
        id: 's3.u1.c1',
        prompt:
          'The backing walks I–vi–ii–V, four of the seven. Play over it and notice the sorting that happens by itself: some chords feel like standing still, some like walking away, and one keeps shoving you home.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'vi', 'ii', 'V'], loops: 3 }),
      },
    ],
  },
  {
    id: 's3.u2',
    stageId: 's3',
    ordinal: 1,
    title: 'Roman numerals',
    strandWeights: { theory: 4, keys: 2, create: 1 },
    concepts: ['theory:roman'],
    prerequisites: ['s3.u1'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Name chords by **job**, not letter: capitals for major (**I, IV, V**), lowercase for minor (**ii, iii, vi**), and a ° for diminished (**vii°**). The numeral is the degree it stands on.',
          },
          {
            kind: 'text',
            md: '"**vi** in G" is a question with one answer: sixth note of G major (E), minor quality. E minor. The letter changes with the key; the numeral never does.',
          },
          {
            kind: 'playCheck',
            ask: 'Play **vi in G major**.',
            notes: ['E', 'G', 'B'],
            count: 3,
            distinct: 'name',
            hint: 'Count up G A B C D E — the sixth is E. Then build minor on it.',
          },
          {
            kind: 'playCheck',
            ask: 'Same numeral, new key: play **vi in F major**.',
            notes: ['D', 'F', 'A'],
            count: 3,
            distinct: 'name',
            hint: 'F G A B♭ C D — the sixth is D. Minor again, because vi is always minor.',
          },
          {
            kind: 'text',
            md: 'Two different chords, one idea. This is the whole reason musicians talk in numerals: a chart written this way works in all twelve keys without being rewritten.',
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
        kind: 'ladder',
        id: 's3.u2.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'flashcard',
          { kind: 'roman', keys: [...FOUR_KEYS], romans: ['I', 'ii', 'IV', 'V', 'vi'], count: 8 },
          50,
        ),
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
      {
        kind: 'create',
        id: 's3.u2.c1',
        prompt:
          'The backing is I–V–vi–IV in **D** — a key you have played twice. Do not translate to letters. Think "one, five, six, four" and let your hands go where the numbers point.',
        exercise: play({ key: D, palette: 'chordtones', roman: ['I', 'V', 'vi', 'IV'], loops: 3 }),
      },
    ],
  },
  {
    id: 's3.u3',
    stageId: 's3',
    ordinal: 2,
    title: 'Home, away, tension',
    strandWeights: { theory: 2, ear: 3, keys: 2, create: 1 },
    concepts: ['theory:function', 'ear:chord-function:145'],
    prerequisites: ['s3.u2'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Chords do three jobs. **Tonic** (I, vi, iii) is home. **Subdominant** (IV, ii) steps away. **Dominant** (V, vii°) leans hard toward home.',
          },
          {
            kind: 'text',
            md: 'Two things do the leaning. The **leading tone** — degree 7, one half step under home — and the bass falling a fifth from 5 to 1.',
          },
          {
            kind: 'playCheck',
            ask: 'Play the leading tone of C major, then home.',
            notes: ['B', 'C'],
            count: 2,
            distinct: 'name',
            hint: 'The note that will not sit still, and the note it wants.',
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
          {
            kind: 'playCheck',
            ask: 'Left hand only: play the V root, then the I root — **G** down to **C**.',
            notes: ['G', 'C'],
            count: 2,
            distinct: 'name',
            hint: 'That falling fifth in the bass is half of why a cadence sounds final.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u3.g1',
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['I', 'IV', 'I'],
              ['I', 'V', 'I'],
            ],
            count: 2,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'ladder',
        id: 's3.u3.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 1, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's3.u3.q1',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['I', 'IV', 'I'],
              ['I', 'V', 'I'],
              ['I', 'IV', 'V', 'I'],
            ],
            count: 3,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's3.u3.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'create',
        id: 's3.u3.c1',
        prompt:
          'Say the jobs out loud as the backing turns them over: "home, away, tension, home." Then stop playing on the tension chord and sit in it for a bar. Wanting to resolve is the feeling this whole lesson is about.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'IV', 'V', 'I'], loops: 3 }),
      },
    ],
  },
  {
    id: 's3.u4',
    stageId: 's3',
    ordinal: 3,
    title: 'The four-chord families',
    strandWeights: { keys: 4, theory: 2, create: 1 },
    concepts: ['prog:i-vi-iv-v:c', 'prog:i-vi-iv-v:g', 'prog:vi-iv-i-v:c', 'prog:vi-iv-i-v:g'],
    prerequisites: ['s3.u3'],
    minutes: 13,
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
            kind: 'playCheck',
            ask: 'Enter through the vi door: play the four roots **A, F, C, G**.',
            notes: ['A', 'F', 'C', 'G'],
            count: 4,
            distinct: 'name',
            hint: 'Left hand, low. Same four chords as I–V–vi–IV, started one door along.',
          },
          {
            kind: 'progressionCard',
            roman: ['vi', 'IV', 'I', 'V'],
            key: { tonic: 'C', mode: 'major' },
            songRefs: ['Melancholy radio pop', 'Singer-songwriter anthems', 'Epic film-trailer cues'],
          },
          {
            kind: 'text',
            md: 'Which door you pick decides the mood. Starting on vi sounds like a question; starting on I sounds like an answer — with no change to the chords at all.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u4.g1',
        exercise: wait('progression-play', { key: C, roman: ['I', 'vi', 'IV', 'V'], loops: 1 }),
      },
      {
        kind: 'guided',
        id: 's3.u4.g2',
        exercise: wait(
          'progression-play',
          { key: C, roman: ['vi', 'IV', 'I', 'V'], loops: 1, style: 'rootchord' },
          'both',
        ),
      },
      {
        kind: 'ladder',
        id: 's3.u4.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['vi', 'IV', 'I', 'V'], beatsPerChord: 4, loops: 1, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's3.u4.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['vi', 'IV', 'I', 'V'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's3.u4.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: G, roman: ['I', 'vi', 'IV', 'V'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'create',
        id: 's3.u4.c1',
        prompt:
          'The backing enters on vi. Play with it for a while, then try starting your own phrase on the third bar instead — the loop does not care where you think it begins, and neither does the listener.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['vi', 'IV', 'I', 'V'], loops: 3 }),
      },
    ],
  },
  {
    id: 's3.u5',
    stageId: 's3',
    ordinal: 4,
    title: 'ii and iii, the connectors',
    strandWeights: { keys: 3, theory: 3, create: 1 },
    concepts: ['chord:d:min:inv0', 'chord:e:min:inv0', 'prog:i-ii-v:c', 'theory:ii-v'],
    prerequisites: ['s3.u4'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: '**ii** is the professional way into V. Its root is a step above the tonic and a fifth above the dominant, so **ii→V→I** is two falling fifths in a row — the strongest bass move there is.',
          },
          {
            kind: 'playCheck',
            ask: 'Play **ii in C**: D, F, A.',
            notes: ['D', 'F', 'A'],
            count: 3,
            distinct: 'name',
          },
          {
            kind: 'keyboardDemo',
            caption: 'IV–V–I, then ii–V–I. The second one lands harder.',
            demo: {
              bpm: 72,
              loop: false,
              events: [
                { midi: 65, atBeat: 0, durBeats: 1 },
                { midi: 69, atBeat: 0, durBeats: 1 },
                { midi: 72, atBeat: 0, durBeats: 1 },
                { midi: 67, atBeat: 1, durBeats: 1 },
                { midi: 71, atBeat: 1, durBeats: 1 },
                { midi: 74, atBeat: 1, durBeats: 1 },
                { midi: 60, atBeat: 2, durBeats: 2 },
                { midi: 64, atBeat: 2, durBeats: 2 },
                { midi: 67, atBeat: 2, durBeats: 2 },
                { midi: 62, atBeat: 4, durBeats: 1 },
                { midi: 65, atBeat: 4, durBeats: 1 },
                { midi: 69, atBeat: 4, durBeats: 1 },
                { midi: 67, atBeat: 5, durBeats: 1 },
                { midi: 71, atBeat: 5, durBeats: 1 },
                { midi: 74, atBeat: 5, durBeats: 1 },
                { midi: 60, atBeat: 6, durBeats: 2 },
                { midi: 64, atBeat: 6, durBeats: 2 },
                { midi: 67, atBeat: 6, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'text',
            md: '**iii** is the other connector, and it is colour rather than motion: still a tonic-family chord, but tilted. It is what turns a I–IV climb into something that sounds composed.',
          },
          {
            kind: 'playCheck',
            ask: 'Play **iii in C**: E, G, B.',
            notes: ['E', 'G', 'B'],
            count: 3,
            distinct: 'name',
            hint: 'Two notes of it are also in the I chord. That is why it feels like home wearing a coat.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u5.g1',
        exercise: wait('progression-play', { key: C, roman: ['I', 'ii', 'V', 'I'], loops: 1 }),
      },
      {
        kind: 'guided',
        id: 's3.u5.g2',
        exercise: wait(
          'progression-play',
          { key: C, roman: ['I', 'iii', 'IV', 'V'], loops: 1, style: 'rootchord' },
          'both',
        ),
      },
      {
        kind: 'ladder',
        id: 's3.u5.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'ii', 'V', 'I'], beatsPerChord: 4, loops: 1, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's3.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'ii', 'V', 'I'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's3.u5.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: G, roman: ['I', 'iii', 'IV', 'V'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'create',
        id: 's3.u5.c1',
        prompt:
          'Backing: I–vi–ii–V, the turnaround that has ended a hundred thousand songs. Play the ii bar twice as long in your head before it arrives — anticipating a chord is most of what "playing with feel" means.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'vi', 'ii', 'V'], loops: 3 }),
      },
    ],
  },
  {
    id: 's3.u6',
    stageId: 's3',
    ordinal: 5,
    title: 'Harmonize a melody',
    strandWeights: { create: 3, theory: 3 },
    concepts: ['create:harmonize:1'],
    prerequisites: ['s3.u5'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'A melody note fits any chord that **contains** it — and often a chord doing the **same job** works too. Most melodies have several right harmonies. You are choosing, not solving.',
          },
          {
            kind: 'playCheck',
            ask: 'Take the melody note **E**. Harmonize it with C major: C, E, G.',
            notes: ['C', 'E', 'G'],
            count: 3,
            distinct: 'name',
          },
          {
            kind: 'playCheck',
            ask: 'Same note, different chord: harmonize that E with A minor instead.',
            notes: ['A', 'C', 'E'],
            count: 3,
            distinct: 'name',
            hint: 'E is the 3rd of C major and the 5th of A minor. One note, two homes, two moods.',
          },
          {
            kind: 'text',
            md: 'That gap between the two — same melody, different chord under it — is where arranging lives. In the drill you will hear a note and see its degree; answer with any chord that fits.',
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
        kind: 'guided',
        id: 's3.u6.g2',
        exercise: wait('progression-play', {
          key: G,
          roman: ['I', 'vi', 'IV', 'V'],
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
          'Over the drone, hum three long notes — any three. Find a chord for each, then go back and find a second chord for each. Play both versions one after the other. The tune did not change; the story did.',
        exercise: play(
          { key: C, palette: 'chordtones', roman: [], loops: 4, tintDegrees: [1, 2, 3, 4, 5, 6, 7] },
          'both',
          70,
        ),
      },
    ],
  },
  {
    id: 's3.u7',
    stageId: 's3',
    ordinal: 6,
    title: 'Ear: name the progression',
    strandWeights: { ear: 4, create: 1 },
    concepts: ['ear:prog:pop4'],
    prerequisites: ['s3.u6'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Four chords play. Answer them back in order — the whole chord, or just its bass note. Hunt the **bass motion** first: it gives most of the answer away before the chords do.',
          },
          {
            kind: 'earCheck',
            question: 'Which loop is this?',
            options: ['I–V–vi–IV', 'I–vi–IV–V'],
            correctIndex: 0,
            demo: {
              bpm: 84,
              loop: false,
              events: [
                { midi: 48, atBeat: 0, durBeats: 2 },
                { midi: 60, atBeat: 0, durBeats: 2 },
                { midi: 64, atBeat: 0, durBeats: 2 },
                { midi: 67, atBeat: 0, durBeats: 2 },
                { midi: 43, atBeat: 2, durBeats: 2 },
                { midi: 59, atBeat: 2, durBeats: 2 },
                { midi: 62, atBeat: 2, durBeats: 2 },
                { midi: 67, atBeat: 2, durBeats: 2 },
                { midi: 45, atBeat: 4, durBeats: 2 },
                { midi: 57, atBeat: 4, durBeats: 2 },
                { midi: 60, atBeat: 4, durBeats: 2 },
                { midi: 64, atBeat: 4, durBeats: 2 },
                { midi: 41, atBeat: 6, durBeats: 2 },
                { midi: 57, atBeat: 6, durBeats: 2 },
                { midi: 60, atBeat: 6, durBeats: 2 },
                { midi: 65, atBeat: 6, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'Down a fifth, up a step, down a third: that shape is the fingerprint. Once you can follow the bass, naming the loop is bookkeeping.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u7.g1',
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['I', 'IV', 'V', 'I'],
              ['I', 'V', 'vi', 'IV'],
            ],
            count: 2,
          },
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
      {
        kind: 'create',
        id: 's3.u7.c1',
        prompt:
          'Backing on, eyes shut. Before each chord arrives, try to hear it coming — then check. Predicting the next chord is the same skill as naming the last one, running one bar earlier.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'V', 'vi', 'IV'], loops: 3 }),
      },
    ],
  },
  {
    id: 's3.u8',
    stageId: 's3',
    ordinal: 7,
    title: 'Song lab',
    strandWeights: { keys: 4, create: 2 },
    concepts: ['song:northline', 'song:paper-sun'],
    prerequisites: ['s3.u7'],
    minutes: 17,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's3.u8.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Two new charts. **Northline** climbs through iii — your new colour chord — in G. **Paper Sun** rides the ii→V turnaround in F. Read the romans, not the letters.',
          },
          {
            kind: 'playCheck',
            ask: 'Northline is in G. Play its **iii**: B, D, F♯.',
            notes: ['B', 'D', 'F#'],
            count: 3,
            distinct: 'name',
            hint: 'Third degree of G major is B, and iii is always minor.',
          },
          {
            kind: 'playCheck',
            ask: 'Paper Sun is in F. Play its **ii**: G, B♭, D.',
            notes: ['G', 'Bb', 'D'],
            count: 3,
            distinct: 'name',
            hint: 'Second degree of F is G. The B♭ comes from the key signature, not from the chord.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's3.u8.g1',
        exercise: wait('chart-play', { songId: 'northline', style: 'rootchord' }, 'both', 'lead-sheet'),
      },
      {
        kind: 'ladder',
        id: 's3.u8.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('chart-play', { songId: 'northline', style: 'rootchord' }, 66, 'both', 'lead-sheet'),
      },
      {
        kind: 'graded',
        id: 's3.u8.q1',
        passScore: 0.8,
        exercise: tempo('chart-play', { songId: 'northline', style: 'rootchord' }, 66, 'both', 'lead-sheet'),
      },
      {
        // Paper Sun is a second song, not a transposition of the first, and it
        // is the fastest chart in the stage. It gets its own ramp.
        kind: 'ladder',
        id: 's3.u8.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo('chart-play', { songId: 'paper-sun', style: 'rootchord' }, 84, 'both', 'lead-sheet'),
      },
      {
        kind: 'graded',
        id: 's3.u8.q2',
        passScore: 0.8,
        exercise: tempo('chart-play', { songId: 'paper-sun', style: 'rootchord' }, 84, 'both', 'lead-sheet'),
      },
      {
        kind: 'create',
        id: 's3.u8.c1',
        prompt:
          "Paper Sun's loop is I–vi–ii–V, and the backing plays it in **C** rather than its own key of F. Nothing on screen tells you the letters. Play it from the numerals alone — that is the whole point of this stage, cashed in.",
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'vi', 'ii', 'V'], loops: 3 }),
      },
    ],
  },
  {
    id: 's3.cp',
    stageId: 's3',
    ordinal: 8,
    title: 'Checkpoint: Roman lens',
    strandWeights: { theory: 2, keys: 3, ear: 1 },
    concepts: [],
    prerequisites: ['s3.u8'],
    minutes: 14,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's3.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The lens test: numerals in four keys, functions by ear, a harmonization, a rotated loop on demand, and a chart played from its romans. Five takes, no hints.',
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
          {
            key: C,
            pool: [
              ['I', 'IV', 'I'],
              ['I', 'V', 'I'],
              ['I', 'IV', 'V', 'I'],
            ],
            count: 3,
          },
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
          { key: G, roman: ['vi', 'IV', 'I', 'V'], beatsPerChord: 4, loops: 2, style: 'rootchord' },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's3.cp.q5',
        passScore: 0.8,
        exercise: tempo('chart-play', { songId: 'paper-sun', style: 'rootchord' }, 84, 'both', 'lead-sheet'),
      },
    ],
  },
];
