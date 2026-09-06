# Keysense improvement tracker

Opened: 2026-09-06. Source: the app review and the user's request to implement all recommendations.

This document tracks the full scope. A checked item needs implementation and verification evidence.
Human observations remain open until someone performs them. Automated checks do not replace piano teaching or hardware trials.

## Baseline

- 68 units, 345 exercise instances, and 879 estimated lesson minutes.
- Lint, types, 36 contrast checks, and 300 unit tests passed during the review.
- Note searching in the first assessment earned 90% despite 66 incorrect presses.
- A 10-minute plan could contain a 19-minute lesson.
- Existing local changes predate this work and must remain intact.

## Assessment and feedback

- [x] A1. Prevent wrong-note searching from producing a passing assessment. Keep guided practice forgiving.
- [x] A2. Record first-answer accuracy, response time, hints, tempo, hand, and assistance level.
- [x] A3. A slower practice attempt must not satisfy the original tempo assessment.
- [x] A4. Give specific feedback and an actionable retry exercise from note and timing judgments.
- [x] A5. Separate completion, independent performance, and retained performance across different days.
- [x] A6. Fade illuminated keys for assessment. Use unfamiliar examples to check transfer.
- [x] A7. Schedule the exact failed task after a learner chooses extra review.

## Curriculum and repertoire

- [x] C1. Teach physical technique through demonstrations and self-checks. Explain MIDI's observation limits.
- [x] C2. Add a rhythm sequence covering pulse, subdivisions, rests, ties, offbeats, and meter.
- [x] C3. Teach alternating hands, simultaneous notes, sustained bass with melody, and independent rhythms.
- [x] C4. Teach articulation, phrasing, dynamics, balance, and pedal through listening and imitation.
- [x] C5. Add melodic and rhythmic imitation and phrase transcription with varied examples.
- [x] C6. Replace overclaims and unsupported percentages in lesson prose. Align titles with tasks.
- [x] C7. Add complete beginner pieces with timed melody, accompaniment, fingering, and demonstrations.
- [x] C8. Offer progressive arrangements, separate hands, phrase loops, adjustable tempo, and unaided performance.
- [x] C9. Connect repertoire to lesson outcomes and show musical achievements in Progress.
- [x] C10. Vary daily creative work using learned skills, recent difficulties, and preferences.
- [x] C11. Enforce rehearsal order in curriculum checks and repair violations.
- [ ] C12. Piano teacher reviews the expanded content. HUMAN CHECK.

## Interface and practice continuity

- [x] U1. Send pointer, computer-keyboard, and MIDI notes through the same input path.
- [x] U2. Display all required registers and clear octave labels.
- [x] U3. Reveal one teaching action at a time, with an explicit browsing option.
- [x] U4. Add a larger practice display for use at piano distance.
- [x] U5. Show the active fallback input, mapping, and octave without a persistent failure message.
- [x] U6. Remove obsolete Stage 5 construction copy.
- [x] U7. Save lesson step, tempo ladder, and assessment state. Resume after reload or leaving.
- [x] U8. Fit sessions to the selected time budget through resumable lesson sections.
- [x] U9. Measure active practice time and exclude idle or hidden time.

## Reliability

- [x] T1. Preserve reading history when the reading strand is disabled.
- [x] T2. Export and restore actual preferences, including calibration.
- [x] T3. Validate imports before replacing data, including table shape and references.
- [x] T4. Validate Electron origins and filesystem containment.
- [x] T5. Test disconnect, reconnect, sustain, repeated notes, focus loss, and audio interruption where automation can help.
- [ ] T6. Verify real MIDI input, timing feel, audible offline playback, and pedal on physical hardware. HUMAN CHECK.
- [ ] T7. Observe beginners at a real piano and revise the sequence from recorded difficulties. HUMAN CHECK.

## Verification and decisions

Software changes are implemented. The three human checks above remain open.
The existing theory, generator, matcher, progress, and screen boundaries remain in use.
The historical audit in `content-audit.md` remains unchanged.

### Evidence

| Scope     | Implementation                                                                                                                                         | Verification                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1-A4     | Error penalties apply to normal and smooth-chord scoring. First-answer results, response times, diagnostics, and focused retries are recorded.         | Engine tests include wrong-note recovery, searching, and smooth-chord penalties. Browser tests prove focused and slower passes cannot complete the full assessment. |
| A5-A6, C9 | Progress separates completed lessons/self-checks from independent and retained takes. Conditions include tempo, hand, phrase, and arrangement.         | Tests require matching conditions on separate dates. Browser tests save a piece performance and display its achievement.                                            |
| A7, U7    | Saved lesson steps include ladder successes and assessment outcomes. Extra review stores the original graded exercise.                                 | Backup round-trip and retest tests pass. Browser tests restore a failed assessment and focused-practice results after reload.                                       |
| C1-C5     | Fourteen practical lessons add movement guidance, rhythm, coordination, expression, pedal, and ear imitation.                                          | Zod validates the data. Timeline tests generate every arrangement. Listening examples vary rhythm or melodic shape, as well as register.                            |
| C6, C11   | Stage 7 describes chord recovery accurately. The rehearsal lint checks earlier steps only, including checkpoints.                                      | All chronological checks pass. Ten previously hidden rehearsal violations were repaired.                                                                            |
| C7-C8     | Three original eight-bar pieces have timed melodies, bass and chord arrangements, finger suggestions, demos, phrase repeats, and memory performance.   | Timeline checks and the piece browser test pass. Chord accompaniments stay below the melody register.                                                               |
| C10, U8   | Daily plans select learned create tasks and recent weak skills. Lesson sections reserve time for review and creation.                                  | Tests cover all 68 lessons at four budgets and rotation among learned tasks.                                                                                        |
| U1-U6     | One input path supports MIDI, pointer, and computer keys. Required notes remain visible. Explanations progress one action at a time.                   | Browser tests cover input, browsing, low left-hand notes, and fallback mode. Visual checks used 1366 by 768 with larger display enabled.                            |
| U9        | Practice time comes from engaged, focused screen time. Authored estimates no longer add minutes.                                                       | Concurrent time-update tests pass. Hidden or unfocused windows stop counting. Activity expires after 60 seconds without input.                                      |
| T1-T3     | Reading history remains stored when disabled. Backups include real preferences and validate table rows, references, saved exercises, and resume state. | Tests cover reading retention, preferences/calibration round-trip, and rejection without data replacement.                                                          |
| T4-T5     | Desktop origins use parsed URLs and contained paths. Input loss releases held notes and sustain. Pending audio starts can be cancelled.                | Two desktop tests plus MIDI lifecycle and browser focus/abort checks pass.                                                                                          |

The main curriculum now contains 68 units, 421 steps, 348 exercise instances, and 64 tempo ladders.
Its authored estimate remains 879 minutes. The practical studio adds 14 lessons and three complete pieces.

The unit suite has 258 tests. Its count changed because 59 per-unit rehearsal checks became one chronological traversal.
The traversal covers checkpoints and prevents later lessons from satisfying earlier prerequisites.

### Final checks

- `npm run check`: lint, TypeScript, 36 contrast pairs, and 258 unit tests.
- `node --test electron/security.test.cjs`: two desktop security checks.
- `e2e/improvements.spec.ts`: seven input, resume, grading, and studio checks.
- Targeted `e2e/a11y.spec.ts`: seven checks for Studio, Path, Songs, Progress, Settings, and the lesson player.
- `e2e/offline.spec.ts`: the built app caches all 226 piano samples and completes a demonstration after an offline reload.
- `npm run build` and `npm run check:bundle`: production build and about 320 kB of a 450 kB eager bundle budget.

The full browser suite and whole-path marathon were not run. `CLAUDE.md` reserves those runs for an explicit request.

### Interpretation and limits

- Independent means an assessment passed without illuminated keys or automatic hints. A note-name or chord-symbol prompt can still be the tested task.
- Retained means that matching conditions passed on different local calendar dates. It is evidence from those takes, not a claim of general mastery.
- A phrase achievement does not imply a whole-piece achievement. Progress displays the phrase and arrangement.
- Rhythm scores check note starts. Duration, articulation, balance, physical movement, and pedal clarity use self-checks.
- Scores and MIDI input cannot determine which finger a learner used. The movement drawing is a schematic observation aid.
- Daily minutes are estimates for planning. A learner can need more time on one step. Active-time records measure actual engagement separately.
- The browser can cache the complete 226-file piano. Listening quality and timing feel still require physical checks.
- Existing takes retain their historical scores. New assessment rules apply to new takes.

### Human checks and closure criteria

C12: Piano teacher review.

1. Review every practical lesson and all three piece arrangements on a piano.
2. Check finger suggestions, hand crossings, reach, movement advice, rhythms, and phrase endings.
3. Record the study ID, problem, proposed correction, reviewer, and date here.
4. Close C12 after all required corrections pass a second review.

T6: Hardware and sound review.

1. Use a physical MIDI keyboard with a sustain pedal. Record the device, OS, app build, and audio output.
2. Play repeated notes, rolled chords, low left-hand notes, and both-hand phrases.
3. Disconnect while holding notes and pedal. Reconnect and confirm that notes work without stuck sound.
4. Compare early and late judgments with how the playing feels. Run calibration if needed.
5. Load the piano, disconnect the network, reload, and listen to a complete demonstration.
6. Test the packaged desktop app with no network. Close T6 after audible playback, pedal release, and timing feel pass.

T7: Beginner observation.

1. Observe at least three beginners using Stage 0 and Morning Steps at a real piano.
2. Record unexplained terms, repeated mistakes, missed controls, reading distance, and actual lesson time.
3. Ask each learner to repeat a phrase without the screen, then on another day.
4. Revise the identified problems and repeat the affected tasks before closing T7.

No teacher review, physical-hardware trial, or beginner observation was performed by this automated pass.
No installer was published.

Reference: [RCM curriculum](https://www.rcmusic.com/learning/about-the-royal-conservatory-certificate-program/curriculum-and-disciplines).
Reference: [Electron security guidance](https://github.com/electron/electron/blob/main/docs/tutorial/security.md).
