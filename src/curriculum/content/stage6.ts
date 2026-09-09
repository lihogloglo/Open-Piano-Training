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
  rung: 'lead-sheet',
  hand,
  seedPolicy: 'random',
});

const C = { tonic: 'C', mode: 'major' } as const;
const F = { tonic: 'F', mode: 'major' } as const;
const Bb = { tonic: 'Bb', mode: 'major' } as const;
const II_V_I = ['ii7', 'V7', 'Imaj7'];

export const stage6: Stage = {
  id: 's6',
  ordinal: 6,
  title: tr('Charts for real'),
  tagline: tr('Comping craft'),
  summary: tr(
    'A chord chart is not sheet music — it tells you what, never how. This stage is the how: the voicings working pianists actually use, the rhythms that turn chords into a groove, and the confidence to read a chart you have never seen.',
  ),
  unitIds: ['s6.u1', 's6.u2', 's6.u3', 's6.u4', 's6.u5', 's6.u6', 's6.u7', 's6.u8', 's6.cp'],
};

export const stage6Units: Unit[] = [
  {
    id: 's6.u1',
    stageId: 's6',
    ordinal: 0,
    title: tr('Reading the language'),
    strandWeights: { theory: 3 },
    concepts: ['read:symbols:full'],
    prerequisites: ['s5.cp'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Time to read every symbol a chart can throw at you. The grammar is regular: **root**, then **quality**, then **extensions**, then an optional **/bass**.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              '`Am` minor · `A7` dominant · `Amaj7` major 7th · `Am7♭5` half-diminished · `Asus4` the 3rd replaced by the 4th · `A6` add the 6th · `Aadd9` add the 9th without a 7th · `A/C♯` A major with C♯ in the bass.\n\nThe one that trips people: **`A7` is not "A major 7"** — it is a dominant. Major 7 always says `maj7`.',
            ),
          },
          {
            kind: 'earCheck',
            question: tr('Which is the dominant?'),
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
            options: [tr('A7 (dominant)'), tr('Amaj7')],
            correctIndex: 0,
          },
          {
            kind: 'playCheck',
            ask: tr('Play **Csus4** — the 3rd replaced, not added.'),
            notes: ['C', 'F', 'G'],
            count: 3,
            distinct: 'name',
            hint: tr(
              'The E leaves and the F takes its place. A sus chord is neither major nor minor, which is why it hangs.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Now **Cadd9** — the 9th added, and the 7th left out.'),
            notes: ['C', 'E', 'G', 'D'],
            count: 4,
            distinct: 'name',
            hint: tr('The triad plus a D. If a chart wanted the 7th as well it would have said C9.'),
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
        kind: 'ladder',
        id: 's6.u1.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'flashcard',
          {
            kind: 'spell',
            roots: ['C', 'D', 'F', 'G', 'A', 'Bb'],
            qualities: ['maj7', '7', 'm7', 'sus4', '6'],
            count: 8,
          },
          46,
        ),
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
      {
        kind: 'create',
        id: 's6.u1.c1',
        prompt: tr(
          'One backing, one rule: change nothing but the quality. Play the I bar as a triad, then maj7, then 6, then sus4, then add9. Five symbols, one root, and each one is a different weather.',
        ),
        exercise: play({
          key: C,
          palette: 'chordtones',
          roman: ['Imaj7', 'IV', 'V7', 'Imaj7'],
          loops: 3,
          bpm: 70,
        }),
      },
    ],
  },
  {
    id: 's6.u2',
    stageId: 's6',
    ordinal: 1,
    title: tr('Shells'),
    strandWeights: { keys: 3 },
    concepts: ['voicing:shell17', 'voicing:shell13'],
    prerequisites: ['s6.u1'],
    minutes: 16,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              "A chord symbol says which notes. It never says which ones to leave out, or where to put them. That choice is called a **voicing**, and this stage is a tour of the ones working pianists use.\n\nStart here: you do not need all four notes. A **shell** is two — the **root**, and the one note that decides the chord's identity, its **7th** or its **3rd**. Everything else is decoration.",
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr(
              'Dm7 · G7 · Cmaj7 as 1-7 shells in the left hand. Two notes each, and it still says ii-V-I.',
            ),
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
            md: tr(
              'Why bother? Because two notes leave your right hand free for the melody, they never sound muddy down low, and they are fast enough to keep up with a chart at tempo.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Left hand: play the **1-7 shell of G7** — its root and its 7th.'),
            notes: ['G', 'F'],
            count: 2,
            distinct: 'name',
            hint: tr(
              'A dominant 7th is a whole step under the octave: G up to F. Two notes, and the chord is named.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Now the **1-3 shell of Cmaj7**.'),
            notes: ['C', 'E'],
            count: 2,
            distinct: 'name',
            hint: tr('When the 3rd is the note that decides the mood, that is the one to keep.'),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's6.u2.g1',
        exercise: wait('progression-play', { key: C, roman: II_V_I, loops: 1, voicing: 'shell17' }, 'lh'),
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
        // The 1-3 shell is a different two-note grip from the 1-7, so it gets
        // its own ramp rather than riding on the 1-7 ladder above.
        kind: 'ladder',
        id: 's6.u2.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'vi', 'IV', 'V'], beatsPerChord: 4, loops: 2, voicing: 'shell13' },
          72,
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
      {
        kind: 'create',
        id: 's6.u2.c1',
        prompt: tr(
          'Left hand plays shells and nothing else. Right hand does whatever it likes — and notice how much room it suddenly has. Playing less in the left hand is not a compromise; it is what makes the right hand possible.',
        ),
        exercise: play({ key: C, palette: 'chordtones', roman: II_V_I, loops: 3, bpm: 72 }),
      },
    ],
  },
  {
    id: 's6.u3',
    stageId: 's6',
    ordinal: 2,
    title: tr('Guide tones'),
    strandWeights: { keys: 3, theory: 1 },
    concepts: ['voicing:guidetones'],
    prerequisites: ['s6.u2'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Here is the secret of ii-V-I. While the roots leap around, the **3rd and 7th barely move** — and when they do, they move by a half step. Those two notes are the **guide tones**, and they are what your ear is actually following.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('Dm7 → G7 → Cmaj7: watch F stay, C slide down to B. Roots in the left hand.'),
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
            md: tr(
              'Two notes in the right hand, one in the left, and the harmony is complete. This is the voicing to reach for when a chart moves faster than you can build full chords.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Right hand: the guide tones of **Dm7** — its 3rd and 7th.'),
            notes: ['F', 'C'],
            count: 2,
            distinct: 'name',
            hint: tr(
              'D–F–A–C: the 3rd is F, the 7th is C. Those two are the whole chord as far as your ear is concerned.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr(
              'Move to **G7**: one of those two notes stays, the other drops a half step. Play the new pair.',
            ),
            notes: ['F', 'B'],
            count: 2,
            distinct: 'name',
            hint: tr(
              'F is the 7th of G7 and stays put; C slides down to B, the 3rd. That half step is the whole ii–V motion.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's6.u3.g1',
        exercise: wait(
          'progression-play',
          { key: C, roman: II_V_I, loops: 1, voicing: 'guidetones' },
          'both',
        ),
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
      {
        kind: 'create',
        id: 's6.u3.c1',
        prompt: tr(
          'Play only guide tones over the whole loop — two notes per chord, and let your hand find the version where they barely move. When the pair stops jumping, you have found the voicing a working pianist would have used.',
        ),
        exercise: play({ key: F, palette: 'chordtones', roman: II_V_I, loops: 3, bpm: 70 }),
      },
    ],
  },
  {
    id: 's6.u4',
    stageId: 's6',
    ordinal: 3,
    title: tr('Groove school: straight eighths'),
    strandWeights: { keys: 3 },
    concepts: ['comp:straight8'],
    prerequisites: ['s6.u3'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Chords with no rhythm are not music yet. **Comping** is playing the harmony *in time* — bass on the strong beats, chord stabs in the gaps.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr(
              'One bar of straight eighths over C: bass on 1 and 3, stabs on 2, the "and" of 3, and 4.',
            ),
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
            md: tr(
              'Play every note in the shown voicing at the shown beat. The score checks both the chord notes and their timing.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr(
              'Count "1 and 2 and 3 and 4 and" out loud, twice. Then play a **C** exactly on the "and" of 2.',
            ),
            notes: ['C'],
            count: 1,
            distinct: 'octave',
            hint: tr(
              'The offbeat is where a groove lives. Counting aloud is not a beginner crutch — it is how the placement gets accurate.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'The pattern in this unit is one bar long and repeats: bass on **1** and **3**, chord on **2**, the "and" of **3**, and **4**. Learn the bar, and the chart takes care of itself.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's6.u4.g1',
        exercise: wait(
          'progression-play',
          {
            key: C,
            roman: ['I', 'V', 'vi', 'IV'],
            loops: 1,
            style: 'straight8',
            voicing: 'shell17',
          },
          'both',
        ),
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
      {
        kind: 'create',
        id: 's6.u4.c1',
        prompt: tr(
          'Comp along with the backing, but leave beat 1 of every second bar completely empty. Silence on a strong beat is the most conspicuous thing a rhythm section can do, and holding it is harder than playing.',
        ),
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'V', 'vi', 'IV'], loops: 3, bpm: 84 }),
      },
    ],
  },
  {
    id: 's6.u5',
    stageId: 's6',
    ordinal: 4,
    title: tr('Groove school: ballad & boom-chuck'),
    strandWeights: { keys: 3, create: 1 },
    concepts: ['comp:ballad', 'comp:boomchuck'],
    prerequisites: ['s6.u4'],
    minutes: 17,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Two more grooves for the toolkit. **Ballad accompaniment**: play the bass on beat 1, then the right-hand chord on beats 2, 3 and 4. Repeat that rhythm for each bar.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              '**Boom-chuck**: bass on 1 and 3, chord on 2 and 4. It is the oldest trick in the book — ragtime, country, folk, half of everything — and it works because it puts the pulse where a foot taps.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Boom-chuck on a C bar. Play the two **bass** notes it uses: C, then G.'),
            notes: ['C', 'G'],
            count: 2,
            distinct: 'name',
            hint: tr('Root on 1, fifth on 3 — the alternating bass. The chord answers on 2 and 4.'),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('One bar of boom-chuck over C: bass, chord, bass, chord.'),
            demo: {
              bpm: 92,
              loop: true,
              events: [
                { midi: 36, atBeat: 0, durBeats: 1 },
                { midi: 60, atBeat: 1, durBeats: 0.8 },
                { midi: 64, atBeat: 1, durBeats: 0.8 },
                { midi: 67, atBeat: 1, durBeats: 0.8 },
                { midi: 43, atBeat: 2, durBeats: 1 },
                { midi: 60, atBeat: 3, durBeats: 0.8 },
                { midi: 64, atBeat: 3, durBeats: 0.8 },
                { midi: 67, atBeat: 3, durBeats: 0.8 },
              ],
            },
          },
        ],
      },
      {
        kind: 'guided',
        id: 's6.u5.g1',
        exercise: wait(
          'progression-play',
          {
            key: C,
            roman: ['I', 'IV', 'V', 'I'],
            loops: 1,
            style: 'boomchuck',
            voicing: 'shell13',
          },
          'both',
        ),
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
        // The unit teaches two grooves and used to ramp only the ballad, then
        // score boom-chuck at 92. Boom-chuck gets its own ramp.
        kind: 'ladder',
        id: 's6.u5.l2',
        tempos: [0.6, 0.8, 1],
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
        prompt: tr(
          'Play the loop three times: once boom-chuck, once ballad, once straight eighths. Same chords, three different songs. Keep the one that fits the mood you want, and notice that you chose an arrangement rather than a chord.',
        ),
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'vi', 'IV', 'V'], loops: 3, bpm: 80 }),
      },
    ],
  },
  {
    id: 's6.u6',
    stageId: 's6',
    ordinal: 5,
    title: tr('Melody on top'),
    strandWeights: { keys: 3 },
    concepts: ['texture:melody-lh'],
    prerequisites: ['s6.u5'],
    minutes: 16,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'The full arrangement: **left hand carries the harmony, right hand sings the tune.** This is why shells matter — a two-note left hand leaves the right hand somewhere to go.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Northline is in G. Play the **1-7 shell of its ii chord**, Am7: A and G.'),
            notes: ['A', 'G'],
            count: 2,
            distinct: 'name',
            hint: tr('Root and 7th, left hand, low. The right hand is now free above it.'),
          },
          {
            kind: 'text',
            md: tr(
              'One warning about the right hand: these charts carry chords, not written melodies. What the app scores is the harmony. The tune on top is yours, and nobody is marking it.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's6.u6.g1',
        exercise: wait(
          'chart-play',
          { songId: 'northline', style: 'ballad', voicing: 'shell17' },
          'both',
          'lead-sheet',
        ),
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
        // Slow Tide is a new song in a new key with an AABA form, not a
        // transposition of Northline. It gets a rep and a ramp of its own.
        kind: 'ladder',
        id: 's6.u6.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'slow-tide', style: 'ballad', voicing: 'shell17' },
          60,
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
      {
        kind: 'create',
        id: 's6.u6.c1',
        prompt: tr(
          'Left hand: shells, quietly. Right hand: one line, and make it sing rather than run. Give every phrase a breath at the end — a melody that never rests is just an exercise with a nice tone.',
        ),
        exercise: play({
          key: { tonic: 'G', mode: 'major' },
          palette: 'chordtones',
          roman: ['I', 'iii', 'IV', 'V'],
          loops: 3,
          bpm: 66,
        }),
      },
    ],
  },
  {
    id: 's6.u7',
    stageId: 's6',
    ordinal: 6,
    title: tr('Transpose anything'),
    strandWeights: { keys: 3, theory: 2 },
    concepts: ['skill:transpose'],
    prerequisites: ['s6.u6'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              '"Can we do it a third lower?" — the question every singer asks. The answer is not to rewrite the chart. **Read it in romans, play it in the new key.**',
            ),
          },
          {
            kind: 'text',
            md: tr(
              "The workflow: name the progression by degree (I-vi-ii-V), find the new key's I, and let the shapes follow. You did this in Stage 3 without knowing it was a professional skill.",
            ),
          },
          {
            kind: 'progressionCard',
            roman: ['I', 'vi', 'ii', 'V'],
            key: C,
            songRefs: [tr('The turnaround that ends a thousand standards')],
          },
          {
            kind: 'playCheck',
            ask: tr('Same turnaround, down a third: play the **I–vi–ii–V roots in A♭** — A♭, F, B♭, E♭.'),
            notes: ['Ab', 'F', 'Bb', 'Eb'],
            count: 4,
            distinct: 'name',
            hint: tr(
              'Do not translate chord by chord. Find the new I, then let the degrees fall where they always do.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'That is the whole workflow, and it took you four notes. A singer asks for a different key; you move one anchor and the shapes follow.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's6.u7.g1',
        exercise: wait(
          'progression-play',
          { key: Bb, roman: ['I', 'vi', 'ii', 'V'], loops: 1, voicing: 'shell17' },
          'lh',
        ),
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
      {
        kind: 'create',
        id: 's6.u7.c1',
        prompt: tr(
          'The backing plays the turnaround in A♭ — a key you have drilled once. Play along without naming a single letter to yourself. If the numbers are doing the work, the key stops mattering, and that is the skill this unit is actually selling.',
        ),
        exercise: play({
          key: { tonic: 'Ab', mode: 'major' },
          palette: 'chordtones',
          roman: ['I', 'vi', 'ii', 'V'],
          loops: 3,
          bpm: 72,
        }),
      },
    ],
  },
  {
    id: 's6.u8',
    stageId: 's6',
    ordinal: 7,
    title: tr('The unseen chart'),
    strandWeights: { keys: 3 },
    concepts: ['skill:sightcomp'],
    prerequisites: ['s6.u7'],
    minutes: 15,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's6.u8.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'This one is generated fresh: a chart nobody has ever played, in a key chosen for you. Everything in it is familiar — the forms and the chords are ones you already know — but the exact sequence is new.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'Two passes allowed. First time through, look ahead a bar and keep the left hand simple. Do not stop to fix mistakes — **keeping time matters more than any single chord**.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr(
              'One habit first. Play the **1-7 shell of B♭7** — the fallback voicing for a chord you meet at speed.',
            ),
            notes: ['Bb', 'Ab'],
            count: 2,
            distinct: 'name',
            hint: tr(
              'Root and flat 7th. When a bar arrives faster than you can think, this is what your left hand should do without asking.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'That is the sight-reading contract: a chord you half-recognise still gets a root and a 7th, on time. Full voicings are for the second pass.',
            ),
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
        kind: 'ladder',
        id: 's6.u8.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'unseen-chart',
          { form: 'verse-chorus', sevenths: true, voicing: 'shell17' },
          66,
          'both',
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
      {
        kind: 'create',
        id: 's6.u8.c1',
        prompt: tr(
          'No chart at all now — just a loop. Comp it the way you would a chart you had never seen: simple left hand, look ahead, no stopping. Reading is a nerve as much as a skill, and the nerve is trained by playing through the wrong note rather than around it.',
        ),
        exercise: play({ key: F, palette: 'chordtones', roman: ['I', 'vi', 'ii', 'V'], loops: 3, bpm: 72 }),
      },
    ],
  },
  {
    id: 's6.cp',
    stageId: 's6',
    ordinal: 8,
    title: tr('Checkpoint: Comping'),
    strandWeights: { keys: 3, theory: 1 },
    concepts: [],
    prerequisites: ['s6.u8'],
    minutes: 14,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's6.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'The comping test: a chart you have never seen, the same turnaround in two keys, and shells and guide tones at tempo.',
            ),
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
      {
        kind: 'graded',
        id: 's6.cp.q5',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb'],
          qualities: ['maj7', '7', 'm7', 'm7b5', 'sus4', '6', 'add9'],
          count: 10,
        }),
      },
    ],
  },
];
