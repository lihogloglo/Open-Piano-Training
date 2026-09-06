import { z } from 'zod';

export const playedNoteSchema = z.object({
  midi: z.number().int().min(21).max(108),
  atBeat: z.number().nonnegative(),
  durBeats: z.number().positive(),
  hand: z.enum(['rh', 'lh']),
  finger: z.number().int().min(1).max(5).optional(),
  velocity: z.number().min(0).max(1).default(0.7),
});
export type PlayedNote = z.infer<typeof playedNoteSchema>;
export const musicStudySchema = z.object({
  id: z.string(),
  title: z.string(),
  stage: z.number().int().min(0).max(7),
  kind: z.enum(['lesson', 'piece']),
  bpm: z.number().min(40).max(160),
  beatsPerBar: z.number().int().min(2).max(6),
  bars: z.number().int().positive(),
  instruction: z.string(),
  selfChecks: z.array(z.string()).min(1),
  notes: z.array(playedNoteSchema).min(1),
  bass: z.array(playedNoteSchema).default([]),
  chords: z.array(playedNoteSchema).default([]),
  movementGuide: z.boolean().default(false),
  examples: z.array(z.array(playedNoteSchema).min(1)).default([]),
  ear: z.boolean().default(false),
  transpose: z.array(z.number().int()).default([0]),
});
export type MusicStudy = z.infer<typeof musicStudySchema>;
const note = (
  midi: number,
  atBeat: number,
  durBeats = 0.85,
  hand: 'rh' | 'lh' = 'rh',
  finger?: number,
): PlayedNote => ({
  midi,
  atBeat,
  durBeats,
  hand,
  velocity: hand === 'lh' ? 0.45 : 0.75,
  ...(finger ? { finger } : {}),
});
const line = (midis: number[], spacing = 1, hand: 'rh' | 'lh' = 'rh'): PlayedNote[] =>
  midis.map((m, i) => note(m, i * spacing, spacing * 0.85, hand));
const lesson = (
  id: string,
  title: string,
  stage: number,
  instruction: string,
  selfChecks: string[],
  notes: PlayedNote[],
  opts: Partial<MusicStudy> = {},
): MusicStudy =>
  musicStudySchema.parse({
    id,
    title,
    stage,
    kind: 'lesson',
    bpm: 60,
    beatsPerBar: 4,
    bars: 4,
    instruction,
    selfChecks,
    notes,
    ...opts,
  });

export const MUSIC_LESSONS: MusicStudy[] = [
  lesson(
    'balanced-touch',
    'A balanced seat and an easy touch',
    0,
    'Sit near the front of the bench with your feet supported. Let your elbows rest slightly in front of your body. Curve your fingers naturally. Watch the demonstration: one finger presses, then releases before the next note. Try each hand. MIDI hears notes, not your posture or finger choice.',
    [
      'My shoulders remain easy while I play.',
      'I can release each key without holding the rest of my hand rigid.',
    ],
    [
      note(60, 0, 0.7, 'rh', 1),
      note(62, 2, 0.7, 'rh', 2),
      note(64, 4, 0.7, 'rh', 3),
      note(48, 8, 0.7, 'lh', 5),
      note(50, 10, 0.7, 'lh', 4),
      note(52, 12, 0.7, 'lh', 3),
    ],
    { movementGuide: true },
  ),
  lesson(
    'pulse-subdivision',
    'One beat, then two equal parts',
    0,
    'The pulse is the steady beat. First say 1, 2, 3, 4 with the clicks. A subdivision divides a beat into smaller parts. Say 1-and, 2-and, 3-and, 4-and. The first two bars use one note per beat. The next two use two equal notes per beat. Keep the click speed unchanged.',
    ['I count the same pulse through both note speeds.'],
    [
      ...line(Array(8).fill(60)),
      ...line(Array(16).fill(60), 0.5).map((n) => ({ ...n, atBeat: n.atBeat + 8 })),
    ],
  ),
  lesson(
    'rests-ties',
    'Silence and held notes',
    0,
    'A rest is measured silence. Keep counting while you release the key. A tie joins two written notes of the same pitch into one held sound: do not press again at the join. Hear four beats: play, rest, hold through beats 3 and 4. Repeat it. The beat display shows how long each sound lasts. The score checks note starts. Listen and check the releases yourself.',
    ['I release for the silent beats.', 'I hold the long note through the next beat without pressing again.'],
    [0, 4, 8, 12].flatMap((b) => [note(60, b, 0.7), note(60, b + 2, 1.9)]),
  ),
  lesson(
    'alternating-hands',
    'Two hands taking turns',
    0,
    'Place your left little finger on C3 and your right thumb on C4. Alternate left, right, left, right for two bars. Then let both hands begin together. Move only as much as the next note needs. Practice each hand first if the change feels difficult.',
    ['I can keep counting when the hands change.', 'Both hands begin together in the second half.'],
    [
      ...line([48, 60, 48, 60, 48, 60, 48, 60]).map((n) => ({
        ...n,
        hand: n.midi < 60 ? ('lh' as const) : ('rh' as const),
      })),
      ...[8, 10, 12, 14].flatMap((b) => [note(48, b, 1.7, 'lh', 5), note(60, b, 1.7, 'rh', 1)]),
    ],
  ),
  lesson(
    'connected-detached',
    'Connected notes and light endings',
    1,
    'Legato means connected: release a note as the next begins. Staccato means detached: release early and leave a small silence. Hear the same five-note shape connected, then detached. A phrase is a musical sentence. Let its final note settle, then lift before the next sentence. MIDI scoring here checks starts, so compare your releases with the demonstration.',
    [
      'The connected version has no unintended gaps.',
      'The detached version has clear silence without a forced wrist movement.',
    ],
    [
      ...line([60, 62, 64, 65, 67, 65, 64, 60]).map((n) => ({ ...n, durBeats: 1 })),
      ...line([60, 62, 64, 65, 67, 65, 64, 60]).map((n) => ({ ...n, atBeat: n.atBeat + 8, durBeats: 0.35 })),
    ],
    { movementGuide: true },
  ),
  lesson(
    'thumb-movement',
    'A small thumb movement',
    1,
    'For the right-hand C scale, use fingers 1, 2, 3, then move the thumb to F for 1, 2, 3, 4, 5. Move the hand sideways with the thumb. Keep the wrist comfortable instead of twisting to reach. The demonstration shows the finger change. Return slowly. Try the left hand separately in the main scale lesson.',
    [
      'My hand follows the thumb instead of twisting.',
      'The notes before and after the thumb change sound even.',
    ],
    [60, 62, 64, 65, 67, 69, 71, 72].map((m, i) => note(m, i * 2, 1.8, 'rh', [1, 2, 3, 1, 2, 3, 4, 5][i])),
    { movementGuide: true },
  ),
  lesson(
    'sustained-bass',
    'A moving melody above a held bass',
    1,
    'Hold C3 with the left little finger while the right hand plays C, D, E, G. Release the bass at the next bar and repeat. Learn each hand first, then join them. The left hand has one job while the right hand moves. Listen for a continuous low note.',
    ['The bass stays down while the melody changes.', 'I can hear the melody above the bass.'],
    [0, 4, 8, 12].flatMap((b) => [
      note(48, b, 3.9, 'lh', 5),
      ...[60, 62, 64, 67].map((m, i) => note(m, b + i, 0.9, 'rh', [1, 2, 3, 5][i])),
    ]),
  ),
  lesson(
    'three-beat-meter',
    'A gentle three-beat dance',
    2,
    'Meter groups beats into bars. In 3/4, count 1, 2, 3, with a gentle emphasis on 1. The left hand begins each bar. The right hand answers on beats 2 and 3. Hear four complete bars before playing.',
    ['I count three beats in every bar.', 'The first beat feels clear without a hard accent.'],
    [0, 3, 6, 9].flatMap((b) => [note(48, b, 2.8, 'lh'), note(64, b + 1), note(67, b + 2)]),
    { beatsPerBar: 3 },
  ),
  lesson(
    'offbeats',
    'Keep the pulse through offbeats',
    2,
    'An offbeat falls between the main beats. Count 1-and, 2-and, 3-and, 4-and. The low C lands on the numbers. The high C lands on and. Practice the right hand alone while saying every number. Then add the left hand. Silence on a number does not stop the count.',
    ['I can say the numbers while playing only on and.', 'The two hands alternate at equal distances.'],
    Array.from({ length: 16 }, (_, i) => [note(48, i, 0.4, 'lh'), note(60, i + 0.5, 0.4)]).flat(),
  ),
  lesson(
    'rhythm-echo',
    'Listen and repeat a rhythm',
    2,
    'Listen before touching a key. Clap the rhythm once, then reproduce it on C4 after the count-in. Count the silent spaces too. Choose Another example to hear a different pattern in a different register. Listen again instead of repeating the previous answer.',
    ['I can clap the pattern before I play.', 'I keep counting through silence.'],
    [0, 1, 1.5, 3, 4, 6, 7, 7.5].map((b) => note(60, b, 0.3)),
    {
      bars: 2,
      ear: true,
      transpose: [0, 12],
      examples: [
        [0, 1, 1.5, 3, 4, 6, 7, 7.5],
        [0, 0.5, 2, 3, 4, 4.5, 5, 7],
        [0, 2, 2.5, 3, 5, 6, 6.5, 7],
      ].map((beats) => beats.map((b) => note(60, b, 0.3))),
    },
  ),
  lesson(
    'melody-balance',
    'Let the melody sing',
    3,
    'Dynamics describe loud and soft playing. Hear the upper melody above a quiet bass. Practice the right hand with a clear sound. Add the left hand softly. Then reverse the balance to hear the difference. A phrase can grow toward its middle and relax at its end. The app records velocity but does not grade your dynamics.',
    [
      'The melody remains easy to hear with my eyes closed.',
      'My phrase has a direction and a relaxed ending.',
    ],
    [0, 4, 8, 12].flatMap((b) => [
      note(48, b, 3.7, 'lh'),
      ...[60, 64, 67, 64].map((m, i) => ({ ...note(m, b + i), velocity: [0.6, 0.72, 0.85, 0.6][i]! })),
    ]),
  ),
  lesson(
    'pedal-changes',
    'Clear pedal changes',
    4,
    'The sustain pedal lets released notes continue sounding. First play these chords without pedal. Then press the pedal after a chord begins. At the next chord, release the pedal and press it again just after the new sound begins. Listen for a clean change. The screen shows pedal down, but your ears judge whether the old harmony cleared.',
    [
      'I can hear each new chord without the previous harmony blurring it.',
      'I can play the phrase without pedal too.',
    ],
    [0, 4, 8, 12].flatMap((b, i) => (i % 2 ? [53, 57, 60] : [48, 52, 55]).map((m) => note(m, b, 3.5, 'lh'))),
  ),
  lesson(
    'melody-echo',
    'Listen, sing, then play',
    3,
    'Listen to the short melody. Sing it back before searching on the keyboard. Find the first note, then follow whether each note rises, falls, or repeats. Play the complete phrase after the count-in. Another example changes its melodic shape and register. The reveal button is practice help, not an independent performance.',
    ['I sing the whole phrase before playing.', 'I can repeat it after a short pause.'],
    [note(60, 0), note(62, 1), note(64, 2, 1.7), note(67, 4), note(64, 5), note(60, 6, 1.8)],
    {
      bars: 2,
      ear: true,
      transpose: [0, 7, 12],
      examples: [
        [60, 62, 64, 67, 64, 60],
        [60, 64, 62, 65, 62, 60],
        [64, 62, 60, 67, 62, 60],
      ].map((midis) => midis.map((m, i) => note(m, [0, 1, 2, 4, 5, 6][i]!, i === 2 || i === 5 ? 1.7 : 0.85))),
    },
  ),
  lesson(
    'phrase-transcription',
    'Recover a melody and its rhythm',
    7,
    'Listen to this complete four-bar miniature. Recover one bar at a time by ear. Find its first note, then its rhythm and melodic direction. Write the note names and counts on paper if useful. Join the bars and play the complete phrase. Choose Another example for a changed melody in a new key. Reveal the phrase only after your own attempt.',
    [
      'My written or remembered version includes the silent spaces and long notes.',
      'I can play the whole phrase from memory on another day.',
    ],
    [
      note(60, 0),
      note(64, 1, 0.4),
      note(62, 1.5, 0.4),
      note(67, 3),
      note(65, 4, 1.8),
      note(64, 6),
      note(62, 7),
      note(64, 8),
      note(67, 9),
      note(72, 10, 1.8),
      note(67, 12),
      note(62, 13),
      note(60, 14, 1.9),
    ],
    {
      ear: true,
      transpose: [0, 2, 5, 7],
      examples: [
        [60, 64, 62, 67, 65, 64, 62, 64, 67, 72, 67, 62, 60],
        [64, 62, 60, 67, 64, 65, 62, 60, 64, 67, 65, 62, 60],
      ].map((midis) =>
        midis.map((m, i) =>
          note(
            m,
            [0, 1, 1.5, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14][i]!,
            [1, 2].includes(i) ? 0.4 : [4, 9, 12].includes(i) ? 1.8 : 0.85,
          ),
        ),
      ),
    },
  ),
];

/** Original eight-bar miniatures. Each has a complete ending and three accompaniment levels. */
function piece(
  id: string,
  title: string,
  stage: number,
  melody: number[][],
  roots: number[],
  meter = 4,
): MusicStudy {
  const notes = melody.flatMap((bar, b) =>
    bar.map((m, i) =>
      note(
        m,
        b * meter + i * (meter / bar.length),
        (meter / bar.length) * 0.92,
        'rh',
        ({ 60: 1, 62: 2, 64: 3, 65: 4, 67: 5 } as Record<number, number>)[m],
      ),
    ),
  );
  const bass = roots.map((m, b) => note(m, b * meter, meter * 0.9, 'lh', 5));
  const chords = roots.flatMap((m, b) =>
    [m - 12, m - 8, m - 5].map((n, i) => note(n, b * meter, meter * 0.9, 'lh', [5, 3, 1][i])),
  );
  return musicStudySchema.parse({
    id,
    title,
    stage,
    kind: 'piece',
    bpm: 64,
    beatsPerBar: meter,
    bars: 8,
    notes,
    bass,
    chords,
    instruction:
      'An original complete miniature. Hear the whole piece first. Learn two bars at a time with the melody alone. Add bass notes, then chords when those shapes feel familiar. Use separate hands before joining them. Finish with a performance from memory.',
    selfChecks: [
      'I can play the final phrase without stopping.',
      'I can hear the melody above the accompaniment.',
      'I leave a small breath between phrases.',
    ],
  });
}
export const PIECES: MusicStudy[] = [
  piece(
    'morning-steps',
    'Morning Steps',
    0,
    [[60, 62, 64, 67], [64, 62], [60, 64, 67, 64], [62], [65, 64, 62, 60], [62, 64, 67, 65], [64, 62], [60]],
    [48, 48, 48, 55, 53, 55, 55, 48],
  ),
  piece(
    'little-lantern',
    'Little Lantern',
    1,
    [[64, 67, 64], [62, 64, 62], [60, 64, 67], [67], [65, 64, 62], [64, 62, 60], [62, 64, 62], [60]],
    [48, 55, 48, 48, 53, 48, 55, 48],
    3,
  ),
  piece(
    'homeward',
    'Homeward',
    2,
    [
      [60, 64, 67, 64],
      [65, 64, 62, 60],
      [62, 67, 65, 62],
      [64],
      [65, 67, 65, 64],
      [62, 64, 62, 60],
      [62, 65, 64, 62],
      [60],
    ],
    [48, 53, 55, 48, 53, 48, 55, 48],
  ),
];
export const MUSIC_STUDIES = [...MUSIC_LESSONS, ...PIECES];
