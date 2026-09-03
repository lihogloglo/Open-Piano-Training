# Content audit — the state of what this app actually teaches

_Audited 2026-09-02 against `main` @ d224f31. All numbers below were extracted programmatically
from `CURRICULUM` (all 68 units, 265 steps, 179 exercise instances), not estimated._

> **Status, 2026-09-03.** This audit is kept as written — it is the measurement that started the
> content rebuild, not a live scoreboard. Since it was taken, Stages 0-7 have all been rebuilt
> against §7.1, §7.2, §3.2, §3.3 and §C, and a curriculum lint in `curriculum.test.ts` now enforces
> the unit grammar for every stage. Re-measured from `CURRICULUM`: 843 nominal minutes (was 651),
> 329 exercise instances (was 179), 153 of them on the left hand or both (was 42), 111 `playCheck`
> blocks that need hands on the keys (was 0), 61 create steps every one carrying a real exercise
> (was 21, of which 5), 51 tempo ladders (was 22). The two theory errors in §I are fixed.
> **Still open:** the technique strand (§5A), the rhythm strand (§5B), diagnosis from the replay
> logs (§5D), the 100 BPM ceiling (§5E), real repertoire and a `melody` field on `Song` (§5F), and
> a musician's review of the prose (§7.8). Per-unit detail is in `decisions.md` under "Content
> build (post-audit)".

This document is about **content**, not code. The engine, the MIDI layer, the scheduler and the
scoring are out of scope — they are tested and they work. What is audited here is the teaching
material those systems deliver, and whether it teaches piano.

**The verdict in one line:** the curriculum is a well-sequenced _music theory_ course with a
keyboard attached, delivered in a three-step unit that is far too thin to build physical skill,
and its repertoire is twelve chord progressions with invented names.

---

## 1. Method

The audit dumped every unit through the live zod-validated `CURRICULUM` object and counted step
kinds, exercise generators, modes, rungs, hands, tempos, explain-block kinds and prose word counts.
Anything stated as a number here is reproducible by re-running that dump. Judgements are marked as
judgements. Where I could not verify something, I say so.

---

## 2. Headline numbers

| Measure                           | Value                           |
| --------------------------------- | ------------------------------- |
| Stages                            | 8 (s0–s7)                       |
| Units                             | 68 — 60 lessons + 8 checkpoints |
| Lesson steps total                | 265                             |
| Exercise instances                | 179                             |
| Distinct exercise generators      | 13                              |
| Tracked skill atoms               | 138                             |
| Songs (chord charts)              | 12                              |
| Total authored prose              | **3,453 words** (~51 per unit)  |
| Total nominal duration            | **651 minutes ≈ 10.9 hours**    |
| Explain steps / interactive steps | 70 / 195                        |

Two of these deserve immediate attention.

**10.9 hours is the entire path**, zero-to-comping. After that the app has nothing new to say and
falls back to FSRS review of the same 138 atoms in new keys. A realistic adult beginner reaching
the described terminal skill (comp an unseen lead sheet, improvise a blues chorus) needs somewhere
between 200 and 600 hours at the instrument. The app supplies **eleven hours of unique material**
and an infinite drill loop. That is not a curriculum; it is a syllabus plus a metronome.

**3,453 words is very little prose** — about seven pages. This corrects an impression I gave
earlier: the app is _not_ text-heavy. The writing is concise and mostly good. The problem is not
that there is too much reading. It is what surrounds the reading.

---

## 3. The core finding: the shape of a unit

Every lesson unit is a sequence of steps drawn from five kinds: `explain` (X), `guided` (G,
wait-mode play), `ladder` (L, tempo ramp), `graded` (T, the scored take) and `create` (C, free
play). The design in `docs/implementation/06-curriculum-content.md` specifies the full grammar
**explain → guided → ladder → graded → create** as the default, "unless noted."

Here is what was actually built. Distribution of step sequences across the 60 lesson units:

| Shape             | Count  | Reading                         |
| ----------------- | ------ | ------------------------------- |
| **X G T**         | **19** | explain → one guided rep → test |
| X G T C           | 7      | …plus a create prompt           |
| **X L T**         | **6**  | explain → tempo ramp → test     |
| X L T T           | 6      | …plus a second test             |
| X L T C           | 4      |                                 |
| X G L T T         | 2      | the only near-complete grammar  |
| X G T T           | 2      |                                 |
| X T T C           | 2      | no scaffolding at all           |
| X L T T T         | 2      |                                 |
| (10 other shapes) | 1 each |                                 |

**Nineteen units — nearly a third of the course — are literally three steps: read ~50 words, play
it once in wait mode, take the graded test.** Six more are explain → ladder → test. The modal unit
in this app is three steps and eight or nine minutes long, and the full five-step grammar the
design specifies appears **twice in the entire curriculum** (s1.u2 and s5.u2).

The stages where this bites hardest are exactly the ones carrying the hardest material:

- **Stage 2** (interval logic, triad construction from any root): 5 of 8 units are `XGT`. Zero
  tempo ladders in the whole stage.
- **Stage 3** (diatonic harmony, Roman numerals — described in the plan as "the learner's stated
  payoff moment"): 4 units `XGT`, zero tempo ladders in the whole stage.
- **Stage 4** (inversions, voice leading, hand independence): 4 units `XGT`.

So the practice model for the app's central intellectual content is: told once, done once, tested
once. That is a flashcard app's model. It is the correct model for "what is the key signature of
E major" and the wrong one for "your hand can find any inversion in any key in under 2.5 seconds,"
which is a motor skill and is what the exit criteria actually demand.

### 3.1 The explain step never touches the piano

152 explain blocks exist. The schema offers five block kinds; here is how they are used and what
they do:

| Block kind        | Uses      | What the learner does                                   |
| ----------------- | --------- | ------------------------------------------------------- |
| `text`            | 115 (76%) | reads                                                   |
| `keyboardDemo`    | 17        | clicks Play, watches the on-screen keyboard and listens |
| `progressionCard` | 8         | clicks chord chips to hear them                         |
| `circleOfFifths`  | 6         | looks at a diagram                                      |
| `earCheck`        | 6         | answers one multiple-choice listening question          |

**Not one explain block accepts MIDI input.** In the entire "Hear it / Name it" half of every unit,
the learner's hands are off the keys. And 34 of 68 units — half the course — have explain steps
that are _100% static text_ with no demo, no card, no diagram, no ear check at all.

`earCheck` — the interactive element for the strand the design lists **first** ("Hear it") — appears
**six times in 68 units**, and is a four-option multiple choice, which is the weakest form of ear
test available in an app that has a MIDI keyboard plugged into it.

This is the specific thing that reads as "not interactive." It is not the word count. It is that
the teaching half of every unit is a slide, and the interactivity is quarantined into the testing
half.

### 3.2 The tempo ladder is missing from 46 of 68 units

The ladder is the app's motor-learning mechanic — the Flowkey/Melodics idea the plan explicitly
borrows: play it at 60%, then 80%, then 100%, dropping back on errors. It exists, it is implemented
correctly, and it is used **22 times in 68 units**. It is entirely absent from stages 2 and 3.

Where it is used, the ramps are: `[0.6, 0.8, 1]` (11×), `[0.75, 1]` (10×), `[0.5, 0.75, 1]` (1×).
Half of all ladders are a single intermediate step, which is barely a ramp.

### 3.3 The create step is usually a sentence

21 create steps exist against a stated global rule that _"every unit's create step exists (the Make
strand is never skipped)"_ — so 47 units skip it. Worse, of the 21 that exist, **only 5 carry an
actual exercise** (all of them `improv`, all in stage 7). The other 16 are a text prompt with no
exercise attached, meaning the app prints a suggestion and does nothing:

> s3.u6 — "Hum any three long notes and harmonize each one two different ways."
> s5.u5 — "Loop i-VI-III-VII in A minor and find a melody in the right hand…"
> s6.u5 — "Play Cassette Summer three times: once boom-chuck, once ballad, once straight eighths."

These are good prompts. But there is no backing track, no drone, no recording, no metronome
context, no acknowledgement that anything happened. The learner reads a suggestion and clicks
Continue. The "Make" strand — one of five, and one of the four things the app is supposed to be for
— exists as printed encouragement in three quarters of the places it appears.

### 3.4 What scaffolding does exist

To be fair to what is there: every graded and ladder step offers **Retry** and, on failure only,
**Retry 25% slower**. Wait mode (88 of 179 exercise instances) genuinely waits per note. That is
real and it works. What does not exist anywhere: section or bar looping, per-hand isolation, a
"practise this slower because I want to" control when you passed, or any way to repeat a _part_ of
an exercise rather than the whole thing.

---

## 4. Inventory: what the 179 exercises actually are

| Generator          | Instances | Share |
| ------------------ | --------- | ----- |
| `progression-play` | 49        | 27%   |
| `scale-run`        | 29        | 16%   |
| `flashcard`        | 21        | 12%   |
| `chart-play`       | 15        | 8%    |
| `ear-progression`  | 14        | 8%    |
| `five-finger`      | 11        | 6%    |
| `grip-interleave`  | 9         | 5%    |
| `note-find`        | 8         | 4%    |
| `improv`           | 7         | 4%    |
| `ear-quality`      | 5         | 3%    |
| `chord-grip`       | 4         | 2%    |
| `unseen-chart`     | 4         | 2%    |
| `ear-degree`       | 3         | 2%    |

**Over a quarter of everything the learner ever does is "play these chords in time."** Add
`scale-run` and `chart-play` and it is half. The exercise vocabulary is narrow, and it is narrow in
a specific direction: it is all _harmonic pattern reproduction_. There is no generator for rhythm,
articulation, dynamics, hand independence, sight-reading rhythm, transposition-at-sight, call-and-
response, or error-diagnosis — and therefore no exercises of those kinds anywhere.

`ear-degree` — sing/play the scale degree you heard, the foundation of functional ear training —
is used **three times in the whole course**, all in stage 1.

### 4.1 Strand balance

Declared strand weights, summed across all units:

| Strand   | Total weight |
| -------- | ------------ |
| keys     | 138          |
| theory   | 80           |
| ear      | 37           |
| create   | 19           |
| **read** | **0**        |

The Read strand — one of the five pillars in the product one-pager — has **zero weight in the
entire curriculum**. This is traceable to a deliberate decision (`decisions.md`, 2026-09-02: the
notation atoms are registered but attached to no unit, opt-in via Settings), but the effect is that
a documented pillar of the product does not exist on the path.

Ear at 37 against keys at 138 means the ear strand is roughly a fifth of the course by the app's own
accounting, in an app whose stated endgame is playing by ear.

### 4.2 The weaning ladder has a rung that is never used

The design's central anti-"the app teaches the app" mechanic is the rung ladder:
`keys-lit → note-names → chord-symbols → lead-sheet → by-ear`. Actual usage across 179 exercises:

| Rung           | Uses  |
| -------------- | ----- |
| chord-symbols  | 73    |
| keys-lit       | 61    |
| by-ear         | 29    |
| lead-sheet     | 16    |
| **note-names** | **0** |

`note-names` is defined in the schema, referenced in the design as rung 2 of 5, and used **zero
times**. The ladder in practice is a three-rung ladder with a gap in it, and `lead-sheet` — the rung
that represents actually reading a chart like a musician — carries 9% of exercises.

Stage-by-stage the progression is broadly sane (s0 is 100% keys-lit; s7 is 12 by-ear against 3
keys-lit), so the _idea_ is working. But stage 5 regresses hard: 12 keys-lit exercises, more than
stage 2 has, because the all-12-keys scale work lights up the keys again. Whether that is correct
(new material, so drop a rung) or a regression (you should be able to find B♭ major without help by
stage 5) is a pedagogical call nobody made — it happened by default.

---

## 5. What's missing, ranked by how much it hurts

### A. Technique — the stated goal — is essentially absent

This is the largest gap between what the owner wants and what exists.

Everything in the app that could be called technique: posture as one paragraph of text (s0.u4),
thumb-under crossing (s1.u2), and one hand-independence ladder (s4.u5, atoms
`pattern:lh:rootfifth` and `pattern:lh:broken`). That is **two technique atoms in 138**.

There is no work on, and no generator capable of: finger independence, evenness of touch, hand
tension and release, wrist rotation, articulation (legato/staccato), dynamics (velocity is captured
from day one and explicitly _never graded_), pedalling (CC64 is tracked and explicitly ignored for
correctness), scale velocity beyond 100 BPM (the fastest tempo anywhere in the curriculum is 100),
contrary/parallel motion, or arpeggios across octaves.

Some of this is inherent: **MIDI cannot see your hands.** Fingerings are computed from a real table
(`theory/scales.ts`, standard published fingerings) and _displayed_, but can never be checked, so
the app cannot stop you learning a scale with the wrong fingers. That limitation is honest and
documented. But it means everything the app _could_ still measure about technique — evenness of
inter-onset intervals, velocity consistency across a run, timing under a rising tempo, note overlap
as a legato proxy, held-note release accuracy — is measurable from MIDI and **none of it is
measured**. The data is in the note-event log already.

### B. Rhythm is one atom

`rhythm:basic`, in s0.u6. That is the entire rhythmic curriculum. No eighth-note subdivision unit,
no rests, no dotted rhythms, no syncopation, no compound time, no counting drills, no clapping/tapping
input, no time signature other than 4/4 anywhere in the twelve songs. Swing appears once (s7.u5) as
a feel toggle, not as a rhythmic skill with its own ladder.

For an app whose stated pass bar is "the metronome, not the wait mode," rhythm is not taught. It is
only _tested_, as a side-effect score on harmonic exercises.

### C. Two hands is 15% of the course

| Stage     | rh      | lh     | both   |
| --------- | ------- | ------ | ------ |
| s0        | 16      | 3      | 0      |
| s1        | 18      | 2      | 2      |
| s2        | 18      | 0      | 1      |
| s3        | 19      | 0      | 2      |
| s4        | 15      | 1      | 4      |
| s5        | **32**  | 1      | 1      |
| s6        | 2       | 8      | 12     |
| s7        | 17      | 0      | 5      |
| **total** | **137** | **15** | **27** |

Two-hand playing is 27 of 179 exercises, and nearly half of those are in stage 6. Stage 5 — the
biggest stage in the course, 10 units, all twelve keys — is **32 right-hand exercises and one
two-hand exercise**. A learner arrives at stage 6 having played with both hands roughly nine times.

The left hand alone gets 15 exercises in the whole curriculum, 8 of them in stage 6.

This is the single most concrete way the course fails as _piano_ teaching rather than _keyboard-
shaped theory_ teaching. Piano is a two-hand instrument and the curriculum treats the left hand as
an accessory that shows up in stage 6.

### D. No diagnosis, only scoring

Every graded take produces accuracy × timing and a pass/fail against 0.8. Nothing anywhere tells
the learner _what went wrong in a way they can act on_: which finger crossing broke, whether they
rush or drag (and by how much, consistently), which chord in the progression costs them the most
time, whether the left hand or right hand is dragging the score down, whether errors cluster on
black-key roots. All of this is derivable from the stored note-event logs, which already exist for
replay. The app records everything needed for coaching and does none of it.

### E. The tempo ceiling is 100 BPM

91 tempo-mode exercises, tempo range 48–100 BPM. Nothing in the entire curriculum asks the learner
to play faster than 100 BPM. For scales, comping and blues that is a modest intermediate ceiling; a
learner who completes the whole path has never been asked to play fast.

### F. Repertoire

Twelve chord charts, no melodies, no arrangements, no real songs. Each is a roman-numeral-per-bar
skeleton plus an invented title and a genre blurb. `first-light` is `I V vi IV` sixteen times.

This costs more than it looks:

- **No melody data at all.** `chart-play` plays chords; s6.u6 "Melody on top" asks for RH melody over
  LH chords but the song objects contain no melody, so the exercise cannot be what its title says.
- **No recognition, no motivation, no transfer.** The reason to learn `I V vi IV` is that it unlocks
  hundreds of songs you already love. Stripping the songs out keeps the drill and discards the
  payoff.
- **No form beyond the loop.** Real songs teach intros, turnarounds, key changes, bridges that
  modulate, rhythmic hooks. Twelve four-bar loops teach none of it.

The song sourcing question (public domain, CC, licensed chart data, user import) is being researched
separately; it is a solvable problem and it is largely a _data_ swap, since the engine already reads
romans and transposes for free.

### G. Volume

Eleven hours. Stage 0 — "find middle C, learn the white keys, sit properly, play a five-finger
pattern in three keys, meet the metronome" — is **52 minutes**. That is not a beginner's first
month, it is a first sitting. Every stage is undersized by roughly an order of magnitude relative to
the skill it claims to install.

The FSRS review layer partly covers this (old atoms recur forever in new keys), but review is
review: it re-tests known material and never introduces new music.

### H. Every threshold is invented

Pass score 0.8. Unit minutes (6–15). Target BPMs. Timing tiers. Atom difficulty. The mapping from
take score to the FSRS grade. None of these were derived from anything or validated against a
learner. FSRS itself is empirically grounded; what is fed into it here is guesswork wearing a
number.

### I. At least one outright theory error

`s5.u3`: _"**m7♭5** is the seventh chord on the 7th degree of a major key — it is the vii of the
family, **and it leans hard on V**."_ A viiø7 in a major key is dominant-function and leans on **I**.
The m7♭5 that leans on V is **iiø7 in a minor key** — which is the reason the chord is worth
learning and is not mentioned. The sentence conflates the two.

`s2.u1` opens the interval unit with _"an interval is a distance in half steps, with a name"_ and
lists semitone counts. This collapses the generic-size/quality distinction (a major 3rd and a
diminished 4th are both four semitones) in the one unit whose design brief specifically says
"generic size **then** quality" — and it is the foundation the whole spelling engine of stage 2 is
built on.

I sampled roughly a third of the prose. I have no basis for estimating the error rate in the rest,
and neither does anything in the repo: **no musician has reviewed this text.**

### J. Documentation drift, ungated

`06-curriculum-content.md` no longer describes the app. Confirmed divergences: the "every unit has a
create step" rule (violated 47×), the per-interval atoms of s2.u1 (became two bundled atoms,
`P8` dropped), the ladder defaults, and the stage-by-stage timing tiers. Nothing checks any of this
— the zod schema validates _shape_, never _policy_. A curriculum lint (see §7) would have caught
every finding in §3 at commit time.

---

## 6. What is genuinely good

Worth stating plainly, because the list above is long:

- **The stage ordering is sound** and traceable to real pedagogy: the scale → interval → triad →
  function → inversion → seventh → voicing spine is the classical/jazz consensus, and the
  hear/name/play/read/make spiral is Hoffman's.
- **"Derive, don't memorize"** (stage 1 shapes → stage 2 spelling engine) is a genuinely good
  pedagogical arc and it is executed in the right order.
- **The prose is well written** — concise, opinionated, no filler, occasionally excellent
  (s5.u6 on why A/E/B are _easier_ under the hand than C is a real teacher's observation).
- **Wait mode, the rung ladder, the roman-numeral-first song representation and MIDI-answer ear
  training** are all correct design choices, correctly implemented.
- **Stage 7 is the best-built stage** — 6 of 21 create steps, 5 of 7 improv exercises, the most
  by-ear rungs. The improv content is the one place where the Make strand actually works.

The bones are right. The flesh is missing.

---

## 7. Recommendations, in priority order

1. **Fix the unit shape before adding anything.** Define a minimum grammar and enforce it in a
   curriculum lint test: every lesson unit must have ≥1 guided _and_ ≥1 ladder _and_ a create step
   with a real exercise attached. That single test invalidates ~40 units and forces the work.
2. **Make `explain` interactive.** Add a block kind that requires MIDI input — "play this back",
   "find the note I just played", "which of these two did I play". Target: no explain step in the
   course without at least one block that needs hands on keys. This is the direct fix for the
   complaint that started this audit.
3. **Build a technique strand.** New generators measuring what MIDI _can_ see: evenness (inter-onset
   deviation across a run), velocity consistency, legato overlap, release accuracy, independence
   (RH pattern against LH pattern). Attach it as a 5-minute daily warm-up block, not as stage
   content, so it accrues every day.
4. **Build a rhythm strand.** Subdivision ladders, rests, dotted figures, syncopation, tap-input
   exercises. It needs its own generator and its own atoms; it currently has one atom.
5. **Rebalance hands.** Every stage from 2 onward should have a two-hand exercise in every unit.
   Stage 5's 32:1 right-hand ratio is the specific thing to fix first.
6. **Real repertoire** (separate research in flight). Add a `melody` field to `Song` while you are
   there — s6.u6 currently cannot do what it claims.
7. **Diagnosis from the replay logs.** Rush/drag tendency, worst chord, weak hand, black-key error
   clustering. The data is already stored; this is analysis, not capture.
8. **Get the prose reviewed by a musician**, or at minimum add a theory-assertions test file that
   pins the claims each unit makes so they can be checked once and regressions caught.
9. **Raise the ceiling.** Tempo targets above 100 BPM, and a Stage 8 or an endless-mode content
   generator, so "finished" is not eleven hours away.
10. **Re-sync `06-curriculum-content.md`** with what exists, then gate it.

---

## 8. Corrections to my earlier verbal summary

For the record, three things I said before running the numbers were wrong or imprecise:

- I said there was "130 KB of lesson prose." That was file size including all exercise definitions.
  The actual prose is **3,453 words**. The app is not text-heavy.
- I said most units from stage 2 on were "read a paragraph, then take a graded test." More precisely:
  the modal unit is **explain → one guided rep → graded test** (19 units) — there _is_ a practice
  step, but exactly one, unscaffolded and untempoed. Only 2 lesson units (s2.u7, s3.u8) have a
  graded take with no practice step at all; the other 8 such units are checkpoints, where it is
  correct by design.
- My per-stage step counts were file-level `grep` counts, which conflated some step kinds. The
  tables in this document are extracted from the validated `CURRICULUM` object and supersede them.
