# Plan: what we take from Simple Piano

_Written 2026-10-06. Source: [foxzi/simplepiano](https://github.com/foxzi/simplepiano), Apache 2.0._

## Why

Simple Piano is a beginner course in the method-book order: keyboard, staff reading, rhythm,
scales, triads, hands together, pieces. Its practice tasks are short and are not graded.
Our path is stronger on harmony, ear training and improvisation.
Simple Piano is stronger on traditional reading and rhythm. Our audit (`content-audit.md`
§4.1, §5A, §5B, §5F) lists these same areas as open gaps.

We take its topics, its order and its teaching tips. We do not copy its text or code.
We write our own lessons, in English and French. The README credits the project.

## Rules for this work

- New lessons stay short. The user finds the full chain (demo, slow rep, 80 %, 100 %, create)
  too long and often skips it. Use a ladder only where a real hand movement needs a tempo ramp.
- Every lesson needs French text in `src/i18n/locales/fr.json`.
- Record each change in `docs/decisions.md` and `docs/implementation/06-curriculum-content.md`.
- Do not run `e2e/marathon.spec.ts`. Run the targeted spec for the thing that changed.

## Work, in order

Each part fits in about one session.

### Part 1 — Name and credit (done 2026-10-06)

1. Replace "Keysense" with "Open Piano Training" everywhere. This includes storage keys:
   the database, the sound cache, the backup format, the desktop URL scheme and the app id.
   There is one user, so the app does not move old data.
2. Credit Simple Piano in the README.

### Part 2 — Staff that shows rhythm (done 2026-10-06)

The staff (`src/ui/StaffSnippet.tsx`) draws only quarter notes. The reading lessons need more.

1. Draw half, whole, eighth and dotted notes, and rests, from a list of notes with durations.
2. Draw middle C on a ledger line in both clefs.
3. Give `readSnippet` an optional rhythm pool, so a generated phrase can mix note lengths.
4. Add an option that turns off the key highlights, for sight-reading.

### Part 3 — A reading course in the studio (done 2026-10-06)

Reading stays optional, as `decisions.md` (2026-09-02) says. But the optional part becomes a
real course in the studio, not only a drill switch in Settings. Lessons, in this order:

1. The staff and the treble clef: lines E G B D F, spaces F A C E, middle C below the staff.
2. Read with the right hand: short treble phrases near middle C.
3. The bass clef: lines G B D F A, spaces A C E G, middle C above the staff.
4. Read with the left hand.
5. Simple melodies from the staff, with real note lengths.
6. Sight-reading: a phrase never seen before, key highlights off. Tips: check the key and the
   time signature first, choose a slow tempo, never stop, keep your eyes one or two notes ahead.

The lessons use these traditional tunes. Their melodies are free everywhere. We write our own
arrangements.

- Ode to Joy (Beethoven)
- Twinkle, Twinkle, Little Star / Ah ! vous dirai-je, maman
- Au clair de la lune
- Frère Jacques

Each tune becomes a studio piece with melody data. This is a first step on §5F (real
repertoire). The staff draws the same notes the learner plays.

### Part 4 — Rhythm lessons the studio does not have yet (done 2026-10-07)

The studio already teaches the beat split in two, rests and ties, offbeats and three-beat time.
It does not teach these. Each becomes a short lesson in a Rhythm course (built as a course, like Read music, for the same flow):

1. Dotted rhythm: a dotted quarter and an eighth.
2. Syncopation: a note that starts on the second half of a beat and is held over the beat.
3. Pickup: a phrase that starts before the first full bar.

Each lesson starts with the same tip: clap the rhythm and count it aloud before you play it.

### Part 5 — Arpeggios on the path (done 2026-10-07)

An arpeggio is a chord played one note at a time. The path has broken left-hand patterns but no
arpeggio across an octave.

1. Add an arpeggio option to the `scaleRun` generator, or add a small generator. Choose after
   reading `scaleRun.ts`.
2. Add one unit to Stage 4, after s4.u5: C, F and G arpeggios, right hand 1-2-3-5, left hand
   5-4-2-1, hands separately. (Built as s4.u8. The bass-under-broken-chord texture stays in
   s4.u5 and s4.u7, which already teach it.)
3. One guided rep, one ladder, one graded take, one create step. No more.

### Part 6 — Teaching tips in existing lessons (done 2026-10-07)

Add these tips where they fit. Do not rewrite the lesson prose. (Built: the first two appear on the
result screen after a take with mistakes, the third in "Let the melody sing", and the fourth was
already in "Clear pedal changes".)

- Learn each hand alone at tempo, then both hands very slowly, in phrases of two to four bars.
- If a bar does not work, slow down to one note per second.
- Loudness comes from how fast the key goes down, not from how hard you press.
- Press the pedal just after the new chord, not before it.

## Not in this plan

- Grading dynamics from velocity. The app records velocity but does not score it. That is a
  separate decision.
- Scoring how even an arpeggio or a scale is. The MIDI log has the data, but this is engine work.
- Shorter rep chains on the existing path. The user finds them too long. This is a separate change.
