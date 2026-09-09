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
const BLUES_12 = ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'];

export const stage7: Stage = {
  id: 's7',
  ordinal: 7,
  title: 'Your own voice',
  tagline: 'Improvisation & the ear endgame',
  summary:
    'Everything until now has been about playing what is written. This stage is about playing what is not: making a line up as you go, hearing a song and working it out, and finding the sound that is yours.',
  unitIds: ['s7.u1', 's7.u2', 's7.u3', 's7.u4', 's7.u5', 's7.u6', 's7.u7', 's7.u8', 's7.cp'],
};

export const stage7Units: Unit[] = [
  {
    id: 's7.u1',
    stageId: 's7',
    ordinal: 0,
    title: 'Three notes, infinite music',
    strandWeights: { create: 3, ear: 1 },
    concepts: ['improv:degrees123'],
    prerequisites: ['s6.cp'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's7.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Improvising is not about knowing more notes. It is about knowing what the notes you have will *do*. So we start with three: **1, 2 and 3** of the scale, over a drone.',
          },
          {
            kind: 'text',
            md: 'Play with rhythm and silence instead of range. A long 1, a gap, a quick 2-3-2 — that is already music. **Leave space**: the gaps are what makes the notes mean something.',
          },
          {
            kind: 'text',
            md: 'Nothing you improvise here is scored. There is no wrong note in a three-note palette, which is exactly why we start here.',
          },
          {
            kind: 'playCheck',
            ask: 'Play degrees **1, 2 and 3** of C major.',
            notes: ['C', 'D', 'E'],
            count: 3,
            distinct: 'name',
            hint: 'Three neighbours. That is the entire palette for this lesson.',
          },
          {
            kind: 'playCheck',
            ask: 'Now end a phrase properly: play **3**, then **2**, then land on **1**.',
            notes: ['E', 'D', 'C'],
            count: 3,
            distinct: 'name',
            hint: 'Stepping down onto the tonic is the oldest ending there is, and it works every time.',
          },
          {
            kind: 'text',
            md: 'One thing does get checked: whether you can **hear** which of the three you are on. That is the drill below — the app plays a degree, you find it. Improvising without that is guessing with good manners.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's7.u1.g1',
        exercise: wait('ear-degree', { key: C, degreePool: [1, 2, 3], count: 4 }, 'rh', 'by-ear'),
      },
      {
        kind: 'graded',
        id: 's7.u1.q1',
        passScore: 0.75,
        exercise: wait('ear-degree', { key: C, degreePool: [1, 2, 3], count: 6 }, 'rh', 'by-ear'),
      },
      {
        kind: 'create',
        id: 's7.u1.c1',
        prompt:
          'Over the drone, play only 1, 2 and 3. Make a four-bar phrase, then answer it with another that ends on 1. Call and response — with yourself.',
        exercise: wait('improv', { key: C, palette: 'degrees123', roman: ['I'], loops: 4 }, 'rh', 'by-ear'),
      },
    ],
  },
  {
    id: 's7.u2',
    stageId: 's7',
    ordinal: 1,
    title: 'The pentatonic safety net',
    strandWeights: { keys: 2, create: 2 },
    concepts: ['scale:c:majorpent:rh', 'scale:g:majorpent:rh', 'improv:pent'],
    prerequisites: ['s7.u1'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's7.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The **major pentatonic** is the major scale with its two most argumentative notes removed — the 4th and the 7th. Five notes, no half steps, nothing that can clash.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'C major pentatonic: C D E G A. Every note fits over every chord in the key.',
            demo: {
              bpm: 110,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 62, atBeat: 1, durBeats: 1 },
                { midi: 64, atBeat: 2, durBeats: 1 },
                { midi: 67, atBeat: 3, durBeats: 1 },
                { midi: 69, atBeat: 4, durBeats: 1 },
                { midi: 72, atBeat: 5, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'This is why it is the safety net: over a I-V-vi-IV loop you can play any of those five notes at any moment and it will work. Use that freedom to practise **phrasing**, not note-picking.',
          },
          {
            kind: 'playCheck',
            ask: 'Play the two notes major pentatonic **leaves out** of C major.',
            notes: ['F', 'B'],
            count: 2,
            distinct: 'name',
            hint: 'The 4th and the 7th — the two that argue with the chords. Everything else stays.',
          },
          {
            kind: 'playCheck',
            ask: 'Now the five that remain: C, D, E, G, A.',
            notes: ['C', 'D', 'E', 'G', 'A'],
            count: 5,
            distinct: 'name',
            hint: 'No half steps anywhere in that set. That is the whole trick.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's7.u2.g1',
        exercise: wait(
          'scale-run',
          { tonic: 'C', scaleType: 'major-pentatonic', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'ladder',
        id: 's7.u2.l1',
        tempos: [0.75, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'C', scaleType: 'major-pentatonic', hand: 'rh', direction: 'updown' },
          88,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'graded',
        id: 's7.u2.q1',
        passScore: 0.8,
        exercise: tempo(
          'scale-run',
          { tonic: 'G', scaleType: 'major-pentatonic', hand: 'rh', direction: 'up' },
          88,
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'create',
        id: 's7.u2.c1',
        prompt:
          'Loop I-V-vi-IV and improvise with the pentatonic only. Try building one phrase entirely from two notes before you use all five.',
        exercise: wait(
          'improv',
          { key: C, palette: 'pentatonic', roman: ['I', 'V', 'vi', 'IV'], loops: 4 },
          'rh',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's7.u3',
    stageId: 's7',
    ordinal: 2,
    title: 'Chord tones are home',
    strandWeights: { keys: 2, create: 2, ear: 1 },
    concepts: ['improv:chordtones'],
    prerequisites: ['s7.u2'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's7.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Here is the difference between noodling and playing a line: **where you land when the chord changes.** Hit a chord tone on the downbeat and everything before it sounds deliberate — even the notes that were not.',
          },
          {
            kind: 'text',
            md: 'So the target is the 1st, 3rd or 5th of whatever chord just arrived. Between downbeats, do what you like. An **approach note** — a step above or below your target, played just before it — makes the landing sound intentional.',
          },
          {
            kind: 'text',
            md: 'Two halves to this. The drill below waits for you at each chord, so it only asks **which** note is home. Then the backing loop plays in time and asks **when** — and that half is unscored, because rushing a landing to satisfy a computer is the opposite of the skill.',
          },
          {
            kind: 'playCheck',
            ask: 'The chord is **Am**. Play any note that is home in it.',
            notes: ['A', 'C', 'E'],
            count: 1,
            distinct: 'name',
            hint: 'Root, 3rd or 5th — any one of the three. There is no single right answer here, which is the point.',
          },
          {
            kind: 'playCheck',
            ask: 'Now an **approach note** into that A: play the key a half step below it, then the A itself.',
            notes: ['G#', 'A'],
            count: 2,
            distinct: 'name',
            hint: 'G♯ is not in the key at all — and it still sounds intentional, because it resolves.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's7.u3.g1',
        exercise: wait(
          'improv',
          {
            key: C,
            palette: 'chordtones',
            roman: ['I', 'V', 'vi', 'IV'],
            loops: 1,
            targetDownbeats: true,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's7.u3.q1',
        passScore: 0.75,
        // Scored on *which* note lands, not when: the app waits for you at each
        // chord. The timing half of the lesson is the create step below, played
        // against the backing loop, where nothing is scored at all.
        exercise: wait(
          'improv',
          {
            key: G,
            palette: 'chordtones',
            roman: ['I', 'vi', 'IV', 'V'],
            loops: 2,
            targetDownbeats: true,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'create',
        id: 's7.u3.c1',
        prompt:
          'Now put it in time. Start the backing and land a chord tone on the first beat of every bar — nothing else matters. Once that is automatic, fill the gaps between landings.',
        exercise: wait(
          'improv',
          { key: C, palette: 'chordtones', roman: ['I', 'V', 'vi', 'IV'], loops: 4 },
          'rh',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's7.u4',
    stageId: 's7',
    ordinal: 3,
    title: 'The blues form',
    strandWeights: { keys: 3, theory: 2, create: 1 },
    concepts: ['theory:blues12', 'scale:c:blues:rh', 'improv:blues', 'song:blue-monday-blues'],
    prerequisites: ['s7.u3'],
    minutes: 17,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's7.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The **12-bar blues** is the most-played form in the world, and it breaks the rules you just learned: every chord is a dominant 7th, including the I. In theory that should not work. In practice it is the sound of the last hundred years.',
          },
          {
            kind: 'progressionCard',
            roman: ['I7', 'IV7', 'I7', 'V7'],
            key: C,
            songRefs: ['Twelve-bar blues, rock and roll, jump, soul, most of early rock'],
          },
          {
            kind: 'text',
            md: 'The shape: four bars of I, two of IV, two of I, then V-IV-I-V to turn it around. And the **blues scale** — minor pentatonic plus the flat 5, the "blue note" — includes notes outside the accompanying chords. Listen to how those notes create tension, then return to a chord note.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'C blues scale: C E♭ F G♭ G B♭. The G♭ is the blue note.',
            demo: {
              bpm: 108,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 63, atBeat: 1, durBeats: 1 },
                { midi: 65, atBeat: 2, durBeats: 1 },
                { midi: 66, atBeat: 3, durBeats: 1 },
                { midi: 67, atBeat: 4, durBeats: 1 },
                { midi: 70, atBeat: 5, durBeats: 1 },
                { midi: 72, atBeat: 6, durBeats: 2 },
              ],
            },
          },
          {
            kind: 'playCheck',
            ask: 'Play the **blue note** of the C blues scale — the flat 5.',
            notes: ['Gb'],
            count: 1,
            distinct: 'octave',
            hint: 'Between F and G. It belongs to no chord in the progression, and that is exactly why it sounds like the blues.',
          },
          {
            kind: 'playCheck',
            ask: 'Play the three roots of the 12-bar form in C: **C, F, G**.',
            notes: ['C', 'F', 'G'],
            count: 3,
            distinct: 'name',
            hint: 'I, IV and V — the same three chords as Stage 1, all turned into dominant 7ths.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's7.u4.g1',
        exercise: wait(
          'scale-run',
          { tonic: 'C', scaleType: 'blues', hand: 'rh', direction: 'up' },
          'rh',
          'keys-lit',
        ),
      },
      {
        kind: 'ladder',
        id: 's7.u4.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'scale-run',
          { tonic: 'C', scaleType: 'blues', hand: 'rh', direction: 'updown' },
          88,
          'rh',
          'keys-lit',
        ),
      },
      {
        // The ladder above ramps the blues scale. Comping the twelve-bar form
        // with both hands is a separate skill, so it gets its own ramp.
        kind: 'ladder',
        id: 's7.u4.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'blue-monday-blues', style: 'boomchuck', voicing: 'shell17' },
          88,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's7.u4.q1',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'blue-monday-blues', style: 'boomchuck', voicing: 'shell17' },
          88,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'create',
        id: 's7.u4.c1',
        prompt:
          'Twelve bars, blues scale, left hand keeping the form. Play the same phrase three times with tiny changes — that repetition is what makes a blues chorus feel like a statement.',
        exercise: wait(
          'improv',
          { key: C, palette: 'blues', roman: BLUES_12, beatsPerChord: 4, loops: 1 },
          'rh',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's7.u5',
    stageId: 's7',
    ordinal: 4,
    title: 'Swing & feel',
    strandWeights: { keys: 3 },
    concepts: ['comp:swing'],
    prerequisites: ['s7.u4'],
    minutes: 16,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's7.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: '**Swing** is not a rhythm you write down — it is a ratio. Straight eighths divide a beat in half. Swung eighths hold the first one longer, roughly two-thirds to one-third, so the offbeat arrives late and leaning.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'The same four notes: straight, then swung. Nothing changed but the feel.',
            demo: {
              bpm: 92,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 0.5 },
                { midi: 64, atBeat: 0.5, durBeats: 0.5 },
                { midi: 67, atBeat: 1, durBeats: 0.5 },
                { midi: 64, atBeat: 1.5, durBeats: 0.5 },
                { midi: 60, atBeat: 3, durBeats: 0.67 },
                { midi: 64, atBeat: 3.67, durBeats: 0.33 },
                { midi: 67, atBeat: 4, durBeats: 0.67 },
                { midi: 64, atBeat: 4.67, durBeats: 0.33 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'The comping figure that goes with it: chord on beat 1, chord on the "and" of 3. Two stabs a bar, and the band swings.',
          },
          {
            kind: 'playCheck',
            ask: 'Count "one and two and" in triplets — long, short, long, short. Then play a **C** on the swung "and" of 1.',
            notes: ['C'],
            count: 1,
            distinct: 'octave',
            hint: 'Late and leaning, not evenly halfway. If it feels slightly behind, that is right.',
          },
          {
            kind: 'text',
            md: 'The scoring windows are the same as always here — swing is a placement, not an excuse. What changes is where the grid puts the offbeat.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's7.u5.g1',
        exercise: wait(
          'progression-play',
          { key: C, roman: ['ii7', 'V7', 'Imaj7'], loops: 1, voicing: 'shell17' },
          'both',
        ),
      },
      {
        kind: 'ladder',
        id: 's7.u5.l1',
        tempos: [0.75, 1],
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['ii7', 'V7', 'Imaj7'],
            beatsPerChord: 4,
            loops: 2,
            style: 'swing',
            voicing: 'shell17',
            swing: 0.667,
          },
          92,
          'both',
        ),
      },
      {
        // Red Clay Road is a new chart at the fastest tempo in the course. It
        // gets a full ramp from 60 rather than arriving at 100 cold.
        kind: 'ladder',
        id: 's7.u5.l2',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'red-clay-road', style: 'swing', voicing: 'shell17', swing: 0.667 },
          100,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'ladder',
        id: 's7.u5.l-blues',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'blue-monday-blues', style: 'swing', voicing: 'shell17', swing: 0.667 },
          88,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's7.u5.q1',
        passScore: 0.75,
        exercise: tempo(
          'chart-play',
          { songId: 'red-clay-road', style: 'swing', voicing: 'shell17', swing: 0.667 },
          100,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'create',
        id: 's7.u5.c1',
        prompt:
          'The backing plays straight — you swing against it. Two stabs a bar, left hand on the roots, and let the offbeat arrive late on purpose. Feel is a decision you make with your hands, not a setting.',
        exercise: wait(
          'improv',
          { key: C, palette: 'chordtones', roman: ['ii7', 'V7', 'Imaj7'], loops: 3, bpm: 92 },
          'both',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's7.u6',
    stageId: 's7',
    ordinal: 5,
    title: 'Find the key, find the song',
    strandWeights: { ear: 4 },
    concepts: ['ear:findkey', 'ear:prog:advanced'],
    prerequisites: ['s7.u5'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's7.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Working a song out by ear is a **procedure**, not a gift. Three steps, in order.',
          },
          {
            kind: 'text',
            md: '**1. Find the tonic.** Hum the note the song wants to end on, then hunt for it on the keyboard. **2. Follow the bass.** The bass often starts on the root, but inversions and moving bass lines can put another note there. **3. Name the quality.** Major, minor, or dominant — you have been drilling that since Stage 1.',
          },
          {
            kind: 'earCheck',
            question: 'Where does this want to end?',
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
              ],
            },
            options: ['On C', 'On F'],
            correctIndex: 0,
          },
          {
            kind: 'playCheck',
            ask: 'Step 1, by hand: that cadence wanted to land somewhere. Play the tonic it was pointing at.',
            notes: ['C'],
            count: 1,
            distinct: 'octave',
            hint: 'Hum the note the phrase wants next, then hunt for it. The hunting is the skill; the humming is the answer.',
          },
          {
            kind: 'playCheck',
            ask: 'Step 2: play the **bass notes** of a I–V–vi–IV in C — C, G, A, F.',
            notes: ['C', 'G', 'A', 'F'],
            count: 4,
            distinct: 'name',
            hint: 'Start with the bass, then check the chord quality. An inversion may put its third or fifth below the root.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's7.u6.g1',
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
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
        kind: 'graded',
        id: 's7.u6.q1',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['I', 'V', 'vi', 'IV'],
              ['I', 'vi', 'IV', 'V'],
              ['vi', 'IV', 'I', 'V'],
              ['ii7', 'V7', 'Imaj7'],
            ],
            count: 4,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'create',
        id: 's7.u6.c1',
        prompt:
          'Backing on, and this time work backwards: play only the bass notes, one per bar, until you can predict the next one before it arrives. Then add the chords. That order — bass first, chords after — is how the procedure actually feels in the wild.',
        exercise: wait(
          'improv',
          { key: C, palette: 'chordtones', roman: ['I', 'V', 'vi', 'IV'], loops: 3, bpm: 76 },
          'both',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's7.u7',
    stageId: 's7',
    ordinal: 6,
    title: 'Recover a chord progression',
    strandWeights: { ear: 4, keys: 1 },
    concepts: ['skill:transcribe'],
    prerequisites: ['s7.u6'],
    minutes: 14,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's7.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The real thing: a full chart, played once, recovered by ear. Use the procedure — tonic, bass, quality — and do not be proud about replaying it.',
          },
          {
            kind: 'text',
            md: 'You will get some wrong. That is fine and expected; the skill is the hunt, not a perfect score. Every wrong guess narrows the field.',
          },
          {
            kind: 'playCheck',
            ask: 'Warm the procedure up: play a **C**, then the note a fifth above it, then the note a fourth above it.',
            notes: ['C', 'G', 'F'],
            count: 3,
            distinct: 'name',
            hint: 'Up a fifth, up a fourth — the two bass moves you will hear most often. Learn their distance by feel before identifying the chord qualities.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's7.u7.g1',
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['I', 'V', 'vi', 'IV'],
              ['I', 'IV', 'V', 'I'],
              ['vi', 'IV', 'I', 'V'],
            ],
            count: 3,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's7.u7.q1',
        passScore: 0.7,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['I', 'V', 'vi', 'IV'],
              ['I', 'vi', 'IV', 'V'],
              ['vi', 'IV', 'I', 'V'],
              ['ii7', 'V7', 'Imaj7'],
              ['I', 'IV', 'V', 'I'],
            ],
            count: 5,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'create',
        id: 's7.u7.c1',
        prompt:
          'Put the tool down. Play the loop by ear with the backing muted in your head — start it, then stop listening and keep going alone. Playing on when the reference disappears is the last thing that separates transcribing from following.',
        exercise: wait(
          'improv',
          { key: C, palette: 'chordtones', roman: ['I', 'vi', 'IV', 'V'], loops: 3, bpm: 76 },
          'both',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's7.u8',
    stageId: 's7',
    ordinal: 7,
    title: 'Colours: add9, sus, 6',
    strandWeights: { theory: 2, keys: 2, create: 1 },
    concepts: ['voicing:colors', 'voicing:rootless-preview'],
    prerequisites: ['s7.u7'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's7.u8.e1',
        blocks: [
          {
            kind: 'text',
            md: 'These symbols change the notes in a chord. `sus4` replaces the 3rd with the 4th: Csus4 is C–F–G. `6` adds a 6th to a major triad: C6 is C–E–G–A. `add9` adds the 9th: Cadd9 is C–E–G–D.',
          },
          {
            kind: 'text',
            md: "And one look further down the road: **rootless voicings**. Once a bass player has the root, your left hand is free to play only 3rd, 7th and colour tones. That is where jazz piano goes next — Mark Levine's *The Jazz Piano Book* and PianoWithJonny are the usual next stops.",
          },
          {
            kind: 'playCheck',
            ask: 'Play **Csus4**, then resolve it: move the 4th down to the 3rd.',
            notes: ['F', 'E'],
            count: 2,
            distinct: 'name',
            hint: 'The F is the suspension and the E is the release. A sus chord is a promise; the resolution is keeping it.',
          },
          {
            kind: 'playCheck',
            ask: 'Now **C6** and **Cadd9** share the triad. Play the two notes that make them different: A, then D.',
            notes: ['A', 'D'],
            count: 2,
            distinct: 'name',
            hint: '6th and 9th. Neither one pulls anywhere — they just colour the chord you already had.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's7.u8.g1',
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'F', 'G', 'D', 'A'],
          qualities: ['sus4', '6', 'add9'],
          count: 8,
        }),
      },
      {
        kind: 'ladder',
        id: 's7.u8.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'flashcard',
          {
            kind: 'spell',
            roots: ['C', 'F', 'G', 'D', 'A', 'Bb'],
            qualities: ['sus4', '6', 'add9'],
            count: 8,
          },
          46,
        ),
      },
      {
        kind: 'graded',
        id: 's7.u8.q1',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb'],
          // No sus2: the unit teaches sus4, 6 and add9, and nothing on the path
          // ever teaches sus2.
          qualities: ['sus4', '6', 'add9', 'maj7'],
          count: 10,
        }),
      },
      {
        kind: 'create',
        id: 's7.u8.c1',
        prompt:
          'Take the loop and replace one chord with its sus4, then resolve it. Then end on an add9 instead of a plain triad. Small changes, and the difference between a chord that is correct and one that sounds like a record.',
        exercise: wait(
          'improv',
          { key: C, palette: 'chordtones', roman: ['I', 'vi', 'IV', 'V'], loops: 3, bpm: 76 },
          'both',
          'by-ear',
        ),
      },
    ],
  },
  {
    id: 's7.cp',
    stageId: 's7',
    ordinal: 8,
    title: 'Final: Your own voice',
    strandWeights: { keys: 3, ear: 3, create: 2 },
    concepts: [],
    prerequisites: ['s7.u8'],
    minutes: 18,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's7.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The last checkpoint. A blues chorus of your own, a chart nobody has played before, and a progression recovered by ear. Nothing new — just everything, at once.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's7.cp.q1',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'blue-monday-blues', style: 'swing', voicing: 'shell17', swing: 0.667 },
          88,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's7.cp.q2',
        passScore: 0.8,
        exercise: tempo(
          'unseen-chart',
          { form: 'aaba', sevenths: true, style: 'straight8', voicing: 'shell17' },
          72,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's7.cp.q3',
        passScore: 0.7,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['I', 'V', 'vi', 'IV'],
              ['I', 'vi', 'IV', 'V'],
              ['vi', 'IV', 'I', 'V'],
              ['ii7', 'V7', 'Imaj7'],
            ],
            count: 4,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's7.cp.q4',
        passScore: 0.75,
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['ii7', 'V7', 'Imaj7'],
            beatsPerChord: 4,
            loops: 2,
            style: 'swing',
            voicing: 'shell17',
            swing: 0.667,
          },
          92,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's7.cp.q5',
        passScore: 0.8,
        exercise: wait('flashcard', {
          kind: 'spell',
          roots: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb'],
          qualities: ['maj7', '7', 'm7', 'sus4', '6', 'add9'],
          count: 10,
        }),
      },
      {
        kind: 'create',
        id: 's7.cp.c1',
        prompt:
          'One blues chorus, twelve bars, your own. Left hand keeps the form, right hand says something. This one is recorded — you will want to hear it again in a year.',
        exercise: wait(
          'improv',
          { key: C, palette: 'blues', roman: BLUES_12, beatsPerChord: 4, loops: 1 },
          'rh',
          'by-ear',
        ),
      },
    ],
  },
];
