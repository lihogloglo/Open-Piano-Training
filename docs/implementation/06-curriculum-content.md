# 06 — Curriculum Content Plan

The complete unit map for Stages 0–7. Author as data in `src/curriculum/content/stageN.ts` following the schema in 02. This doc gives every unit's id, title, concepts (atoms introduced), and its distinctive steps; the standard lesson grammar (explain → guided → ladder → graded → create) applies unless noted. Explanatory text: write fresh, short (≤60 words/block), in the copy tone of 05; Open Music Theory (CC BY-SA) may be _adapted_ for explain blocks — if adapted, put the text in `content/omt-adapted/` with attribution headers and keep those files CC BY-SA.

**Tester audit update (2026-09-09):** Timed exercises now demonstrate the exact generated take before its count-in. Lessons display the sequence, beat positions and octave requirements. Retries and tempo changes retain the lesson seed. Ordinary chord recognition accepts inversions; explicit inversion, interval and two-hand exercises keep their stated constraints. See [the audit](../tester-feedback-audit.md).

**Global authoring rules**

- Timing tier defaults: Stage 0–1 `relaxed`, 2–4 `standard`, 5+ `strict` (per-exercise override allowed).
- **Minimum unit grammar, enforced by `curriculum.test.ts`** for every stage listed in its `REBUILT` array: each lesson unit has ≥1 `guided`, ≥1 `ladder`, ≥1 `graded` and a `create` step **with an exercise attached**; and no `explain` step exists without at least one block the learner has to play (`playCheck` or `earCheck`). Ladders may be skipped only for units with no motor pattern to ramp (recognition units), which are listed by id in the test. Checkpoints carry ≥5 graded takes. Add a stage to `REBUILT` when its content clears the bar.
- Every unit's `create` step exists (the Make strand is never skipped) — even Stage 0 ("play any rhythm on these two notes with the drone") — and carries a real exercise, normally an `improv` backing loop, not just a prompt.
- Stage 0 units 2–6 use real public-domain or traditional melodies in the create step. Daily create blocks also select a real song by stage.
- **Review nodes**: auto-inserted by `path.ts` after every 3rd lesson unit (kind `review`, 5 min, drills the stage's due/weakest atoms). Do not author them by hand.
- **Checkpoints** (`s{n}.cp`): 12–16 mixed items sampling every concept of the stage at `graded` standard, pass ≥0.8; passing any checkpoint unlocks that stage's successor (placement uses these).
- Ear items use the same key context the keyboard work is currently in.
- BPM values below are the 100% targets for graded steps.

---

## Stage 0 — Bearings _(“Find your way around”)_

| Unit  | Title                                 | Concepts / notes                                                                                                                                                                                                                                        |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s0.u1 | Meet the keyboard                     | Octave pattern, 2-and-3 black-key groups, finding C and F — both found by `playCheck` before either is named. Atoms `note:find:c`, `note:find:f`. Graded: 12 mixed finds. Create: play only Cs and Fs over an I–IV backing. No ladder (recognition).    |
| s0.u2 | Every note has a name                 | White-key names bracketed by the black-key groups (D between two, E/F and B/C around three). Atoms `note:find:{d,e,g,a,b}`. Graded: 12 finds across all seven names. Create: spell your own name on the keys over a drone. No ladder (recognition).     |
| s0.u3 | Half steps & the black keys           | Half step as "the very next key"; sharps/flats as _direction_; enharmonics proved by playing one key under two names. Atoms `note:find:sharps`, `theory:halfwhole`. Guided: chromatic walk C→C (`scaleType:'chromatic'`, derived fingering). No ladder. |
| s0.u4 | Your right hand: the five-finger home | Posture, then the C five-finger shape RH with a `keyboardDemo` and a five-note `playCheck`. Atom `fivefinger:c:maj:rh`. Ladder 48→80 BPM. Create: 5-note melody over a drone.                                                                           |
| s0.u5 | Your left hand joins                  | C five-finger LH, then the shape moved to G and F, hands separately, with its own LH ladder (46→76). Atoms `fivefinger:{c,g,f}:maj:{rh,lh}`. Create: both hands over a backing.                                                                         |
| s0.u6 | Keeping time                          | Metronome intro; quarter/half/whole as a demo; the count-in ritual, tried once by hand. Atom `rhythm:basic`. First timed rep at 60, then a ladder to 80, then graded at 80 with timing scored (explain early/late colours here).                        |
| s0.cp | Checkpoint: Bearings                  | Five takes: white-key find speed, black-key finds, five-finger in G and F, and the C shape in the left hand at 80.                                                                                                                                      |

## Stage 1 — One key, whole system _(“C major from the inside”)_

| Unit  | Title                           | Concepts / notes                                                                                                                                                                                                           |
| ----- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s1.u1 | The major scale recipe          | WWHWWWH walked by hand: a `playCheck` per step of the recipe (whole, whole, half). Atom `scale:c:major:rh:1oct` (fingering 123-12345 w/ finger labels on). Ladder 36→60 BPM. Create: scale-tone melody over a C drone.     |
| s1.u2 | Thumb-under, both hands         | Technique unit: the crossing RH (ladder 49→70) and the LH cross-over (ladder 42→60); graded both hands separately (`scale:c:major:lh:1oct`, 54321-321). Create: hands together over the drone.                             |
| s1.u3 | Degrees: the scale gets numbers | Degree numbers by hand (`playCheck` on 5, 3, 7→1) then by ear; `earCheck` against a drone; ear-degree pool {1,3,5}. Atoms `theory:degrees`, `ear:degree:135`. No ladder — recognition, nothing to ramp.                    |
| s1.u4 | Your first chord: home          | Triad as 1-3-5; C major RH and LH, then RH chord over an LH root. Ladder + graded on `grip-interleave` at 60 BPM. Atoms `chord:c:maj:inv0`, `theory:triad135`.                                                             |
| s1.u5 | Three chords, a thousand songs  | IV and V built from their degrees in a `playCheck`; progressionCard I-IV-V. Atoms `chord:f:maj:inv0`, `chord:g:maj:inv0`, `prog:i-iv-v:c`. Ladder + graded: progression-play **`style:'rootchord'`, hand `both`**, 70 BPM. |
| s1.u6 | The sad one: vi                 | Minor found by moving one note (C–E♭–G by hand), then A minor; `earCheck` + graded ear-quality. Ladder + graded I–V–vi–IV two-handed at 70. Atoms `chord:a:min:inv0`, `ear:quality:majmin`, `prog:i-v-vi-iv:c`.            |
| s1.u7 | Play a real song                | chart-play `song:first-light` (16 bars, verse + chorus), `style:'rootchord'` — LH roots + RH triads — ladder 43→72 then graded at 72. Atom `song:first-light`. Create: the same four chords rotated to start on vi.        |
| s1.cp | Checkpoint: C major             | Five takes: scale RH 70 and LH 60 BPM, name-and-play I/IV/V/vi (`flashcard` `kind:'roman'`), ear degrees {1,3,5}, eight bars of I–V–vi–IV two-handed at 72.                                                                |

## Stage 2 — The spelling engine _(“Build anything from any note”)_

| Unit  | Title                       | Concepts / notes                                                                                                                                                                                                                  |
| ----- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s2.u1 | Measuring music: intervals  | **Size before quality**: count letter names (a 3rd is three letters, whatever the accidental), _then_ how far. m3/M3/P4/P5 checked by hand and by ear. Atoms `theory:interval:*`. Ladder: naming cards on the clock at 30→50 BPM. |
| s2.u2 | Stacking thirds             | Major triad = M3+m3, minor = m3+M3 — from ANY root, built by hand in the explain step. Atoms `spell:triad:maj`, `spell:triad:min`. Ladder + graded over white-key roots.                                                          |
| s2.u3 | The black-key roots         | Same rule over all 12 roots; spelling by letters, not colour (E♭ major's middle note is G). Atom `spell:triad:allroots`. Graded: 16 interleaved grips at 50 BPM — one every 2.4 s. Create: improvise in E♭.                       |
| s2.u4 | A new key: G                | Why F♯; key signature idea; G scale **RH and LH**, each graded; I–IV–V in G two-handed (`rootchord`). Atoms `scale:g:major:{rh,lh}`, `keysig:g:major`, `prog:i-iv-v:g`.                                                           |
| s2.u5 | The circle appears          | circleOfFifths block, the added-sharp rule checked by hand; D major RH+LH; I–V–vi–IV in D two-handed. Atoms `scale:d:major:{rh,lh}`, `keysig:d:major`, `theory:circle:sharps`.                                                    |
| s2.u6 | The flat side: F            | B♭ story; F scale RH+LH (RH 1234-123 fingering quirk!); I–IV–V in F two-handed. Atoms `scale:f:major:{rh,lh}`, `keysig:f:major`.                                                                                                  |
| s2.u7 | Ear: major or minor?        | Two `earCheck`s then ear-quality graded ≥90%; plus `song:first-light` transposed to G, laddered 43→72 and graded. Atom `ear:quality:majmin-solid`.                                                                                |
| s2.cp | Checkpoint: Spelling engine | Six takes: 12 interleaved triads, G and F scales, intervals, ear quality, and I–IV–V two-handed in D — a key it was never drilled in.                                                                                             |

## Stage 3 — The Roman lens _(“Chords get jobs”)_

| Unit  | Title                              | Concepts / notes                                                                                                                                                                                                                                                 |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s3.u1 | Seven chords hiding in every scale | Diatonic triads of C, two of them built by hand; quality pattern M-m-m-M-M-m-dim as a transposable fact. Atoms `theory:diatonic-pattern`, `chord:b:dim:inv0`. Ladder: all seven on a 2-beat grid, 40→66 BPM.                                                     |
| s3.u2 | Roman numerals                     | Cases = quality; naming chords by job, not letter — "vi in G" and "vi in F" played back before the drill. Atom `theory:roman`. Ladder: roman cards on the clock across four keys. Create: I–V–vi–IV in D, thought in numbers.                                    |
| s3.u3 | Home, away, tension                | Tonic/subdominant/dominant; the leading tone and the 5→1 bass drop played by hand. Atoms `theory:function`, `ear:chord-function:145`. Ear graded ≥0.75, plus a two-handed I–IV–V–I laddered to 70.                                                               |
| s3.u4 | The four-chord families            | I-V-vi-IV, I-vi-IV-V, vi-IV-I-V as one loop rotated; progressionCards with songRefs. Atoms `prog:i-vi-iv-v:*`, `prog:vi-iv-i-v:*` (keys C, G). Ladder + two graded rotations, both hands.                                                                        |
| s3.u5 | ii and iii, the connectors         | ii→V as two falling fifths, demoed against IV–V–I; iii as colour. Atoms `chord:d:min:inv0`, `chord:e:min:inv0`, `prog:i-ii-v:c`, `theory:ii-v`. Ladder + graded two-handed, plus I–iii–IV–V in G.                                                                |
| s3.u6 | Harmonize a melody                 | One melody note, two chords, played both ways in the explain step. Then the generated 8-bar melody with several right answers (`progression-play` with `acceptAlternatives`). Atom `create:harmonize:1`. **No ladder** — `chord-any` targets are wait-mode only. |
| s3.u7 | Ear: name the progression          | An `earCheck` on the loop, then ear-progression over {I-IV-V-I, I-V-vi-IV, I-vi-IV-V, vi-IV-I-V} ≥0.75. Atom `ear:prog:pop4`. **No ladder** — recognition, and wait-mode only.                                                                                   |
| s3.u8 | Song lab                           | Two new charts (`song:northline` in G: I-iii-IV-V; `song:paper-sun` in F: I-vi-ii-V), both `rootchord` two-handed, Northline laddered 40→66. Create: play Paper Sun's loop in **C** from the numerals alone.                                                     |
| s3.cp | Checkpoint: Roman lens             | Five takes: numerals in four keys, function ear test, an 8-bar harmonization, a rotated loop in G two-handed, and Paper Sun played from its chart.                                                                                                               |

## Stage 4 — Smooth hands _(“Inversions & voice leading”)_

| Unit  | Title                        | Concepts / notes                                                                                                                                                                                                      |
| ----- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s4.u1 | The same chord, three grips  | Inversions of C/F/G physically; slash notation checked by playing the bass note it names (C/E → E). Atoms `chord:{c,f,g}:maj:inv{1,2}`. Ladder 32→54 BPM over the three grips.                                        |
| s4.u2 | The shortest way             | Voice-leading law played by hand: C–E–G → C–F–A → B–D–G. Smooth `progression-play` laddered, then graded in C (RH) and F (two hands, `rootchord` + smooth). Atom `theory:voiceleading`.                               |
| s4.u3 | Smooth pop                   | The two nearest grips found by hand first, then I-V-vi-IV smooth in C & G, vl-scored, 76 BPM. Atoms `prog-smooth:i-v-vi-iv:{c,g}`. Create: listen to the top line the voice leading writes for you.                   |
| s4.u4 | All grips, all keys (part 1) | Slash/inversion naming by hand, then grip-interleave with inversions over C G D F A. Ladder at 54, graded <2.5 s/grip.                                                                                                |
| s4.u5 | Left hand grows up           | LH root · fifth · octave · fifth, checked by hand on two different bars; guided LH-alone rep, then the independence ladder (LH alone 40→80) and a two-hand graded. Atoms `pattern:lh:rootfifth`, `pattern:lh:broken`. |
| s4.u6 | Cadences                     | Authentic, plagal, half — heard, then played as bass pairs (F→C, G→C). Atoms `theory:cadence`, `ear:cadence`. Ladder + graded on a I-IV-I-V-I chain, two hands, in C and G.                                           |
| s4.u7 | Song lab: texture            | `song:northline` with LH broken pattern + RH smooth chords, guided then laddered 48→80. Create: invent your own LH pattern over Paper Sun's loop.                                                                     |
| s4.cp | Checkpoint: Smooth hands     | Five takes: smooth I-V-vi-IV in C, a two-handed smooth loop in G, 12 interleaved inversions at 2.5 s each, cadences by ear, and a full-texture brokenLH take.                                                         |

## Stage 5 — The whole map _(“Sevenths, minor, all 12 keys”)_

| Unit  | Title                      | Concepts / notes                                                                                                                                                                                                    |
| ----- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s5.u1 | Four notes: maj7 & 7       | Stack another third, by hand (Cmaj7, then the one note that makes it C7); dominant 7's tritone pull. Ladder on the spelling cards at 30→50 BPM. Atoms `spell:maj7`, `spell:7`, `ear:quality:maj7`, `ear:quality:7`. |
| s5.u2 | m7 and the ii-V-I cell     | m7 spelling; the cell's roots played as a bass line; ii-V-I in C/G/F, guided two-handed (`rootchord` + smooth) before the ladder. Atoms `spell:m7`, `prog:ii-v-i:{c,g,f}`, `ear:quality:m7`.                        |
| s5.u3 | The dark ones: m7♭5 & dim7 | Both built by hand (Bm7♭5, then the note that makes it Bdim7); **m7♭5 is dominant-function on vii of a major key and the iiø7 of a minor one**. Ladder at 28→46 BPM. Atoms `spell:m7b5`, `spell:dim7`.              |
| s5.u4 | Relative minor             | Am from C (three half steps down, played); natural vs harmonic — the raised 7th played on its own. Guided runs of both. Atoms `scale:a:natminor:*`, `scale:a:harmminor:rh`, `theory:relative`.                      |
| s5.u5 | Minor progressions         | VI and VII built by hand, then i-VI-III-VII guided two-handed; i-iv-V; chart `song:ember` (Am). Atoms `prog:i-vi-iii-vii:am`, `prog:i-iv-v:am`, `song:ember`.                                                       |
| s5.u6 | Around the circle: sharps  | The sharps played in their arrival order; A major guided and graded **in both hands**; E and B graded RH. Atoms `scale:{a,e,b}:major:rh`, `scale:a:major:lh`, `keysig:*`. Create: improvise in E.                   |
| s5.u7 | Around the circle: flats   | B♭, E♭, A♭ (F fingering family), flats played in order; B♭ guided and graded **in both hands**. Atoms accordingly, plus `scale:bb:major:lh`. Create: improvise in E♭.                                               |
| s5.u8 | The far side               | D♭/C♯, G♭/F♯ (enharmonic story); the two white keys of D♭ found by hand. Guided D♭ run. Create: black-key pentatonic improv in D♭.                                                                                  |
| s5.u9 | ii-V-I everywhere          | The cell as a shape: its roots played in B♭ before the chart. Guided then laddered `song:round-the-circle`, 66 BPM graded; ear: ii-V-I vs IV-V-I. Atoms `prog:ii-v-i:all`, `ear:prog:iivi`.                         |
| s5.cp | Checkpoint: The whole map  | Five takes: random-key scale, random 7th spelling, **two-handed** ii-V-I in F, minor progression, 7th-quality ear ≥85%.                                                                                             |

## Stage 6 — Charts for real _(“Comping craft”)_

| Unit  | Title                              | Concepts / notes                                                                                                                                                                            |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s6.u1 | Reading the language               | Full symbol survey (m, 7s, sus, add9, 6, slash), with sus4 and add9 built by hand; ladder on the spelling cards. Atom `read:symbols:full`.                                                  |
| s6.u2 | Shells                             | LH 1-7 / 1-3 shells, each played before it is drilled; guided rep, ladder, then two keys graded. Atoms `voicing:shell17`, `voicing:shell13`.                                                |
| s6.u3 | Guide tones                        | 3rds & 7ths steering ii-V-I — the pair played by hand, including the half step that turns Dm7's into G7's. Atom `voicing:guidetones`.                                                       |
| s6.u4 | Groove school: straight eighths    | The offbeat placed by hand ("play a C on the and of 2"), then the pattern guided, laddered and graded. Atom `comp:straight8`.                                                               |
| s6.u5 | Groove school: ballad & boom-chuck | Broken-chord ballad; boom-chuck, with its alternating bass played and demoed. Atoms `comp:ballad`, `comp:boomchuck`. Create: the same loop under all three grooves.                         |
| s6.u6 | Melody on top                      | LH shells under a free RH line on `song:northline`, lead-sheet rung. Atom `texture:melody-lh`. The lesson **says plainly** that the RH melody is unscored — the songs carry no melody data. |
| s6.u7 | Transpose anything                 | Roman-first transposition; the I-vi-ii-V roots played in A-flat before any drill. Guided, then graded in B-flat and E-flat. Atom `skill:transpose`.                                         |
| s6.u8 | The unseen chart                   | The fallback shell rehearsed first, then a guided read, a ladder, and a graded _generated_ chart never seen before. Atom `skill:sightcomp` (also the `keys` rating's top material).         |
| s6.cp | Checkpoint: Comping                | Five takes: unseen chart, the turnaround in A-flat, guide tones in F, a boom-chuck groove, and the full symbol vocabulary spelled.                                                          |

## Stage 7 — Your own voice _(“Improvisation & the ear endgame”)_

| Unit  | Title                       | Concepts / notes                                                                                                                                                                                                                                |
| ----- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s7.u1 | Three notes, infinite music | Degree improv 1-2-3 over a drone (IFR style), phrasing talk, plus the part that _can_ be checked: an ear-degree drill on the same three notes. Atom `improv:degrees123`. Unscored improv by design.                                             |
| s7.u2 | The pentatonic safety net   | The two notes pentatonic drops, played first; then the scale guided, laddered and graded. Atoms `scale:*:majorpent:rh`, `improv:pent`.                                                                                                          |
| s7.u3 | Chord tones are home        | Targeting 1/3/5 on the downbeat over a I-V-vi-IV backing; approach notes played by hand. Atom `improv:chordtones`. **No ladder** — `improv` is wait-mode only.                                                                                  |
| s7.u4 | The blues form              | 12-bar form; dominant everywhere; the blue note and the three roots played, then the blues scale guided and laddered. Atoms `theory:blues12`, `scale:c:blues:rh`, `improv:blues`.                                                               |
| s7.u5 | Swing & feel                | Straight vs swung 8ths, the swung offbeat placed by hand; guided shells, then the swing comping pattern. Atom `comp:swing`. Create: swing against a straight backing.                                                                           |
| s7.u6 | Find the key, find the song | By-ear workflow: tonic hunt → bass motion → qualities; ear-progression hard pool incl. inversions in bass. Atoms `ear:findkey`, `ear:prog:advanced`.                                                                                            |
| s7.u7 | Recover a chord progression | Full by-ear pickup of a generated "radio song" (app plays full arrangement; learner recovers chart). Atom `skill:transcribe`.                                                                                                                   |
| s7.u8 | Colours: add9, sus, 6       | Extensions as spice; rootless preview (onramp text pointing outward: Levine, PWJ). Atoms `voicing:colors`, `voicing:rootless-preview`.                                                                                                          |
| s7.cp | Final: Your own voice       | Blues chorus (recorded, self-assessed rubric + auto rhythm score), unseen chart any key, by-ear pickup of a generated song. Completing it → "The path is yours" epilogue screen + endless mode explained (ratings, weekly reviews, song packs). |

---

## Song catalog (write these as original charts in `songs.ts`)

At minimum: `first-light` (C, I-V-vi-IV pop, 72), `northline` (G, I-iii-IV-V ballad, 66), `paper-sun` (F, I-vi-ii-V, 84), `ember` (Am, i-VI-III-VII, 76), `blue-monday-blues` (C blues 12-bar, 88), `round-the-circle` (ii-V-I etude through 4 keys, 66), plus 6 more spread over stages 5–7 with mixed forms (AABA, verse/pre/chorus). Style refs name genres/eras, never specific artists' songs.

## Ear-training thread (summary of what appears where)

S1: degrees 1/3/5 → S2: all degrees + maj/min quality → S3: chord function, 4-chord progressions → S4: cadences, inversion hearing → S5: 7th qualities, ii-V-I → S6: (consolidation via ratings) → S7: find-key, advanced progressions, transcription.

## Practical studio extension (2026-09-06)

`src/curriculum/content/musicianship.ts` adds 14 practical lessons and three original eight-bar pieces.
`/studio` lists them. Path stage headers and Songs link to this material.

The lessons cover seat and touch, subdivision, silence and ties, alternating hands, articulation, thumb movement, held bass, meter, offbeats, imitation, balance, pedal, and transcription.
The pieces are Morning Steps, Little Lantern, and Homeward.
Each piece supports melody, melody with bass, and melody with chords.

The shared schema stores MIDI pitch, start beat, duration, hand, optional finger, velocity, meter, example variants, movement guidance, and self-checks.
The `phrase` generator groups simultaneous starts. It supports different meters and fractional beats.
The player offers separate hands, two-bar repeats, whole-piece practice, demonstrations, adjustable tempo, and performance without answer highlights.
Ear examples remain hidden until the learner requests practice help. Revealing an answer disables the independent ear attempt.

These tasks score note starts. The app does not infer physical technique, finger choice, pedal clarity, or musical expression from that score.
A completed self-check remains distinct from an independent or retained performance.
Teacher and beginner reviews remain open in `docs/improvement-tracker.md`.

The chronological rehearsal lint now uses only earlier teaching steps. It checks graded checkpoint material too.
Ten previously hidden violations were repaired. The core path now has 421 steps, 348 exercises, and 64 ladders across 68 units.
