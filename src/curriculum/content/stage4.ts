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
const D = { tonic: 'D', mode: 'major' } as const;
const F = { tonic: 'F', mode: 'major' } as const;

export const stage4: Stage = {
  id: 's4',
  ordinal: 4,
  title: 'Smooth hands',
  tagline: 'Inversions & voice leading',
  summary:
    'Stop leaping between root positions. Inversions put every chord change under your hand, and voice leading — moving each finger as little as possible — is what makes chords sound like music.',
  unitIds: ['s4.u1', 's4.u2', 's4.u3', 's4.u4', 's4.u5', 's4.u6', 's4.u7', 's4.cp'],
};

export const stage4Units: Unit[] = [
  {
    id: 's4.u1',
    stageId: 's4',
    ordinal: 0,
    title: 'The same chord, three grips',
    strandWeights: { keys: 4, theory: 2, create: 1 },
    concepts: [
      'chord:c:maj:inv1',
      'chord:c:maj:inv2',
      'chord:f:maj:inv1',
      'chord:f:maj:inv2',
      'chord:g:maj:inv1',
      'chord:g:maj:inv2',
    ],
    prerequisites: ['s3.cp'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u1.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Any triad has three grips: root on the bottom, or **rotated** so the 3rd or the 5th sits lowest. Same notes, same chord — a different handful.',
          },
          {
            kind: 'keyboardDemo',
            caption: 'C major three ways: C-E-G, then E-G-C (1st inversion), then G-C-E (2nd).',
            demo: {
              bpm: 60,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 0, durBeats: 1 },
                { midi: 67, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 1, durBeats: 1 },
                { midi: 67, atBeat: 1, durBeats: 1 },
                { midi: 72, atBeat: 1, durBeats: 1 },
                { midi: 67, atBeat: 2, durBeats: 1 },
                { midi: 72, atBeat: 2, durBeats: 1 },
                { midi: 76, atBeat: 2, durBeats: 1 },
              ],
            },
          },
          {
            kind: 'text',
            md: 'Written as a **slash chord**: C/E means "C major, E in the bass". The letter before the slash is the chord; the letter after it is the note underneath.',
          },
          {
            kind: 'playCheck',
            ask: 'A chart says **C/E**. Play the note it wants in the bass.',
            notes: ['E'],
            count: 1,
            distinct: 'octave',
            hint: 'Not the root. The slash names the bottom note, and here it is the 3rd.',
          },
          {
            kind: 'playCheck',
            ask: 'Now **C/G** — play its bass note.',
            notes: ['G'],
            count: 1,
            distinct: 'octave',
            hint: 'The 5th on the bottom: second inversion.',
          },
          {
            kind: 'text',
            md: 'Why bother? Because the bass line becomes yours to write. C → C/E → F walks downstairs under a still harmony, and that walk is most of what makes an accompaniment sound arranged.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u1.g1',
        exercise: wait('grip-interleave', {
          roots: ['C'],
          qualities: ['maj'],
          inversions: [0, 1, 2],
          count: 6,
        }),
      },
      {
        kind: 'guided',
        id: 's4.u1.g2',
        exercise: wait('grip-interleave', {
          roots: ['C', 'F', 'G'],
          qualities: ['maj'],
          inversions: [0, 1, 2],
          count: 8,
        }),
      },
      {
        kind: 'ladder',
        id: 's4.u1.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'grip-interleave',
          { roots: ['C', 'F', 'G'], qualities: ['maj'], inversions: [0, 1, 2], count: 8 },
          54,
        ),
      },
      {
        kind: 'graded',
        id: 's4.u1.q1',
        passScore: 0.8,
        exercise: wait('grip-interleave', {
          roots: ['C', 'F', 'G'],
          qualities: ['maj'],
          inversions: [0, 1, 2],
          count: 12,
        }),
      },
      {
        kind: 'create',
        id: 's4.u1.c1',
        prompt:
          'Play along with the backing, but forbid yourself one thing: your right hand may not move more than a couple of keys between chords. That rule forces the inversions on you, and it is the entire lesson of this stage arriving early.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'IV', 'V', 'I'], loops: 3 }),
      },
    ],
  },
  {
    id: 's4.u2',
    stageId: 's4',
    ordinal: 1,
    title: 'The shortest way',
    strandWeights: { keys: 3, theory: 2, create: 1 },
    concepts: ['theory:voiceleading'],
    prerequisites: ['s4.u1'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u2.e1',
        blocks: [
          {
            kind: 'text',
            md: "The voice-leading law: **keep common tones, move the rest as little as possible.** I→IV in C isn't a leap to F — it's C staying put while E and G slide up one step each.",
          },
          {
            kind: 'keyboardDemo',
            caption: 'C to F the long way, then the short way. Hear the difference.',
            demo: {
              bpm: 70,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 0, durBeats: 1 },
                { midi: 67, atBeat: 0, durBeats: 1 },
                { midi: 65, atBeat: 1, durBeats: 1 },
                { midi: 69, atBeat: 1, durBeats: 1 },
                { midi: 72, atBeat: 1, durBeats: 1 },
                { midi: 60, atBeat: 2.5, durBeats: 1 },
                { midi: 64, atBeat: 2.5, durBeats: 1 },
                { midi: 67, atBeat: 2.5, durBeats: 1 },
                { midi: 60, atBeat: 3.5, durBeats: 1 },
                { midi: 65, atBeat: 3.5, durBeats: 1 },
                { midi: 69, atBeat: 3.5, durBeats: 1 },
              ],
            },
          },
          {
            kind: 'playCheck',
            ask: 'From C–E–G, take the short way to F: play **C, F, A**.',
            notes: ['C', 'F', 'A'],
            count: 3,
            distinct: 'name',
            hint: 'Keep the C. The other two fingers move up one white key each. Your hand barely notices.',
          },
          {
            kind: 'text',
            md: 'Now V. G major from that shape does not want to be G–B–D either: the nearest handful is **B–D–G**, which keeps your fingers where they already are.',
          },
          {
            kind: 'playCheck',
            ask: 'Play the nearest G chord: **B, D, G**.',
            notes: ['B', 'D', 'G'],
            count: 3,
            distinct: 'name',
            hint: 'From C–F–A: the C drops to B, the F drops to D, the A moves up to G. Small moves only.',
          },
          {
            kind: 'text',
            md: 'From here your take carries a **smoothness** score: how far your fingers travelled against the shortest path available. It is not a style points system — cheap motion is why a professional accompaniment sounds calm.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u2.g1',
        exercise: wait('progression-play', {
          key: C,
          roman: ['I', 'IV', 'V', 'I'],
          loops: 1,
          voiceLead: 'smooth',
        }),
      },
      {
        kind: 'guided',
        id: 's4.u2.g2',
        exercise: wait(
          'progression-play',
          { key: C, roman: ['I', 'IV', 'V', 'I'], loops: 1, voiceLead: 'smooth', style: 'rootchord' },
          'both',
        ),
      },
      {
        kind: 'ladder',
        id: 's4.u2.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 1, voiceLead: 'smooth' },
          60,
        ),
      },
      {
        kind: 'ladder',
        id: 's4.u2.l-smooth',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          {
            key: F,
            roman: ['I', 'IV', 'V', 'I'],
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
        id: 's4.u2.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'IV', 'V', 'I'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          60,
        ),
      },
      {
        kind: 'graded',
        id: 's4.u2.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: F,
            roman: ['I', 'IV', 'V', 'I'],
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
        kind: 'create',
        id: 's4.u2.c1',
        prompt:
          'One rule over the backing: no finger may jump more than two keys between chords. When a change feels impossible under that rule, you have found a chord that needs a different inversion — go and find it.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'IV', 'V', 'I'], loops: 3 }),
      },
    ],
  },
  {
    id: 's4.u3',
    stageId: 's4',
    ordinal: 2,
    title: 'Smooth pop',
    strandWeights: { keys: 4, create: 1 },
    concepts: ['prog-smooth:i-v-vi-iv:c', 'prog-smooth:i-v-vi-iv:g'],
    prerequisites: ['s4.u2'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u3.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The four-chord loop, minimum motion. Played smoothly, I–V–vi–IV stops sounding like four chords and starts sounding like one line moving.',
          },
          {
            kind: 'playCheck',
            ask: 'Smooth I→V in C: from C–E–G, play the nearest G chord — **B, D, G**.',
            notes: ['B', 'D', 'G'],
            count: 3,
            distinct: 'name',
            hint: 'G is a leap; B–D–G is next door. Same chord either way.',
          },
          {
            kind: 'playCheck',
            ask: 'Then vi, still nearby: play **A, C, E**.',
            notes: ['A', 'C', 'E'],
            count: 3,
            distinct: 'name',
            hint: 'Two of those notes were already under your fingers.',
          },
          {
            kind: 'text',
            md: 'Your score now includes a **smoothness** number alongside accuracy and timing: how far your fingers travelled compared to the shortest legal path.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u3.g1',
        exercise: wait('progression-play', {
          key: C,
          roman: ['I', 'V', 'vi', 'IV'],
          loops: 1,
          voiceLead: 'smooth',
        }),
      },
      {
        kind: 'ladder',
        id: 's4.u3.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'graded',
        id: 's4.u3.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'graded',
        id: 's4.u3.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: G, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'create',
        id: 's4.u3.c1',
        prompt:
          'Play the loop with the right hand alone, smoothly, and listen for the top notes on their own. That top line is a melody you did not write on purpose — most pop hooks are exactly this, noticed and kept.',
        exercise: play({ key: G, palette: 'chordtones', roman: ['I', 'V', 'vi', 'IV'], loops: 3 }),
      },
    ],
  },
  {
    id: 's4.u4',
    stageId: 's4',
    ordinal: 3,
    title: 'All grips, all keys (part 1)',
    strandWeights: { keys: 4, create: 1 },
    concepts: ['spell:triad:inversions'],
    prerequisites: ['s4.u3'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u4.e1',
        blocks: [
          {
            kind: 'text',
            md: 'Interleaved grips again — now with inversions in the deck, across the triads of C, G, D and F. Mixed on purpose: recall under mild pressure is what makes it permanent.',
          },
          {
            kind: 'playCheck',
            ask: 'Warm up the naming: **Dm/F** — play its bass note.',
            notes: ['F'],
            count: 1,
            distinct: 'octave',
            hint: 'D minor with its 3rd underneath. The slash always names the bottom.',
          },
          {
            kind: 'playCheck',
            ask: 'A minor, **second** inversion — play the note that ends up in the bass.',
            notes: ['E'],
            count: 1,
            distinct: 'octave',
            hint: 'Second inversion puts the 5th on the bottom. A–C–E, so the 5th is E.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u4.g1',
        exercise: wait('grip-interleave', {
          roots: ['C', 'D', 'G', 'A'],
          qualities: ['maj', 'min'],
          inversions: [0, 1],
          count: 8,
        }),
      },
      {
        kind: 'ladder',
        id: 's4.u4.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'grip-interleave',
          {
            roots: ['C', 'D', 'F', 'G', 'A'],
            qualities: ['maj', 'min'],
            inversions: [0, 1, 2],
            count: 10,
          },
          54,
        ),
      },
      {
        kind: 'graded',
        id: 's4.u4.q1',
        passScore: 0.8,
        exercise: tempo(
          'grip-interleave',
          {
            roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            qualities: ['maj', 'min'],
            inversions: [0, 1, 2],
            count: 16,
          },
          48, // 2 beats per grip at 48 BPM = 2.5s each
        ),
      },
      {
        kind: 'create',
        id: 's4.u4.c1',
        prompt:
          'Backing in D. Start the loop in root position, then play it again starting from a first inversion, then from a second. Three journeys, same four chords, and each one puts a different note on top.',
        exercise: play({ key: D, palette: 'chordtones', roman: ['I', 'vi', 'IV', 'V'], loops: 3 }),
      },
    ],
  },
  {
    id: 's4.u5',
    stageId: 's4',
    ordinal: 4,
    title: 'Left hand grows up',
    strandWeights: { keys: 4, create: 1 },
    concepts: ['pattern:lh:rootfifth', 'pattern:lh:broken'],
    prerequisites: ['s4.u4'],
    minutes: 16,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u5.e1',
        blocks: [
          {
            kind: 'text',
            md: "The left hand's real job isn't chords — it's **foundation**. The broken pattern *root · fifth · octave · fifth* outlines the harmony while the right hand does the talking.",
          },
          {
            kind: 'keyboardDemo',
            caption: 'C bar, LH broken pattern: C2 · G2 · C3 · G2.',
            demo: {
              bpm: 80,
              loop: true,
              events: [
                { midi: 36, atBeat: 0, durBeats: 1 },
                { midi: 43, atBeat: 1, durBeats: 1 },
                { midi: 48, atBeat: 2, durBeats: 1 },
                { midi: 43, atBeat: 3, durBeats: 1 },
              ],
            },
          },
          {
            kind: 'playCheck',
            ask: 'Left hand on a C bar: play the **fifth** the pattern keeps returning to.',
            notes: ['G'],
            count: 1,
            distinct: 'octave',
            hint: 'Five letters up from C. Little finger on the root, thumb on this.',
          },
          {
            kind: 'playCheck',
            ask: 'The bar changes to F. Play F and its fifth.',
            notes: ['F', 'C'],
            count: 2,
            distinct: 'name',
            hint: 'The shape does not change — the hand just moves. That is why this pattern is worth owning.',
          },
          {
            kind: 'text',
            md: 'Two hands doing different jobs at once is the hardest thing in this stage, and the ladder below exists for exactly that. Play the left hand alone until it is boring, then add the right.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u5.g1',
        exercise: wait(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], loops: 1, style: 'brokenLH' },
          'lh',
        ),
      },
      {
        kind: 'ladder',
        id: 's4.u5.l1',
        tempos: [0.5, 0.75, 1],
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 1, style: 'brokenLH' },
          80,
          'lh',
        ),
      },
      {
        // The left hand alone is ramped above; adding the right hand on top is
        // the new coordination, so it gets its own ramp before it is scored.
        kind: 'ladder',
        id: 's4.u5.l2',
        tempos: [0.5, 0.75, 1],
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 1,
            style: 'brokenLH',
            voiceLead: 'smooth',
          },
          72,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's4.u5.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 1,
            style: 'brokenLH',
            voiceLead: 'smooth',
          },
          72,
          'both',
        ),
      },
      {
        kind: 'create',
        id: 's4.u5.c1',
        prompt:
          'Left hand runs the pattern; right hand plays one note per bar and no more. One note is enough when the bass is moving — and holding back is a technique, not a limitation.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'V', 'vi', 'IV'], loops: 3 }),
      },
    ],
  },
  {
    id: 's4.u6',
    stageId: 's4',
    ordinal: 5,
    title: 'Cadences',
    strandWeights: { theory: 2, ear: 3, keys: 2, create: 1 },
    concepts: ['theory:cadence', 'ear:cadence'],
    prerequisites: ['s4.u5'],
    minutes: 12,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u6.e1',
        blocks: [
          {
            kind: 'text',
            md: 'A **cadence** is how a phrase ends. **Authentic** (V→I): the full stop. **Plagal** (IV→I): the soft amen. **Half** (…→V): a comma — the music stops mid-sentence, waiting.',
          },
          {
            kind: 'earCheck',
            question: 'Full stop or comma?',
            demo: {
              bpm: 76,
              loop: false,
              events: [
                { midi: 60, atBeat: 0, durBeats: 1 },
                { midi: 64, atBeat: 0, durBeats: 1 },
                { midi: 67, atBeat: 0, durBeats: 1 },
                { midi: 65, atBeat: 1, durBeats: 1 },
                { midi: 69, atBeat: 1, durBeats: 1 },
                { midi: 72, atBeat: 1, durBeats: 1 },
                { midi: 55, atBeat: 2, durBeats: 2 },
                { midi: 59, atBeat: 2, durBeats: 2 },
                { midi: 62, atBeat: 2, durBeats: 2 },
              ],
            },
            options: ['Full stop (lands home)', 'Comma (left hanging)'],
            correctIndex: 1,
          },
          {
            kind: 'playCheck',
            ask: 'Play the two bass notes of a **plagal** cadence in C: F, then C.',
            notes: ['F', 'C'],
            count: 2,
            distinct: 'name',
            hint: 'The amen ending. It settles without ever building tension first.',
          },
          {
            kind: 'playCheck',
            ask: 'And the **authentic** one: G, then C.',
            notes: ['G', 'C'],
            count: 2,
            distinct: 'name',
            hint: 'Down a fifth in the bass, and the leading tone resolving above it. This is the strong one.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u6.g1',
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['V', 'I'],
              ['IV', 'I'],
            ],
            count: 2,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'ladder',
        id: 's4.u6.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'IV', 'I', 'V', 'I'],
            beatsPerChord: 4,
            loops: 1,
            style: 'rootchord',
            voiceLead: 'smooth',
          },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's4.u6.q1',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['V', 'I'],
              ['IV', 'I'],
              ['I', 'V'],
            ],
            count: 3,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's4.u6.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: G,
            roman: ['I', 'IV', 'I', 'V', 'I'],
            beatsPerChord: 4,
            loops: 1,
            style: 'rootchord',
            voiceLead: 'smooth',
          },
          70,
          'both',
        ),
      },
      {
        kind: 'create',
        id: 's4.u6.c1',
        prompt:
          'Improvise a phrase and end it on the V — deliberately leave it hanging. Then play the same phrase again and land it on I. Ending badly on purpose teaches you more about cadences than ending well by accident.',
        exercise: play({ key: C, palette: 'chordtones', roman: ['I', 'IV', 'V', 'I'], loops: 3 }),
      },
    ],
  },
  {
    id: 's4.u7',
    stageId: 's4',
    ordinal: 6,
    title: 'Song lab: texture',
    strandWeights: { keys: 4, create: 2 },
    concepts: ['song:northline:texture'],
    prerequisites: ['s4.u6'],
    minutes: 13,
    kind: 'lesson',
    steps: [
      {
        kind: 'explain',
        id: 's4.u7.e1',
        blocks: [
          {
            kind: 'text',
            md: '**Northline** again — but grown up: left hand plays the broken pattern, right hand takes the smoothest grip of each chord. Same chart, twice the music.',
          },
          {
            kind: 'playCheck',
            ask: 'The song is in G. On the I bar, play the two notes your left hand lives on: **G** and its fifth.',
            notes: ['G', 'D'],
            count: 2,
            distinct: 'name',
            hint: 'Root and fifth. The pattern rocks between them and adds the octave on beat 3.',
          },
          {
            kind: 'playCheck',
            ask: 'The vi bar is E minor. Play **E** and its fifth.',
            notes: ['E', 'B'],
            count: 2,
            distinct: 'name',
            hint: 'Root and fifth again — the pattern never cares whether the chord is major or minor.',
          },
        ],
      },
      {
        kind: 'guided',
        id: 's4.u7.g1',
        exercise: wait(
          'chart-play',
          { songId: 'northline', style: 'brokenLH', voiceLead: 'smooth' },
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'ladder',
        id: 's4.u7.l1',
        tempos: [0.6, 0.8, 1],
        exercise: tempo(
          'chart-play',
          { songId: 'northline', style: 'brokenLH', voiceLead: 'smooth' },
          80,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'graded',
        id: 's4.u7.q1',
        passScore: 0.8,
        exercise: tempo(
          'chart-play',
          { songId: 'northline', style: 'brokenLH', voiceLead: 'smooth' },
          80,
          'both',
          'lead-sheet',
        ),
      },
      {
        kind: 'create',
        id: 's4.u7.c1',
        prompt:
          "Paper Sun's loop, and no texture handed to you. Invent the left hand: straight roots, root-fifth pulses, a broken shape of your own. Play each for a full loop before choosing — the groove decides, not the theory.",
        exercise: play({ key: F, palette: 'chordtones', roman: ['I', 'vi', 'ii', 'V'], loops: 3, bpm: 84 }),
      },
    ],
  },
  {
    id: 's4.cp',
    stageId: 's4',
    ordinal: 7,
    title: 'Checkpoint: Smooth hands',
    strandWeights: { keys: 4, ear: 1 },
    concepts: [],
    prerequisites: ['s4.u7'],
    minutes: 13,
    kind: 'checkpoint',
    steps: [
      {
        kind: 'explain',
        id: 's4.cp.e1',
        blocks: [
          {
            kind: 'text',
            md: 'The smooth-hands test: voice-led progressions in two keys, inversion recall at speed, cadences by ear, and a full-texture take with both hands. Five takes, no hints.',
          },
        ],
      },
      {
        kind: 'graded',
        id: 's4.cp.q1',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          { key: C, roman: ['I', 'V', 'vi', 'IV'], beatsPerChord: 4, loops: 2, voiceLead: 'smooth' },
          76,
        ),
      },
      {
        kind: 'graded',
        id: 's4.cp.q2',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: G,
            roman: ['I', 'vi', 'IV', 'V'],
            beatsPerChord: 4,
            loops: 2,
            voiceLead: 'smooth',
            style: 'rootchord',
          },
          70,
          'both',
        ),
      },
      {
        kind: 'graded',
        id: 's4.cp.q3',
        passScore: 0.8,
        exercise: tempo(
          'grip-interleave',
          {
            roots: ['C', 'D', 'F', 'G', 'A'],
            qualities: ['maj', 'min'],
            inversions: [0, 1, 2],
            count: 12,
          },
          48,
        ),
      },
      {
        kind: 'graded',
        id: 's4.cp.q4',
        passScore: 0.75,
        exercise: wait(
          'ear-progression',
          {
            key: C,
            pool: [
              ['V', 'I'],
              ['IV', 'I'],
              ['I', 'V'],
            ],
            count: 3,
          },
          'rh',
          'by-ear',
        ),
      },
      {
        kind: 'graded',
        id: 's4.cp.q5',
        passScore: 0.8,
        exercise: tempo(
          'progression-play',
          {
            key: C,
            roman: ['I', 'V', 'vi', 'IV'],
            beatsPerChord: 4,
            loops: 1,
            style: 'brokenLH',
            voiceLead: 'smooth',
          },
          72,
          'both',
        ),
      },
    ],
  },
];
