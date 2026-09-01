# Piano Learning — Master Plan

*A theory-first, MIDI-native learning path: from zero to fluent in the system of the keyboard — every scale, every chord, functional harmony — so that songs become something you can reason about ("oh, it's this chord, then this chord").*

*Research date: September 2026. All licenses and library versions verified at that time.*

---

## Table of contents

1. [Vision & goals](#1-vision--goals)
2. [Landscape research: what exists](#2-landscape-research-what-exists)
   - 2.1 Open-source projects
   - 2.2 Commercial apps
   - 2.3 The gap this project fills
3. [Product design](#3-product-design)
   - 3.1 Design principles
   - 3.2 The learning path (8 stages)
   - 3.3 Lesson grammar & exercise types
   - 3.4 The feedback engine
   - 3.5 Progress model: mastery, spaced repetition, skill ratings
   - 3.6 Gamification (the humane kind)
   - 3.7 Anti-patterns we explicitly avoid
4. [Tech stack](#4-tech-stack)
5. [Architecture](#5-architecture)
6. [What we borrow, and under what license](#6-what-we-borrow-and-under-what-license)
7. [Roadmap](#7-roadmap)
8. [Open questions & risks](#8-open-questions--risks)

---

## 1. Vision & goals

**The user story:** an adult beginner with a MIDI piano who doesn't want to grind through classical repertoire or copy falling notes. They want to *understand the keyboard as a system* — scales, intervals, chords and their inversions, the circle of fifths, why V pulls to I — and to be physically at ease executing those patterns in any key. Songs are learning vehicles along the way, not the end goal. The end goal is **fluency**: comp any lead sheet in any key, figure out a pop song's chords by ear in minutes, improvise coherently over a progression.

**What "done" looks like for a learner** (the terminal milestone):

- Play all 12 major scales and their relative minors, hands separately, with correct fingerings, in time.
- Build and play any triad or seventh chord (maj, min, dim, aug, maj7, m7, dom7, m7♭5) from any root, in any inversion, in under ~2 seconds.
- Given an unseen lead sheet with diatonic + seventh chords, deliver a steady, styled accompaniment at tempo.
- Name the Roman numerals of a typical pop progression by ear + keyboard, and transpose any known song to any key by functional thinking.
- Improvise a coherent chorus over a 12-bar blues and over I–V–vi–IV.

**Core theses** (each backed by the research below):

1. **Theory woven in, never a side-track.** Yousician bolted theory on as a skippable "Knowledge path" — users skip it. Theory must be the spine of the main path.
2. **Sound before symbol, always relative to the key.** Scale degrees and Roman numerals (Hooktheory / Hoffman / Improvise-For-Real style), color-coded consistently, so every concept transposes to all 12 keys for free.
3. **Application from week one.** Real songs, chord charts, and micro-improvisation appear in the first weeks on a tiny vocabulary — not as a graduation prize (the Siskind / Hooktheory model, contra classical grading).
4. **MIDI-first is a feature, not a limitation.** No mic flakiness; per-note pitch *and* timing *and* velocity feedback; per-hand analytics (Playground Sessions and Melodics prove this).
5. **The app must not teach the app.** Simply Piano's defining criticism is that graduates can't play away from the screen. We build explicit weaning: from highlighted keys → to chord symbols → to lead sheets → to playing by ear.

---

## 2. Landscape research: what exists

### 2.1 Open-source projects

The open-source field splits cleanly into three groups, none of which does the whole job:

**Group A — drill tools (interactive MIDI, no curriculum):**

| Project | What it is | Stack | License | Verdict |
|---|---|---|---|---|
| [ZaneH/piano-trainer](https://github.com/ZaneH/piano-trainer) | Scale/chord/circle-of-fifths practice + quiz modes, MIDI input | React + TS + Tauri (Rust) | **MIT** | ~2.2k★, alive. **Best code-borrowing target**: practice-mode UX, quiz/validation logic, circle-of-fifths component. Frontend is plain React/TS — ports to web by swapping Tauri MIDI for Web MIDI. |
| [philippotto/Piano-Trainer](https://github.com/philippotto/Piano-Trainer) | Sheet-reading trainer ("play what you see") with stats | ES6 React + VexFlow | **MIT** | Dormant, dated code; good blueprint for the VexFlow + Web MIDI feedback loop. |
| [TeemuKoivisto/midi-note-trainer](https://github.com/TeemuKoivisto/midi-note-trainer) | Notation-drilling games, Web MIDI | Svelte/TS monorepo | **MIT** | Small but well-factored packages (score rendering, MIDI handling, game loop) — extractable code. |
| [elbankster/MIDI-Piano-Chord-Trainer](https://github.com/elbankster/MIDI-Piano-Chord-Trainer) | Chord drills detecting quality + **inversion** + root | web | **no license** | Idea-only: the inversion-aware chord recognition UX is the takeaway. |
| [GNU Solfege](https://www.gnu.org/software/solfege/) | Ear trainer | Python | GPL | Idea-only: **exercises as plain-text lesson files** (exercise-as-data) — adopt the pattern, not the code. |

**Group B — song-following games (motivating, but teach imitation, not theory):**

| Project | What it is | License | Verdict |
|---|---|---|---|
| [sightread](https://github.com/sightread/sightread) | Polished falling-notes + sheet web app, Web MIDI | **GPL-3.0**, and went **closed** in March 2026 (public snapshot frozen) | Ideas/architecture reference only (unless we go GPL). Its open→closed trajectory is a market signal: a genuinely open alternative has a niche. |
| [PianoBooster](https://github.com/pianobooster/PianoBooster) | MIDI play-along that **listens and waits** — accompaniment follows your tempo; per-hand practice | GPL-3.0, C++ | Idea-only: the adaptive "score chasing" mechanic (music waits for the learner) is the single best pedagogical mechanic in open source. |
| Neothesia, noterain, MIDIano | Synthesia clones | GPL-3.0 / MIT / **not open** | UX references. Do not borrow from MIDIano (no license). |

**Group C — curriculum without interactivity:**

| Resource | What it is | License | Verdict |
|---|---|---|---|
| [Open Music Theory (OMT2)](https://viva.pressbooks.pub/openmusictheory/) | Complete college-level theory textbook + workbook | **CC BY-SA 4.0** | The best open source of theory *sequencing and explanatory text*. Adaptable with attribution + share-alike on the adapted content (does not infect app code). |
| [ftrain/sightreading](https://github.com/ftrain/sightreading) | Procedural sight-reading with a **23-level mastery-gated curriculum** (C-major fundamentals → rhythms → new keys by circle of fifths, each key cycling RH → LH → hands-together) | **LGPL-3.0** | Tiny but the closest thing to a guided open path. Copy the **curriculum-as-data architecture** (levels as data, mastery gates, procedural exercise generation), not the code. |
| [Open-Piano-Skills](https://github.com/Tieck14/Open-Piano-Skills) | YAML skill taxonomy: 131 skills, prerequisite graph, mastery levels | **CC BY-SA 4.0** | Brand new, quality unproven, but the only machine-readable open piano skill tree — a starting point to critique and refine. |
| [Mutopia Project](https://www.mutopiaproject.org/) | ~2,100 pieces as LilyPond source + MIDI | PD / CC | Programmatic pipeline for graded real repertoire later (excerpt, simplify, transpose — we have *source*, not scans). |

**Building-block libraries (the real gold — all healthy, all permissive):** tonal (MIT), WEBMIDI.js (Apache-2.0), Tone.js (MIT), VexFlow 5 (MIT), OpenSheetMusicDisplay (BSD-3), abcjs (MIT), smplr (MIT), @tonejs/midi (MIT), Dexie (Apache-2.0), ts-fsrs (MIT). Details in §4.

### 2.2 Commercial apps

What each one teaches us (full research in the appendix of history; distilled here):

- **Simply Piano** — lowest-friction onboarding; the Soloist-vs-Chords identity fork is smart. But it's the poster child for "the app teaches the app": shallow theory, fixed pacing, messy path after Essentials. *Anti-model for depth, model for onboarding.*
- **Yousician** — varied content types (lessons / missions / workouts / challenges) at varied durations = strong retention. But theory as a separate skippable path fails. *Weave theory into the trunk.*
- **Flowkey** — canonical **Wait Mode** (playback halts until you play the right note) + tempo ladder (wait → 50% → 75% → 100%) + section looping. Songs at 4 arrangement tiers = built-in spiral curriculum. But a library without a path leaves beginners lost.
- **Skoove** — clean **Listen → Learn → Play** lesson grammar; adaptive waiting (tempo follows the learner rather than hard-stopping). Closest big app to musical literacy.
- **Playground Sessions** — MIDI-only precision: per-note green/red, % scores, per-hand analytics. But improv/voicings only in the Advanced tier — we introduce them far earlier.
- **Piano Marvel** — **SASR**: an adaptive sight-reading rating over 90 micro-levels of always-fresh material, with an 80%-promotion rule; users track it like an ELO. *The best assessment mechanic in the space — portable to chord recognition, ear, harmonization.*
- **Melodics** — the best progression engineering: every piece decomposed into steps (parts → hands → tempo), and the most granular timing feedback anywhere (**early / late / perfect / missed** per note). Streaks with rest-day freezes.
- **Pianote / Hoffman Academy** — proof that theory + ear + improv woven into *every* unit works pedagogically (Hoffman's spiral: hear it → name it → play it → read it → make it). Their weakness — no real-time feedback — is exactly our strength. Nobody has built the adult, MIDI-native version of Hoffman. 
- **Hooktheory** — the most successful theory-first pedagogy for pop musicians: everything in scale degrees + Roman numerals with consistent colors, every concept proven immediately with a real song, chords introduced by frequency of use in real music (I → vi → IV/V → iii/ii), not by scale-degree order.
- **Theory/ear tools** (musictheory.net/Tenuto, Teoria, EarMaster, Functional Ear Trainer) — proven drill sequences and the key ear-training insight: **functional (scale-degree) ear training transfers to real playing; isolated interval drilling doesn't.** None connect to a MIDI keyboard or a curriculum.
- **Duolingo** (path design reference) — the 2022 single-linear-path redesign with **spaced review embedded in the forward path** and checkpoint tests measurably improved outcomes. Avoid: streak anxiety, XP grinding, hearts/lives (punishing mistakes suppresses the exploratory practice music needs).

### 2.3 The gap this project fills

**No open project — and arguably no product at any price — delivers a guided zero-to-fluency theory path with real-time MIDI interactivity.** Drill tools have feedback but no path; song apps have a path but teach imitation; the theory-integrated curricula (Hoffman, Pianote, Piano With Jonny) have no real-time feedback loop. The combination we're building:

> **Hoffman/Hooktheory pedagogy** (functional, sound-first, improv from day one)
> × **Melodics-grade MIDI feedback** (pitch + timing + velocity, per hand)
> × **Duolingo path structure** (linear, bite-size, spaced review embedded)
> × **Piano Marvel-style adaptive skill ratings** (from always-fresh generated material)

…has no direct competitor, open or commercial.

---

## 3. Product design

### 3.1 Design principles

1. **One linear path, embedded review.** Bite-size units grouped into stages; review nodes injected into the forward path so moving forward automatically means revisiting old material; checkpoint tests legitimize skipping. Kills "what do I practice next?" — the #1 reason adults stall.
2. **Spiral strands in every unit.** Each unit touches the same five strands at rising difficulty: **Hear it** (functional ear) → **Name it** (theory) → **Play it** (keyboard) → **Read it** (symbols/notation, introduced gradually) → **Make it** (2-minute improv/harmonization micro-task). Creation is routine from Unit 1, never an advanced tier.
3. **Relative thinking, color-coded.** Scale degrees 1–7 and Roman numerals get fixed colors used everywhere (keyboard highlights, chord charts, ear trainer). Concepts are taught relative to a key so they transpose for free.
4. **Derive, don't memorize.** The path deliberately moves from *shapes* (Stage 1: "this grip is C major") to a *spelling engine* (Stage 2: "stack thirds from any root") — the moment the learner stops copying and starts deriving is the product's core value.
5. **One key deep, then twelve keys wide.** Master the system in C (then G, D, F…), and only generalize to all 12 keys once the vocabulary is mature (circle-of-fifths grouping, which reinforces key signatures as a system).
6. **The mastery bar is the metronome, not the wait mode.** Wait mode is for first exposure only; every skill's pass criterion is the tempo-locked version. Comping *is* rhythm.
7. **Four-part mastery test** (from Improvise For Real) for every concept: *see it, play it in the relevant keys, recognize it by ear, use it in something musical.*
8. **Interleave aggressively, and say so.** Block briefly on first exposure, then drill in random keys/qualities ("E♭ major first inversion… now A minor root… now D7"). Interleaving feels worse but wins on retention — the UI explicitly tells the learner this so they don't revert.
9. **Wean off the screen.** Highlighted keys → note names → chord symbols → lead sheet → by ear. Every skill eventually gets re-tested at a higher weaning level.
10. **Respect the adult.** 15–30 min daily sessions (consistency beats volume; motor consolidation is sleep-dependent); checkpoint-skipping and a free-practice sandbox preserve autonomy; no hearts, no punishment for mistakes.

### 3.2 The learning path (8 stages)

Cross-cutting daily strands through **all** stages: (a) target 20–30 min/day; (b) 5 min functional ear training matched to the current stage; (c) spaced-repetition flashcards for declarative theory (key signatures, spellings); (d) one real song in progress at all times; (e) every item passes the four-part mastery test before being marked fluent.

> The concept spine below is the chain every tradition agrees on (ABRSM/RCM, jazz methods, Hooktheory, Michael New): *scale → interval → triad → diatonic function → inversion → seventh chords → voicings*. The pacing and framing follow the goal-aligned methods: application starts in week one, at adult speed.

**Stage 0 — Orientation & the 5-finger world** *(weeks, not months)*
- Keyboard geography (find any note instantly — the octave pattern, black-key landmarks), half/whole steps, posture and relaxed hand.
- 5-finger (pentascale) patterns in C, G, F, both hands. No thumb crossings yet.
- Basic rhythm with metronome (quarter/half/whole), sing scale degrees 1–5 while playing.
- **Exit:** play a 5-finger melody hands-separately in 3 keys steadily at 80 BPM; name any key on sight in <1.5s; clap and count basic rhythms.

**Stage 1 — The major scale as a system + first chords in one key**
- WWHWWWH formula; C major one octave with standard fingering; scale-degree names and colors.
- I, IV, V, vi as *shapes* in C; LH roots + RH block triads.
- **First real song from a chord chart, in C, within the first weeks.**
- **Exit:** C major scale hands-separately at 60 BPM; play and name I–IV–V–vi in C; accompany one real song from a chart; sing degrees 1–8 accurately.

**Stage 2 — Intervals & triad construction (the spelling engine)**
- Interval qualities (M/m/P) to an octave, spelled and played; build major/minor triads from **any** root by stacking thirds.
- Keys expand to G, D, F; the circle of fifths introduced as the *explanation* of key signatures.
- Ear: major vs minor triad quality.
- **Exit:** spell/play any major or minor triad from any root in <3s; identify M/m triads by ear >90%; G, D, F scales hands-separately with correct fingering.

**Stage 3 — Diatonic harmony & the Roman-numeral lens** *(the learner's stated payoff moment)*
- Triads on all seven degrees; the diatonic quality pattern (M–m–m–M–M–m–dim) as a transposable fact; Roman numerals; tonic/subdominant/dominant *function*.
- The big pop progressions: I–V–vi–IV, I–vi–IV–V, ii–V–I preview — each proven immediately against 5–10 real songs (Hooktheory-style analysis).
- Ear: hearing I vs IV vs V; "guess the progression of a song you know, verify at the keyboard."
- **Exit:** harmonize a diatonic melody in C/G/F; name the Roman numerals of a played progression in a known key; explain why V pulls to I.

**Stage 4 — Inversions & voice leading (the hands catch up to the theory)**
- All triad inversions as physical grips, blocked and broken, interleaved across learned keys.
- Voice leading — keep common tones, move minimally; re-play Stage-3 progressions smoothly (I–V6–vi–IV…). Inversions are taught *as the solution to a problem the learner now feels* (clunky root-position jumps).
- LH patterns (root–fifth, octaves, broken chords) against RH chords — the first serious hand-independence rung (the only rung a comping player strictly needs).
- **Exit:** play I–V–vi–IV and friends in 6+ keys with ≤1 hand-position shift per change, in time at 80 BPM; identify inversions visually and aurally.

**Stage 5 — Seventh chords, all 12 keys, minor keys**
- maj7, m7, dom7 (then m7♭5, dim7) built from interval logic; V7's pull; **ii–V–I as the cell of jazz/pop harmony**, in all 12 keys.
- Relative minor; natural/harmonic minor; minor progressions (i–VI–III–VII…).
- Scales completed in all 12 keys via circle-of-fifths groups. (All-12-keys waits until here deliberately: spend the interleaving budget generalizing a mature vocabulary, not fragile new material.)
- **Exit:** spell/play the four main 7th qualities from any root; ii–V–I in all 12 keys (closed voicings); 12 major scales + relative minors hands-separately at moderate tempo; identify 7th qualities by ear.

**Stage 6 — Lead-sheet comping craft** *(the integration stage)*
- Fluent chord-symbol reading (C, Cm, C7, Cmaj7, Cm7, Cdim, sus, slash chords).
- Textures: LH root + RH chords; shells (1–7 / 1–3); guide tones; style patterns (pop straight-8ths, boom-chuck, ballad broken chords, basic swing); RH melody over LH chords.
- Transpose whole songs by Roman-numeral thinking. Repertoire target: ~10 songs from lead sheets.
- **Exit:** given an *unseen* lead sheet (diatonic + 7ths), deliver a steady, styled accompaniment at tempo on first or second pass; transpose a known song to any key.

**Stage 7 — Improvisation & harmonic ear mastery** *(overlaps Stage 5–6; melodic improv over drones starts back in Stage 1)*
- Scale-degree melodic improv (Improvise-For-Real style: 3 notes → expand), chord-tone targeting over changes.
- 12-bar blues + pentatonic/blues scales as the low-stakes improv sandbox.
- Playing songs by ear end-to-end (find key → bass motion → qualities); functional transcription of simple pop songs.
- Light extensions (add9, sus, 6ths), rootless-voicing preview — the on-ramp to jazz resources (Levine becomes readable only now).
- **Exit = the terminal milestone in §1.**

### 3.3 Lesson grammar & exercise types

Every teachable item uses the same grammar (Skoove's Listen→Learn→Play, refined):

1. **Hear/see it** — short interactive explanation (animated keyboard + colored degrees; a real-song example where possible). Sound before symbol.
2. **Guided play (wait mode)** — the app highlights targets and waits per note. First exposure only.
3. **Tempo ladder** — metronome at 50% → 75% → 100%; drop back on errors; section looping and per-hand isolation always one tap away.
4. **Graded take** — the pass bar: tempo-locked, accuracy + timing scored. ≥80% promotes.
5. **Use it** — a micro creative task (harmonize two bars, improvise over a drone with the new material, play the new chord in a song).

**Exercise archetypes the engine must support:**

| Archetype | Example | Validation |
|---|---|---|
| Sequence drill | "Play the D major scale, RH, 1 octave" | Ordered pitch matching, fingering-agnostic (v1), tempo-checked |
| Grip drill | "Play E♭ major, 1st inversion" | Set matching via chord detection, inversion-aware, octave-flexible |
| Random interleave | "Random key/quality/inversion, 20 reps" | Same as above, generated by seed |
| Progression play | "I–V–vi–IV in G, smooth voice leading" | Per-chord set matching + voice-leading distance metric |
| Song/comping play-along | Chord chart scrolls with metronome/backing | Per-chord matching within timing windows |
| Ear → keyboard | Cadence establishes key; "play the degree you heard" / "play the progression you heard" | MIDI answer instead of multiple choice — our ear trainer's differentiator |
| Theory flashcard | "Key signature of E major?" / "Spell F#m7" | On-screen answer or MIDI answer; FSRS-scheduled |
| Quiz/checkpoint | Mixed items gating the next stage | Aggregate scoring, allows skipping ahead |
| Sight/read drill (later) | Play the displayed measure | VexFlow-rendered generated snippets |
| Improv sandbox | Drone/backing track + suggested palette | No scoring — safe failure; optional recording/replay |

### 3.4 The feedback engine

- **Input:** Web MIDI note-on/off with velocity + high-resolution timestamps; sustain pedal (CC64) tracked but ignored for correctness in v1; treat note-on velocity 0 as note-off; hot-plug device handling.
- **Pitch feedback:** per-note correct/wrong/extra/missed, colored on the on-screen keyboard (and staff when shown). Chord checking via `Chord.detect` — inversion-aware and octave-agnostic where the exercise allows.
- **Timing feedback (the Melodics lesson):** every note judged **early / late / perfect / missed** against the metronome grid, with tolerance windows that tighten as the skill matures. All timing math stays on the `performance.now()` / MIDI-timestamp clock (never mixed with `AudioContext.currentTime`).
- **Velocity:** captured from day one (for replay and later dynamics coaching), not graded in v1.
- **Graceful handling of real playing:** chord rolls within a tolerance window count as simultaneous; near-misses are marked, not punished.
- **Replay:** every graded take stores the raw note-event log, enabling "look what you couldn't do 4 weeks ago" replays — a direct counter to the competence-perception dropout driver.

### 3.5 Progress model: mastery, spaced repetition, skill ratings

Three interlocking systems:

1. **Mastery gates on the path.** Each unit's graded take needs ≥80% (accuracy × timing) at target tempo to unlock the next. Checkpoints every few units allow testing out (placement for not-quite-beginners).
2. **FSRS-scheduled review** (`ts-fsrs`, the modern Anki algorithm). Every skill atom — "D major scale HS," "F#m triad 2nd inversion," "ii–V–I in B♭," "key signature of E" — is a card. Attempt quality (accuracy + tempo) maps to Again/Hard/Good/Easy. Due cards are woven into the daily session as its review third (roughly: ⅓ new, ⅓ recent, ⅓ old-material maintenance in random keys — matching the practice-science literature).
3. **Adaptive skill ratings (the SASR mechanic, generalized).** Per-strand numeric ratings — *Scales*, *Chord fluency*, *Progressions/harmony*, *Ear*, *(later) Reading* — driven by always-fresh generated items with an 80%-promotion rule. Honest, visible progress numbers that can't be gamed by replaying known content; the anti-"teaching to the app" mechanic.

**Sessions come in shapes** (Yousician's lesson): full lesson (~15–20 min), 5-minute workout (due FSRS reviews only), challenge (rating climb), free sandbox. There is always a session that fits the available time.

### 3.6 Gamification (the humane kind)

- Streaks **with** rest-day freezes; reward *what* improved (skill-rating deltas, weekly recap), never raw XP.
- Badges tied to musical milestones ("harmonized a melody in 3 keys," "first blues chorus"), not activity counts.
- Per-strand progress bars + the skill ratings as the primary "number that goes up."
- No hearts/lives, no XP leaderboards, unlimited retries. Improvisation learning requires safe failure.

### 3.7 Anti-patterns we explicitly avoid

1. Teaching the interface, not music (no permanent falling-note crutch; explicit weaning ladder).
2. Theory as a skippable silo.
3. Fixed pacing with no way to loop/slow a hard bar (loop + tempo always one tap away).
4. The post-beginner cliff: Stages 4–7 (voicings, styles, transcription, improv) are designed first-class, not leftover content.
5. Score-chasing over musicality (timing feel and creative-task completion count, not just pitch %).
6. Streak anxiety / metric gaming.
7. Punishing mistakes.
8. Input flakiness: MIDI-only, with rolls/pedal/near-miss handled gracefully.
9. Invisible progress (ratings, recaps, replays of old takes).
10. Zero autonomy (checkpoint skipping + sandbox alongside the guided path).

---

## 4. Tech stack

**Platform decision: pure web app (PWA), not Tauri.** piano-trainer uses Tauri, but Tauri's macOS webview is WebKit — no Web MIDI inside it — forcing a Rust `midir` bridge. Pure web on Chromium/Firefox needs zero install and zero Rust. The MIDI layer is a small adapter interface, so a Tauri wrap stays possible later if desktop packaging is ever wanted.

**Supported platforms (v1):** desktop Chrome / Edge / Firefox. **Safari and all of iOS have no Web MIDI** (WebKit has refused it for years; no roadmap) — detect and show a friendly compatibility notice. Firefox has a quirky one-time "site permission add-on" flow — show one line of guidance.

| Layer | Choice | License | Why |
|---|---|---|---|
| Framework | **Vite + React + TypeScript** | MIT | Pure client-side interactive tool; no SSR friction with browser-only MIDI/audio APIs; biggest example ecosystem for this exact domain |
| State | **zustand** | MIT | Store writable from non-React MIDI callbacks; `subscribe` lets the exercise engine react to notes outside React; avoids re-render storms |
| MIDI input | **webmidi** (v3, behind a thin adapter module) | Apache-2.0 | Parsed noteon/noteoff/CC events, normalized velocity, device hot-plug |
| Theory engine | **tonal** (v6) | MIT | Scales, chord dictionaries, `Chord.detect` (inversion-aware), `Key`, Roman numerals, `Progression`, MIDI↔note conversion — the entire theory brain, don't reimplement any of it |
| Piano sound | **smplr** (`SplendidGrandPiano`) | MIT | One-line realistic velocity-layered piano; successor to the archived soundfont-player. Trigger immediately (never through a scheduler) for live echo; app audio muteable (players may use keyboard's own sound) |
| Metronome/transport | raw WebAudio click first; **Tone.js** when backing tracks arrive | MIT | Tone's Transport is excellent but overkill day 1 |
| Keyboard UI | **Custom SVG component** (~150 lines) | ours | react-piano is dead (~6 years); the keyboard is our core UX — target/played/wrong colors, degree colors, finger numbers, velocity shading. State = `Map<midiNumber, KeyState>` |
| Notation (later) | **VexFlow 5** (EasyScore) | MIT | Ideal for programmatically generated single-measure exercises. abcjs (MIT) is a simpler fallback; OSMD (BSD-3) only if full MusicXML scores ever arrive. Notation is *optional* for v1 — the keyboard carries the pedagogy |
| Storage | **Dexie.js** (IndexedDB) | Apache-2.0 | Attempts, note-event logs, FSRS card state, completion; `useLiveQuery`; Dexie Cloud is the future sync path if ever needed. localStorage only for tiny prefs |
| Spaced repetition | **ts-fsrs** | MIT | Canonical TS implementation of FSRS (modern Anki scheduler) |
| MIDI files (if ever) | @tonejs/midi | MIT | Not needed for v1 — exercises are generated from theory |
| Distribution | **PWA** via vite-plugin-pwa | MIT | Installable, offline (cache app + samples) |

**Known gotchas** (from research, so we don't rediscover them):
- `AudioContext` starts suspended — resume on a real click (MIDI note-on doesn't count as a user gesture).
- Two clocks: score rhythm in `performance.now()` / MIDI timestamps; schedule audio in `AudioContext.currentTime`; never compare raw values.
- Note-on velocity 0 = note-off (the #1 beginner MIDI bug).
- CC64 sustain: ≥64 down; route to the sampler, ignore for correctness, but log it.
- Don't push every MIDI message through React state; batch in zustand and derive UI.
- Listen for `statechange` (keyboards get turned on after page load); persist the chosen device id.

---

## 5. Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  midi/ (adapter over webmidi — swappable if Tauri ever needed) │
│    → note-on/off/CC events with perf-clock timestamps          │
└───────────────┬────────────────────────────────────────────────┘
                ▼
┌────────────────────────────────────────────────────────────────┐
│  store/ (zustand): active-note set, event log, device state    │
└───────┬───────────────────┬───────────────────┬────────────────┘
        ▼                   ▼                   ▼
┌───────────────┐  ┌─────────────────┐  ┌───────────────────────┐
│ ui/keyboard   │  │ audio/ (smplr   │  │ engine/               │
│ (SVG, colors  │  │ echo, metronome)│  │  matcher (tonal):     │
│ by degree/    │  └─────────────────┘  │  sequence & set match,│
│ state)        │                       │  timing windows       │
└───────────────┘                       └──────────┬────────────┘
                                                   ▼
┌────────────────────────────────────────────────────────────────┐
│  curriculum/ — stages → units → exercises AS DATA (TS/JSON):   │
│  { id, prerequisites, strand, generatorParams, passCriteria }  │
│  exercise generators (tonal-driven, seeded)                    │
└───────────────┬────────────────────────────────────────────────┘
                ▼
┌────────────────────────────────────────────────────────────────┐
│  progress/ — attempt results → ts-fsrs scheduling + skill      │
│  ratings + mastery gates → Dexie (IndexedDB)                   │
└────────────────────────────────────────────────────────────────┘
```

Key architectural commitments:
- **Curriculum as data** (the GNU Solfege / ftrain-sightreading lesson): stages, units, and exercises are declarative TS/JSON with prerequisite links and generator parameters — adding a unit never means writing engine code.
- **Generators over assets:** exercises are generated from theory (seeded for reproducibility), which is what makes the SASR-style always-fresh ratings possible.
- **The matcher is small and ours:** expected pitch sets/sequences from tonal, compared against the event log with simultaneity/roll tolerance and timing windows. This is the heart of the app; keep it pure and unit-tested.

---

## 6. What we borrow, and under what license

**Adopt wholesale (permissive):**
1. **tonal** (MIT) — the theory brain.
2. **webmidi** (Apache-2.0), **smplr** (MIT), **Tone.js** (MIT), **VexFlow 5** (MIT), **Dexie** (Apache-2.0), **ts-fsrs** (MIT).
3. **ZaneH/piano-trainer** (MIT) — lift/port practice-mode components, quiz logic, circle-of-fifths UI (swap Tauri MIDI → webmidi).
4. **TeemuKoivisto/midi-note-trainer** (MIT) — extractable MIDI/game-loop code patterns.

**Adapt content (share-alike, content-only — does not infect app code):**
5. **Open Music Theory** (CC BY-SA 4.0) — lesson sequencing and explanatory text, with attribution; adapted text stays CC BY-SA.
6. **Open-Piano-Skills** (CC BY-SA 4.0) — starting skill-graph to critique/refine.
7. **Mutopia** (PD/CC) — LilyPond sources for a graded-repertoire pipeline later.

**Ideas only (GPL/LGPL/unlicensed — no code copying):**
8. **PianoBooster** (GPL) — adaptive "music waits for you" following.
9. **sightread** (GPL, closed) — falling-notes/song-following UX reference.
10. **ftrain/sightreading** (LGPL) — curriculum-as-data architecture and mastery-gate level design.
11. **elbankster's chord trainer** (no license) — inversion-aware chord-drill UX.
12. **Hooktheory / Hoffman / Melodics / Piano Marvel / Duolingo** — pedagogy and mechanics as described in §2.2/§3 (patterns, not assets).

**Never copy from:** MIDIano (explicitly not open source); any GPL project unless we decide to license the whole app GPL (see §8).

---

## 7. Roadmap

Milestones sized for solo "vibe-coded" development; each one is usable on a real MIDI piano the day it ships.

**M0 — Spike (the walking skeleton)**
Vite+React+TS scaffold · MIDI adapter + device picker + hot-plug · SVG keyboard rendering live input · smplr echo · deploy as static site.
*Success: plug in the piano, see and hear your notes in the browser.*

**M1 — The matcher + first drills**
Exercise engine (sequence + set matching, wait mode) · scale drill and chord-grip drill generated by tonal · metronome + tempo-locked graded takes with early/late/perfect timing feedback · attempt storage in Dexie.
*Success: "play the D major scale at 80 BPM" is a real, scored exercise.*

**M2 — The path (Stages 0–2)**
Curriculum data model + linear path UI with mastery gates · Stage 0–2 units authored (orientation, 5-finger, C major system, intervals/triad spelling engine) · Listen→Learn→Play→Use lesson grammar · degree color system.
*Success: a true beginner can start at zero and be carried through their first weeks.*

**M3 — Memory & honest progress**
ts-fsrs integration (skills as cards, session = new/recent/old thirds) · 5-minute workout session shape · first adaptive skill rating (chord fluency) · weekly recap.
*Success: the app decides what you should practice today, and the number that goes up can't be gamed.*

**M4 — Harmony payoff (Stages 3–4)**
Diatonic harmony + Roman numeral units · progression exercises with voice-leading scoring · functional ear trainer (cadence → play-the-degree / play-the-progression, MIDI answers) · chord-chart song play-along (first real songs) · improv sandbox with drone.
*Success: the "oh, it's I then vi then IV" moment happens inside the app.*

**M5 — All twelve keys (Stage 5) + polish**
Seventh chords, minor keys, all-keys interleaved drills, ii–V–I everywhere · checkpoints/placement tests · PWA offline · streaks with freezes, badges, replay of old takes.

**M6 — Comping & improv (Stages 6–7)**
Lead-sheet renderer + unseen-lead-sheet challenges · style comping patterns with backing (Tone.js Transport) · blues/pentatonic improv track · play-by-ear ladder · VexFlow notation strand (optional weaning into reading).

**Deferred until it hurts:** accounts/sync (Dexie Cloud), MusicXML/OSMD, mobile (blocked by iOS Web MIDI anyway), velocity/dynamics grading, MIDI-file import.

---

## 8. Open questions & risks

1. **Our own license.** Staying MIT/Apache keeps all planned borrowing legal and maximizes reuse by others; going GPL-3.0 would let us copy from sightread/PianoBooster but constrains the future. **Recommendation: MIT for code; adapted OMT curriculum text lives in clearly marked CC BY-SA content files.**
2. **Curriculum authoring is the real work.** The engine is weeks; writing good Stage 0–7 units (explanations, examples, song choices) is the long pole. Mitigation: curriculum-as-data + mine OMT/Hooktheory-style sequencing; author Stage 0–2 fully before building fancier engine features.
3. **Real-song content rights.** Chord progressions aren't copyrightable, but lyrics/melodies/recordings are. v1 uses progression references ("the Axis progression — as heard in…"), public-domain melodies, and Mutopia material; no copyrighted audio.
4. **Rhythm-first risk.** Timing windows that are too strict early will frustrate; too loose and the wait-mode deficit returns. Plan: generous windows in Stages 0–1, tightening per skill maturity; tune on real use.
5. **Solo-learner blind spots.** MIDI can't see tension, posture, or fingering (only infer it). The app should honestly say so and point to periodic human check-ins / video self-review rather than pretend completeness.
6. **Scope discipline.** The research shows every competitor died at the intermediate cliff or bloated before nailing the loop. The loop is: *daily session → drill with great feedback → visible mastery*. Everything else waits until that loop is genuinely good (M0–M3).

---

*Companion references: the four research reports behind this plan (open-source landscape, commercial app analysis, pedagogy synthesis, tech-stack evaluation) are summarized inline; primary sources are linked throughout.*
