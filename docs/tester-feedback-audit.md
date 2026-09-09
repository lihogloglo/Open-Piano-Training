# Tester feedback audit — 2026-09-09

The audit covered note matching, all chord-generating routes, tourist access and writes, timed exercise preparation, lesson continuity, and instructions across Stages 0–7.

## Findings and fixes

| Report                                             | Cause                                                                                                                            | Result                                                                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Other octaves sometimes fail                       | Scale and five-finger targets required one MIDI number. Flexible sets also counted doubled notes inconsistently.                 | Scale and five-finger patterns accept other octaves. Flexible chords compare distinct note names in both matching modes.               |
| Chord inversions fail                              | Free progression, chart, spelling and ear-quality exercises imposed root position. Accompaniment used exact right-hand voicings. | Ordinary chords accept inversions. Accompaniment accepts right-hand inversions while keeping the separate bass requirement.            |
| Tourist mode leaves content locked                 | Songs and challenges ignored the flag. Reviews required previously learned material. Path nodes still displayed locks.           | All these entry points open during a visit. Turning the mode off restores real prerequisites.                                          |
| Tourist visits can write progress                  | Session, recap, badge and Studio self-check writes bypassed the original guards.                                                 | Session plans remain in memory. Other progress writes are suppressed during the visit.                                                 |
| Tempo exercises begin without showing the sequence | Instances were generated only after Start and immediately entered the count-in.                                                  | A visible sequence and an automatic demonstration precede each timed attempt. The demonstration and scored take use the same instance. |
| Tempo repetitions change material                  | Random seeds were regenerated on each attempt.                                                                                   | One saved lesson seed is reused across steps, retries and tempo rungs. Intentional authored changes still receive a new demonstration. |
| Instructions contradict the task                   | Copy described roots as always lowest, called chord repetitions a broken chord, and misstated some chord and timing rules.       | Instructions name the actual notes, rhythm and scoring requirements. The obsolete Stage 5 construction notice is removed.              |
| Some demonstrations lose sharp notes               | The local Vite server returned HTML for encoded sharp-note filenames.                                                            | Development and preview sample routes return audio. The local-sample probe rejects HTML fallback responses.                            |

## Preserved teaching requirements

Specific inversion exercises still require the named chord note in the bass. Interval exercises still require the stated spacing. Notation and arranged phrases retain their written octaves. Two-hand patterns require the bass and right-hand part separately. The sequence view explains these requirements.

## Verification

Passed: 284 unit tests and 14 targeted browser tests, including offline playback. Lint, TypeScript, 36 contrast checks, the production build and the bundle budget also pass. The final eager bundle is 323.4 kB gzipped against a 450 kB limit.

- Unit tests cover ordinary and inverted chords in both matchers, octave changes, intervals, separate bass parts, accompaniment patterns, demonstration cancellation, and tourist writes.
- The curriculum audit verifies that every authored timed exercise has a nonempty demonstration containing its actual targets.
- Browser tests cover tourist access and restoration, a whole song played in inversions, a tempo exercise played an octave lower, stable sequences across tempos, and audio decoding.
- Lint, TypeScript, contrast checks, production build and bundle budget are checked.

The browser tests use simulated MIDI. Physical keyboards, sustain pedals and audible sound quality still need human testing. The full-path marathon was not run.
