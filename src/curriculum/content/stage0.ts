import { tr } from '@/i18n';
import type { Stage, Unit } from '../schema';
import type { ExerciseDef } from '@/engine/types';

const wait = (
  generator: string,
  params: Record<string, unknown>,
  hand: 'rh' | 'lh' | 'both' = 'rh',
): ExerciseDef => ({
  generator,
  params,
  mode: 'wait',
  rung: 'keys-lit',
  hand,
  seedPolicy: 'random',
});

const tempo = (
  generator: string,
  params: Record<string, unknown>,
  bpm: number,
  hand: 'rh' | 'lh' | 'both' = 'rh',
): ExerciseDef => ({
  generator,
  params,
  mode: 'tempo',
  bpm,
  timingTier: 'relaxed',
  rung: 'keys-lit',
  hand,
  seedPolicy: 'random',
});

export const stage0: Stage = {
  id: 's0',
  ordinal: 0,
  title: tr('Bearings'),
  tagline: tr('Find your way around'),
  summary: tr(
    'The keyboard looks like 88 keys. It is really one pattern of 12, repeated. Learn to see the pattern, find any note instantly, and get both hands moving.',
  ),
  unitIds: ['s0.u1', 's0.u2', 's0.u3', 's0.u4', 's0.u5', 's0.u6', 's0.cp'],
};

export const stage0Units: Unit[] = [
  {
    id: 's0.u1',
    stageId: 's0',
    ordinal: 0,
    title: tr('Meet the keyboard'),
    strandWeights: { keys: 3, theory: 1, create: 1 },
    concepts: ['note:find:c', 'note:find:f'],
    prerequisites: [],
    minutes: 9,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Eighty-eight keys, but only **twelve** of them are different. Look at the black keys: they come in groups of **two** and **three**, over and over. One full repeat is an **octave**.',
            ),
          },
          {
            kind: 'text',
            md: tr('So you never learn the whole keyboard. You learn one pattern, then find it everywhere.'),
          },
          {
            kind: 'playCheck',
            ask: tr(
              'Before any names: put a finger on a group of **two** black keys, and play the **white key just to their left**.',
            ),
            notes: ['C'],
            count: 1,
            distinct: 'octave',
            hint: tr('Any octave. Play it on your keyboard, or click the keys below.'),
          },
          {
            kind: 'text',
            md: tr(
              'That note is **C** — and it is the same note in every one of those groups. Hear them stack up:',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('Every C on the keyboard — same spot in every octave.'),
            demo: {
              bpm: 110,
              loop: false,
              events: [
                { midi: 36, atBeat: 0, durBeats: 1 },
                { midi: 48, atBeat: 1, durBeats: 1 },
                { midi: 60, atBeat: 2, durBeats: 1 },
                { midi: 72, atBeat: 3, durBeats: 1 },
                { midi: 84, atBeat: 4, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'playCheck',
            ask: tr('Your turn: play **three different Cs** — a low one, a middle one, a high one.'),
            notes: ['C'],
            count: 3,
            distinct: 'octave',
            hint: tr('Same shape, different octave. Look for the two-black-key group each time.'),
          },
        ],
      },
      { kind: 'guided', id: 's0.u1.g1', exercise: wait('note-find', { notes: ['C'], count: 5 }) },
      {
        kind: 'explain',
        id: 's0.u1.e2',
        blocks: [
          {
            kind: 'text',
            md: tr('Use a second landmark: **F** sits just left of every group of **three** black keys.'),
          },
          {
            kind: 'playCheck',
            ask: tr('Find an **F** — white key, left edge of a group of three.'),
            notes: ['F'],
            count: 1,
            distinct: 'octave',
            hint: tr('Three blacks, not two. The nearest white key on their left.'),
          },
          {
            kind: 'text',
            md: tr(
              'Two landmarks, and the keyboard stops being a wall. Everything else is counted from C or from F — which is exactly what the next lesson does.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Last check: play a **C**, then an **F**, then a **C** again.'),
            notes: ['C', 'F'],
            count: 2,
            distinct: 'name',
            hint: tr('Two different letters. Any octave, either hand.'),
          },
        ],
      },
      { kind: 'guided', id: 's0.u1.g2', exercise: wait('note-find', { notes: ['C', 'F'], count: 8 }) },
      {
        kind: 'graded',
        id: 's0.u1.q1',
        passScore: 0.8,
        exercise: wait('note-find', { notes: ['C', 'F'], count: 12 }),
      },
      {
        kind: 'create',
        id: 's0.u1.c1',
        prompt: tr(
          'Press Play backing: it rocks between two chords, one built on C and one built on F. Play only Cs and Fs over it — any octave, either hand, any rhythm. Land on C when the C chord comes round and hear it click into place.',
        ),
        // Two chords rather than a drone: the landmarks the lesson just taught
        // are also the roots underneath, so "it fits" is audible, not asserted.
        exercise: {
          generator: 'improv',
          params: {
            key: { tonic: 'C', mode: 'major' },
            palette: 'chordtones',
            roman: ['I', 'IV'],
            beatsPerChord: 4,
            loops: 4,
            tintDegrees: [1, 4],
          },
          mode: 'wait',
          bpm: 72,
          rung: 'keys-lit',
          hand: 'both',
          seedPolicy: 'random',
        },
      },
    ],
  },
  {
    id: 's0.u2',
    stageId: 's0',
    ordinal: 1,
    title: tr('Every note has a name'),
    strandWeights: { keys: 3, theory: 2, create: 1 },
    concepts: ['note:find:d', 'note:find:e', 'note:find:g', 'note:find:a', 'note:find:b'],
    prerequisites: ['s0.u1'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'The white keys walk up the alphabet from C: **C D E F G A B** — then C again, forever. Seven letters, no eighth.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('C D E F G A B C — say the letters along with it.'),
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
          {
            kind: 'text',
            md: tr(
              'You do not have to count from C every time. The black-key groups name the whites around them. **D is the one trapped between the two blacks** — dead centre of the pair.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Play a **D**: the white key sitting between two black keys.'),
            notes: ['D'],
            count: 1,
            distinct: 'octave',
            hint: tr('The group of two, not three. D is the filling in the sandwich.'),
          },
          {
            kind: 'text',
            md: tr(
              'Inside the group of **three**, two whites are trapped the same way: **G** between the first and second black, **A** between the second and third.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Play **G**, then **A** — the two whites inside the group of three.'),
            notes: ['G', 'A'],
            count: 2,
            distinct: 'name',
            hint: tr('Left gap is G, right gap is A. Alphabet order still holds.'),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u2.g1',
        exercise: wait('note-find', { notes: ['C', 'D', 'G', 'A'], count: 6 }),
      },
      {
        kind: 'explain',
        id: 's0.u2.e2',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'That leaves **E** and **B** — and they hide in plain sight. C and F sit on the **left** edge of their black-key group; E and B sit on the **right** edge of the same group.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'So each group is bracketed: **C–[two blacks]–E**, and **F–[three blacks]–B**. E and B are the two whites with no black key above them.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Play **E** (right of the two blacks), then **B** (right of the three).'),
            notes: ['E', 'B'],
            count: 2,
            distinct: 'name',
            hint: tr(
              'Look for the two places where two white keys touch. E and B are the left one of each pair.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u2.g2',
        exercise: wait('note-find', { notes: ['E', 'F', 'B', 'C'], count: 8 }),
      },
      {
        kind: 'graded',
        id: 's0.u2.q1',
        passScore: 0.8,
        exercise: wait('note-find', { notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], count: 12 }),
      },
      {
        kind: 'create',
        id: 's0.u2.c1',
        prompt: tr(
          'Learn the opening of **Hot Cross Buns**. Find E, D and C first. Then read the notes from left to right and repeat the first two phrases.',
        ),
        exercise: {
          generator: 'improv',
          params: {
            key: { tonic: 'C', mode: 'major' },
            palette: 'chordtones',
            roman: ['I'],
            beatsPerChord: 4,
            loops: 6,
            songTitle: tr('Hot Cross Buns'),
            songCredit: tr('Traditional English nursery song'),
            melody: ['E D C', 'E D C', 'C C C C', 'D D D D', 'E D C'],
          },
          mode: 'wait',
          bpm: 72,
          rung: 'keys-lit',
          hand: 'both',
          seedPolicy: 'random',
        },
      },
    ],
  },
  {
    id: 's0.u3',
    stageId: 's0',
    ordinal: 2,
    title: tr('Half steps & the black keys'),
    strandWeights: { keys: 2, theory: 2, create: 1 },
    concepts: ['note:find:sharps', 'theory:halfwhole'],
    prerequisites: ['s0.u2'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'The smallest move on the keyboard is a **half step**: the very next key, whichever colour it happens to be. Nothing fits between them.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr(
              'Play a **C**, then the key a half step **above** it — the black key immediately to its right.',
            ),
            notes: ['C#'],
            count: 1,
            distinct: 'octave',
            hint: tr('Not the next white key. The very next key of any colour.'),
          },
          {
            kind: 'text',
            md: tr(
              'That black key has no letter of its own, so it borrows one and says which direction it came from. Up a half step from C is **C♯**. The same key, approached down from D, is **D♭**. One key, two names.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Find **E♭** — the black key a half step *below* E. (You could also call it D♯.)'),
            notes: ['Eb'],
            count: 1,
            distinct: 'octave',
            hint: tr('Start on E and move one key left. It is the right-hand black key of the group of two.'),
          },
          {
            kind: 'text',
            md: tr(
              'Two half steps make a **whole step** — C to D, or E to F♯. Careful: **E to F is only a half step**, and so is B to C. Those are the two places the pattern has no black key to spare.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u3.g1',
        // The plan's chromatic walk: every key in order, RH 1-3 fingering shown.
        exercise: wait('scale-run', { tonic: 'C', scaleType: 'chromatic', hand: 'rh', direction: 'up' }),
      },
      {
        kind: 'guided',
        id: 's0.u3.g2',
        exercise: wait('note-find', { notes: ['C#', 'F#', 'Bb'], count: 6 }),
      },
      {
        kind: 'explain',
        id: 's0.u3.e2',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Sharp means *up one*, flat means *down one*. That is the whole rule — and it is why the same black key answers to two names depending on where you came from.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Prove it: play **A♯**, then **B♭**.'),
            notes: ['A#'],
            count: 1,
            distinct: 'octave',
            hint: tr('They are the same key. Play it once and both names are true.'),
          },
        ],
      },
      {
        kind: 'graded',
        id: 's0.u3.q1',
        passScore: 0.8,
        exercise: wait('note-find', { notes: ['C', 'Eb', 'F#', 'A', 'Bb', 'D'], count: 10 }),
      },
      {
        kind: 'create',
        id: 's0.u3.c1',
        prompt: tr(
          'Learn the opening phrase of **Amazing Grace** on black keys. Start with the short D♭ pickup. Follow each group from left to right, then join the groups over the backing.',
        ),
        // F♯ major pentatonic is exactly the five black keys, so the palette
        // tint lights the black keys and nothing else.
        exercise: {
          generator: 'improv',
          params: {
            key: { tonic: 'F#', mode: 'major' },
            palette: 'pentatonic',
            roman: ['I'],
            beatsPerChord: 4,
            loops: 6,
            songTitle: tr('Amazing Grace'),
            songCredit: tr('NEW BRITAIN, traditional American melody'),
            melody: ['D♭', 'G♭ B♭ G♭', 'B♭ A♭', 'G♭ E♭', 'D♭'],
          },
          mode: 'wait',
          bpm: 76,
          rung: 'by-ear',
          hand: 'both',
          seedPolicy: 'random',
        },
      },
    ],
  },
  {
    id: 's0.u4',
    stageId: 's0',
    ordinal: 3,
    title: tr('Your right hand: the five-finger home'),
    strandWeights: { keys: 4, create: 1 },
    concepts: ['fivefinger:c:maj:rh'],
    prerequisites: ['s0.u3'],
    minutes: 10,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Until now you have been pointing at keys. From here you play them with a **hand shape** — five fingers already in place, so nothing has to travel.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'Rest your right hand so the **thumb sits on C** and one finger covers each of the next four white keys: C D E F G. Curved fingers, loose wrist — like holding a bubble. Nothing else moves.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('Up and back down, one finger per key. No hand movement at all.'),
            demo: {
              bpm: 92,
              loop: false,
              events: [60, 62, 64, 65, 67, 65, 64, 62, 60].map((midi, i) => ({
                midi,
                atBeat: i,
                durBeats: 1,
              })),
            },
          },
          {
            kind: 'text',
            md: tr(
              'Fingers are numbered **1 (thumb) to 5 (pinky)** — the same numbers in every method book you will ever open. The key labels in the next step show which finger takes which note.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr(
              'Set the shape and play all five: **C D E F G**, one finger each, without sliding the hand.',
            ),
            notes: ['C', 'D', 'E', 'F', 'G'],
            count: 5,
            distinct: 'name',
            hint: tr('Thumb on C, pinky on G. If you have to reach, the hand is in the wrong place.'),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u4.g1',
        exercise: wait('five-finger', { tonic: 'C', hand: 'rh', pattern: 'asc' }),
      },
      {
        kind: 'ladder',
        id: 's0.u4.l1',
        // 48 → 60 → 80: the plan's 60→80 with a slower rung under it, because
        // this is the first time the hand has to keep a shape *and* a pulse.
        tempos: [0.6, 0.75, 1],
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'updown' }, 80),
      },
      {
        kind: 'graded',
        id: 's0.u4.q1',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'updown' }, 80),
      },
      {
        kind: 'create',
        id: 's0.u4.c1',
        prompt: tr(
          'Learn the opening phrase of **Ode to Joy**. Keep one finger on each key from C to G. Read one group at a time, then play the whole phrase.',
        ),
        exercise: {
          generator: 'improv',
          params: {
            key: { tonic: 'C', mode: 'major' },
            palette: 'chordtones',
            roman: ['I'],
            beatsPerChord: 4,
            loops: 6,
            tintDegrees: [1, 2, 3, 4, 5],
            songTitle: tr('Ode to Joy'),
            songCredit: tr('Ludwig van Beethoven, 1824'),
            melody: ['E E F G', 'G F E D', 'C C D E', 'E D D'],
          },
          mode: 'wait',
          bpm: 76,
          rung: 'keys-lit',
          hand: 'rh',
          seedPolicy: 'random',
        },
      },
    ],
  },
  {
    id: 's0.u5',
    stageId: 's0',
    ordinal: 4,
    title: tr('Your left hand joins'),
    strandWeights: { keys: 4, create: 1 },
    concepts: [
      'fivefinger:c:maj:lh',
      'fivefinger:g:maj:rh',
      'fivefinger:g:maj:lh',
      'fivefinger:f:maj:rh',
      'fivefinger:f:maj:lh',
    ],
    prerequisites: ['s0.u4'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Piano is a two-hand instrument, and the left hand does not get to arrive late. It learns the same shape, mirrored: **pinky (5)** on the low C, thumb (1) on the G above.',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('Left hand, an octave below middle C: 5 4 3 2 1 and back.'),
            demo: {
              bpm: 88,
              loop: false,
              events: [48, 50, 52, 53, 55, 53, 52, 50, 48].map((midi, i) => ({
                midi,
                atBeat: i,
                durBeats: 1,
              })),
            },
          },
          {
            kind: 'text',
            md: tr(
              'The numbers mirror too: 1 is the thumb in **both** hands, so the fingers count outwards from the middle of the keyboard.',
            ),
          },
          {
            kind: 'playCheck',
            // MIDI cannot see which hand played a note; the pitch is checked,
            // the hand is on trust. Saying so is better than pretending.
            ask: tr(
              'With your **left** hand, play C D E F G below middle C. (The app hears the notes, not the hand — this one is on you.)',
            ),
            notes: ['C', 'D', 'E', 'F', 'G'],
            count: 5,
            distinct: 'name',
            hint: tr('Pinky starts it. If your thumb started, you are playing it right-handed.'),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u5.g1',
        exercise: wait('five-finger', { tonic: 'C', hand: 'lh', pattern: 'asc' }, 'lh'),
      },
      {
        kind: 'explain',
        id: 's0.u5.e2',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Move your right thumb or left little finger to **G**. Place the other fingers on A, B, C and D. Play the same five-finger pattern from G.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr('Put the shape on **G** and play its two ends: **G** and **D**.'),
            notes: ['G', 'D'],
            count: 2,
            distinct: 'name',
            hint: tr('Thumb on G, five white keys up to D under the little finger. Same span as C to G was.'),
          },
          {
            kind: 'text',
            md: tr(
              'That portability is the point of learning shapes rather than notes. By Stage 2 you will move this one to all twelve starting keys without thinking about it.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u5.g2',
        exercise: wait('five-finger', { tonic: 'G', hand: 'rh', pattern: 'updown' }),
      },
      {
        kind: 'guided',
        id: 's0.u5.g3',
        exercise: wait('five-finger', { tonic: 'G', hand: 'lh', pattern: 'asc' }, 'lh'),
      },
      {
        kind: 'ladder',
        id: 's0.u5.l1',
        // The left hand gets its own tempo ramp rather than borrowing the
        // right hand's — it is slower, and pretending otherwise teaches nothing.
        tempos: [0.6, 0.75, 1],
        exercise: tempo('five-finger', { tonic: 'F', hand: 'lh', pattern: 'updown' }, 76, 'lh'),
      },
      {
        kind: 'graded',
        id: 's0.u5.q1',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'F', hand: 'rh', pattern: 'updown' }, 76),
      },
      {
        kind: 'create',
        id: 's0.u5.c1',
        prompt: tr(
          'Learn the opening of **Frère Jacques**. Play it with the right hand first. Then place both hands on C homes and play the phrase one octave apart.',
        ),
        exercise: {
          generator: 'improv',
          params: {
            key: { tonic: 'C', mode: 'major' },
            palette: 'chordtones',
            roman: ['I'],
            beatsPerChord: 4,
            loops: 6,
            tintDegrees: [1, 2, 3, 4, 5],
            songTitle: tr('Frère Jacques'),
            songCredit: tr('Traditional French round'),
            melody: ['C D E C', 'C D E C', 'E F G', 'E F G'],
          },
          mode: 'wait',
          bpm: 72,
          rung: 'keys-lit',
          hand: 'both',
          seedPolicy: 'random',
        },
      },
    ],
  },
  {
    id: 's0.u6',
    stageId: 's0',
    ordinal: 5,
    title: tr('Keeping time'),
    strandWeights: { keys: 3, theory: 2, create: 1 },
    concepts: ['rhythm:basic'],
    prerequisites: ['s0.u5'],
    minutes: 11,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's0.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Music lives on a steady **pulse** — an even click underneath everything, whether or not anyone plays on it. The metronome makes it audible; your job is to place notes *on* it, not near it.',
            ),
          },
          {
            kind: 'text',
            md: tr(
              'Notes are measured in beats. A **quarter note** takes one beat, a **half note** two, a **whole note** four. Same pitch, different amounts of time:',
            ),
          },
          {
            kind: 'keyboardDemo',
            caption: tr('Four quarters, two halves, one whole — all C, all the same pulse underneath.'),
            demo: {
              bpm: 80,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 60, atBeat: 1, durBeats: 1 },
                { midi: 60, atBeat: 2, durBeats: 1 },
                { midi: 60, atBeat: 3, durBeats: 1 },
                { midi: 60, atBeat: 4, durBeats: 2 },
                { midi: 60, atBeat: 6, durBeats: 2 },
                { midi: 60, atBeat: 8, durBeats: 4 },
              ],
            },
          },
          {
            kind: 'text',
            md: tr(
              'First watch and listen to the exact sequence. Then wait through the **count-in**: one bar of clicks before you play. In this exercise, count 1, 2, 3, 4 and play your first note on the next click.',
            ),
          },
          {
            kind: 'playCheck',
            ask: tr(
              'Try it dry: count four out loud at a walking pace, then play **C** exactly on the next one.',
            ),
            notes: ['C'],
            count: 1,
            distinct: 'octave',
            hint: tr('One note, but placed on purpose. Counting out loud is not optional — it is the skill.'),
          },
          {
            kind: 'text',
            md: tr(
              'From here, timing is scored too. The score checks the note and how close it starts to the beat. Notes near the beat still count, with less timing credit. The result tells you whether you tend to play early or late.',
            ),
          },
        ],
      },
      {
        kind: 'guided',
        id: 's0.u6.g1',
        // First timed rep at 60: slow enough that the click is a companion
        // rather than a chase, which is the whole lesson of this unit.
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'asc' }, 60),
      },
      {
        kind: 'ladder',
        id: 's0.u6.l1',
        tempos: [0.6, 0.75, 1],
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'asc' }, 80),
      },
      {
        kind: 'graded',
        id: 's0.u6.q1',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'C', hand: 'rh', pattern: 'updown' }, 80),
      },
      {
        kind: 'create',
        id: 's0.u6.c1',
        prompt: tr(
          'Play the opening of **Jingle Bells** with a steady pulse. The repeated E notes must keep equal spaces. Count four beats before each phrase.',
        ),
        exercise: {
          generator: 'improv',
          params: {
            key: { tonic: 'C', mode: 'major' },
            palette: 'chordtones',
            roman: ['I'],
            beatsPerChord: 4,
            loops: 8,
            tintDegrees: [1, 2, 3, 5],
            songTitle: tr('Jingle Bells'),
            songCredit: tr('James Lord Pierpont, 1857'),
            melody: ['E E E', 'E E E', 'E G C D', 'E'],
          },
          mode: 'wait',
          bpm: 80,
          rung: 'keys-lit',
          hand: 'both',
          seedPolicy: 'random',
        },
      },
    ],
  },
  {
    id: 's0.cp',
    stageId: 's0',
    ordinal: 6,
    title: tr('Checkpoint: Bearings'),
    strandWeights: { keys: 2, theory: 1 },
    concepts: [],
    prerequisites: ['s0.u6'],
    minutes: 8,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's0.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: tr(
              'Show what you found: any white key on demand, the black keys by either name, and a steady five-finger shape in three keys with both hands. Pass this and Stage 1 opens.',
            ),
          },
        ],
      },
      {
        kind: 'graded',
        id: 's0.cp.q1',
        passScore: 0.8,
        exercise: wait('note-find', { notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], count: 12 }),
      },
      {
        // The accidentals sampled on their own, spelled both ways — s0.u3 is
        // the one stage concept the old checkpoint only glanced at.
        kind: 'graded',
        id: 's0.cp.q2',
        passScore: 0.8,
        exercise: wait('note-find', { notes: ['F#', 'Bb', 'C#', 'Eb', 'Ab'], count: 8 }),
      },
      {
        kind: 'graded',
        id: 's0.cp.q3',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'G', hand: 'rh', pattern: 'updown' }, 80),
      },
      {
        kind: 'graded',
        id: 's0.cp.q4',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'F', hand: 'rh', pattern: 'updown' }, 80),
      },
      {
        kind: 'graded',
        id: 's0.cp.q5',
        passScore: 0.8,
        exercise: tempo('five-finger', { tonic: 'C', hand: 'lh', pattern: 'asc' }, 76, 'lh'),
      },
    ],
  },
];
