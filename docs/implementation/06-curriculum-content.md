# 06 — Curriculum Content Plan

The complete unit map for Stages 0–7. Author as data in `src/curriculum/content/stageN.ts` following the schema in 02. This doc gives every unit's id, title, concepts (atoms introduced), and its distinctive steps; the standard lesson grammar (explain → guided → ladder → graded → create) applies unless noted. Explanatory text: write fresh, short (≤60 words/block), in the copy tone of 05; Open Music Theory (CC BY-SA) may be *adapted* for explain blocks — if adapted, put the text in `content/omt-adapted/` with attribution headers and keep those files CC BY-SA.

**Global authoring rules**
- Timing tier defaults: Stage 0–1 `relaxed`, 2–4 `standard`, 5+ `strict` (per-exercise override allowed).
- Every unit's `create` step exists (the Make strand is never skipped) — even Stage 0 ("play any rhythm on these two notes with the drone").
- **Review nodes**: auto-inserted by `path.ts` after every 3rd lesson unit (kind `review`, 5 min, drills the stage's due/weakest atoms). Do not author them by hand.
- **Checkpoints** (`s{n}.cp`): 12–16 mixed items sampling every concept of the stage at `graded` standard, pass ≥0.8; passing any checkpoint unlocks that stage's successor (placement uses these).
- Ear items use the same key context the keyboard work is currently in.
- BPM values below are the 100% targets for graded steps.

---

## Stage 0 — Bearings *(“Find your way around”)*

| Unit | Title | Concepts / notes |
|---|---|---|
| s0.u1 | Meet the keyboard | Octave pattern, 2-and-3 black-key groups, finding C. Atoms: `note:find:c`, `note:find:f`. Guided: "press every C" (any octave, wait mode). Create: echo-play two notes with drone. |
| s0.u2 | Every note has a name | White-key names via landmarks (C/F). Atoms `note:find:{d,e,g,a,b}`. Flashcard drill answerVia midi: "play any A" — graded at 12 finds/min. |
| s0.u3 | Half steps, whole steps & the black keys | Sharps/flats as directions; enharmonics teaser. Atoms `note:find:sharps`, `theory:halfwhole`. Guided: chromatic walk C→C, RH 1-3 fingers. |
| s0.u4 | Your right hand: the five-finger home | Posture text + photo-free (keyboardDemo). C major 5-finger RH. Atom `fivefinger:c:maj:rh`. Ladder 60→80 BPM. Create: 5-note melody over drone, sing degrees 1–5 (honor system prompt). |
| s0.u5 | Your left hand joins | C 5-finger LH; then G & F 5-finger both hands separately. Atoms `fivefinger:{c,g,f}:maj:{rh,lh}`. |
| s0.u6 | Keeping time | Metronome intro; quarter/half/whole; count-in ritual. Atom `rhythm:basic`. Graded: 5-finger melody at 80 BPM, timing scored (first tempo-mode unit — explain early/late colors here). |
| s0.cp | Checkpoint: Bearings | Find-note speed, 5-finger in 3 keys, timed melody. |

## Stage 1 — One key, whole system *(“C major from the inside”)*

| Unit | Title | Concepts / notes |
|---|---|---|
| s1.u1 | The major scale recipe | WWHWWWH; build C major by ear+eye. Atom `scale:c:major:rh:1oct` (fingering 123-12345 taught w/ finger labels on). |
| s1.u2 | Thumb-under | Technique unit: the crossing, slow ladder 50→70 BPM; LH version (`scale:c:major:lh:1oct`, 54321-321). |
| s1.u3 | Degrees: the scale gets numbers | Degree names/colors (do-based numbers); sing-and-play; ear-degree intro (pool 1,3,5). Atoms `theory:degrees`, `ear:degree:1`, `ear:degree:3`, `ear:degree:5`. |
| s1.u4 | Your first chord: home | Triad concept as 1-3-5; I in C (block, RH & LH). Atoms `chord:c:maj:inv0`, `theory:triad135`. |
| s1.u5 | Three chords, a thousand songs | IV and V as shapes; progressionCard I-IV-V with songRefs. Atoms `chord:f:maj:inv0`, `chord:g:maj:inv0`, `prog:i-iv-v:c`. Graded: progression-play block style 70 BPM. |
| s1.u6 | The sad one: vi | A minor shape; major-vs-minor sound (ear-quality maj/min intro). Atoms `chord:a:min:inv0`, `ear:quality:min`, `prog:i-v-vi-iv:c`. |
| s1.u7 | Play a real song | chart-play `song:first-light` (I–V–vi–IV, 4 sections) LH roots + RH triads, 72 BPM. Atom `song:first-light`. Create: reorder the four chords into your own loop. |
| s1.cp | Checkpoint: C major | Scale HS 60 BPM, name-and-play I/IV/V/vi, ear degrees {1,3,5}, one song section. |

## Stage 2 — The spelling engine *(“Build anything from any note”)*

| Unit | Title | Concepts / notes |
|---|---|---|
| s2.u1 | Measuring music: intervals | Generic size then quality; m2/M2/m3/M3/P4/P5/P8 spelled & played. Atoms `theory:interval:{m2,M2,m3,M3,P4,P5,P8}`. Flashcards answerVia midi ("play a M3 above E"). |
| s2.u2 | Stacking thirds | Major triad = M3+m3, minor = m3+M3 — from ANY root. Atoms `spell:triad:maj`, `spell:triad:min`; grip-interleave over white-key roots. |
| s2.u3 | The black-key roots | Same drill over all 12 roots; enharmonic spelling explained. `chord:{all12}:maj:inv0`, `:min:inv0` atoms activated. Graded: grip-interleave 20 grips <3s each. |
| s2.u4 | A new key: G | Why F♯; key signature idea; G scale RH+LH; I-IV-V-vi in G. Atoms `scale:g:major:*`, `keysig:g:major`, `prog:i-iv-v:g`. |
| s2.u5 | The circle appears | circleOfFifths block; sharps side story; D major. Atoms `scale:d:major:*`, `keysig:d:major`, `theory:circle:sharps`. |
| s2.u6 | The flat side: F | B♭ story; F scale (RH 1234-123 fingering quirk!). Atoms `scale:f:major:*`, `keysig:f:major`. |
| s2.u7 | Ear: major or minor? | ear-quality graded ≥90% over 20 items; plus transposed song: `song:first-light` in G. Atom `ear:quality:majmin`. |
| s2.cp | Checkpoint: Spelling engine | Random-root triads timed, scales C/G/D/F, key sigs, ear quality. |

## Stage 3 — The Roman lens *(“Chords get jobs”)*

| Unit | Title | Concepts / notes |
|---|---|---|
| s3.u1 | Seven chords hiding in every scale | Diatonic triads of C; quality pattern M-m-m-M-M-m-dim as transposable fact. Atoms `theory:diatonic-pattern`, `chord:b:dim:inv0`. |
| s3.u2 | Roman numerals | Cases = quality; naming chords by job not letter. Atom `theory:roman`. Flashcards: "iii in G is…?" answerVia midi. |
| s3.u3 | Home, away, tension | Tonic/subdominant/dominant function; why V pulls (leading tone + 5-1 bass). Atom `theory:function`. Ear: I vs IV vs V after cadence (`ear:chord-function:145`). |
| s3.u4 | The four-chord families | I-V-vi-IV, I-vi-IV-V, vi-IV-I-V as one family rotated; progressionCards with 6+ songRefs each. Atoms `prog:i-vi-iv-v:*`, `prog:vi-iv-i-v:*` (keys C,G). Graded: play any named rotation on demand. |
| s3.u5 | ii and iii, the connectors | ii→V intro; iii as color. Atoms `chord:d:min:inv0` in-key context, `prog:i-ii-v:c`, `theory:ii-v`. |
| s3.u6 | Harmonize a melody | Given 8-bar diatonic melody (generated, degrees shown), choose chords; multiple valid answers — scoring: chord contains melody note OR is functional match (engine: `progression-play` with `acceptAlternatives`). Atom `create:harmonize:1`. |
| s3.u7 | Ear: name the progression | ear-progression pool {I-IV-V-I, I-V-vi-IV, I-vi-IV-V, vi-IV-I-V} ≥75%. Atom `ear:prog:pop4`. |
| s3.u8 | Song lab | Two new charts (`song:northline` ballad in G: I-iii-IV-V; `song:paper-sun` in F). Create: transpose chorus of one to C by roman thinking (chart shows romans only). |
| s3.cp | Checkpoint: Roman lens | Diatonic spelling any key of {C,G,D,F}, function ear test, harmonization, progression on demand. |

## Stage 4 — Smooth hands *(“Inversions & voice leading”)*

| Unit | Title | Concepts / notes |
|---|---|---|
| s4.u1 | The same chord, three grips | Inversions of C/F/G physically; reading slash notation (C/E). Atoms `chord:{c,f,g}:maj:inv{1,2}`. |
| s4.u2 | The shortest way | Voice-leading law; I→IV as C→F/C; smooth `progression-play` w/ vl scoring intro (unscored demo first). Atom `theory:voiceleading`. |
| s4.u3 | Smooth pop | I-V-vi-IV smooth in C & G, vl-scored, 76 BPM. Atoms `prog-smooth:i-v-vi-iv:{c,g}`. |
| s4.u4 | All grips, all keys (part 1) | grip-interleave w/ inversions, keys C G D F + their triads. Graded <2.5s/grip. |
| s4.u5 | Left hand grows up | LH patterns vs RH chords: root-fifth, octave, broken 1-5-1; hand-independence ladder (RH holds, LH moves → both move). Atoms `pattern:lh:rootfifth`, `pattern:lh:broken`. |
| s4.u6 | Cadences | Authentic, plagal, half; hearing endings. Atoms `theory:cadence`, `ear:cadence`. |
| s4.u7 | Song lab: texture | Re-play `song:northline` w/ LH broken pattern + RH smooth chords, 80 BPM. Create: choose your own LH pattern for `song:paper-sun`. |
| s4.cp | Checkpoint: Smooth hands | Smooth 4-chord progressions in 6 keys ≤1 shift/change @80 BPM; inversion ID by eye & ear; LH pattern + RH chords take. |

## Stage 5 — The whole map *(“Sevenths, minor, all 12 keys”)*

| Unit | Title | Concepts / notes |
|---|---|---|
| s5.u1 | Four notes: maj7 & 7 | Stack another third; dominant 7's tritone pull. Atoms `spell:maj7`, `spell:7`, `ear:quality:maj7`, `ear:quality:7`. |
| s5.u2 | m7 (and the ii-V-I cell) | m7 spelling; ii-V-I in C/G/F closed. Atoms `spell:m7`, `prog:ii-v-i:{c,g,f}`, `ear:quality:m7`. |
| s5.u3 | The dark ones: m7♭5 & dim7 | Spelling + where they live (vii). Atoms `spell:m7b5`, `spell:dim7`. |
| s5.u4 | Relative minor | Am from C; natural vs harmonic (raised 7 for V). Atoms `scale:a:natminor:*`, `scale:a:harmminor:rh`, `theory:relative`. |
| s5.u5 | Minor progressions | i-VI-III-VII, i-iv-V. Atoms `prog:i-vi-iii-vii:am`, `prog:i-iv-v:am`, chart `song:ember` (Am). |
| s5.u6 | Around the circle: sharps | Scales+key triads A, E, B (grouped unit w/ internal ladder). Atoms `scale:{a,e,b}:major:*`, `keysig:*`. |
| s5.u7 | Around the circle: flats | B♭, E♭, A♭ (F fingering family). Atoms accordingly. |
| s5.u8 | The far side | D♭/C♯, G♭/F♯ (enharmonic story); black-key-friendly fingerings noted. |
| s5.u9 | ii-V-I everywhere | All 12 keys, closed voicings, 66 BPM graded; ear: hear ii-V-I vs IV-V-I. Atoms `prog:ii-v-i:all`, `ear:prog:iivi`. |
| s5.cp | Checkpoint: The whole map | Random-key scale, random 7th spelling <3s, ii-V-I random key, minor progression take, 7th-quality ear ≥85%. |

## Stage 6 — Charts for real *(“Comping craft”)*

| Unit | Title | Concepts / notes |
|---|---|---|
| s6.u1 | Reading the language | Full symbol survey (m, 7s, sus, add9, 6, slash); spell-drill from symbols. Atom `read:symbols:full`. |
| s6.u2 | Shells | LH 1-7 / 1-3 shells; why they're enough. Atoms `voicing:shell17`, `voicing:shell13`. |
| s6.u3 | Guide tones | 3rds & 7ths steering ii-V-I; RH guide tones over LH roots. Atom `voicing:guidetones`. |
| s6.u4 | Groove school: straight 8ths | Pop comping rhythm patterns (3 patterns, tempo-scored on pattern beats). Atom `comp:straight8`. |
| s6.u5 | Groove school: ballad & boom-chuck | Broken-chord ballad; boom-chuck. Atoms `comp:ballad`, `comp:boomchuck`. |
| s6.u6 | Melody on top | RH melody + LH chords on `song:northline` lead-sheet rung. Atom `texture:melody-lh`. |
| s6.u7 | Transpose anything | Roman-first transposition workflow; chart shown in romans, play in 3 requested keys. Atom `skill:transpose`. |
| s6.u8 | The unseen chart | Graded: a *generated* chart (diatonic+7ths, familiar forms) never seen before, 2 passes allowed, styled comp ≥0.8. Atom `skill:sightcomp` (this is also the `keys` rating's top material). |
| s6.cp | Checkpoint: Comping | Unseen chart + transposition + shells/guide-tone takes. |

## Stage 7 — Your own voice *(“Improvisation & the ear endgame”)*

| Unit | Title | Concepts / notes |
|---|---|---|
| s7.u1 | Three notes, infinite music | Degree improv 1-2-3 over drone (IFR style); phrasing talk (call/response). Atom `improv:degrees123`. |
| s7.u2 | The pentatonic safety net | Major pentatonic all keys as improv palette. Atoms `scale:*:majorpent:rh`, `improv:pent`. |
| s7.u3 | Chord tones are home | Targeting 1/3/5 on the downbeat over I-V-vi-IV backing; approach notes. Atom `improv:chordtones`. |
| s7.u4 | The blues form | 12-bar form; dominant everywhere; blues scale. Atoms `theory:blues12`, `scale:c:blues:rh`, `improv:blues`. |
| s7.u5 | Swing & feel | Straight vs swung 8ths (metronome swing mode); comping swing pattern. Atom `comp:swing`. |
| s7.u6 | Find the key, find the song | By-ear workflow: tonic hunt → bass motion → qualities; ear-progression hard pool incl. inversions in bass. Atoms `ear:findkey`, `ear:prog:advanced`. |
| s7.u7 | Transcribe a song | Full by-ear pickup of a generated "radio song" (app plays full arrangement; learner recovers chart). Atom `skill:transcribe`. |
| s7.u8 | Colors: add9, sus, 6 | Extensions as spice; rootless preview (onramp text pointing outward: Levine, PWJ). Atoms `voicing:colors`, `voicing:rootless-preview`. |
| s7.cp | Final: Your own voice | Blues chorus (recorded, self-assessed rubric + auto rhythm score), unseen chart any key, by-ear pickup of a generated song. Completing it → "The path is yours" epilogue screen + endless mode explained (ratings, weekly reviews, song packs). |

---

## Song catalog (write these as original charts in `songs.ts`)

At minimum: `first-light` (C, I-V-vi-IV pop, 72), `northline` (G, I-iii-IV-V ballad, 66), `paper-sun` (F, I-vi-ii-V, 84), `ember` (Am, i-VI-III-VII, 76), `blue-monday-blues` (C blues 12-bar, 88), `round-the-circle` (ii-V-I etude through 4 keys, 66), plus 6 more spread over stages 5–7 with mixed forms (AABA, verse/pre/chorus). Style refs name genres/eras, never specific artists' songs.

## Ear-training thread (summary of what appears where)
S1: degrees 1/3/5 → S2: all degrees + maj/min quality → S3: chord function, 4-chord progressions → S4: cadences, inversion hearing → S5: 7th qualities, ii-V-I → S6: (consolidation via ratings) → S7: find-key, advanced progressions, transcription.
