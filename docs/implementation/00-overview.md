# 00 — Overview

## Product one-pager (the finished state)

**Name (working):** *Keysense* (rename freely in one place: `src/app/brand.ts`).

**What it is:** a web app (PWA) for desktop Chrome/Edge/Firefox that connects to a MIDI piano and carries an adult beginner through a guided, theory-first path — from finding middle C to comping any lead sheet in any key and improvising over progressions. Exercises are generated from music theory (not canned assets), feedback is per-note pitch + timing + hand, review is scheduled by FSRS, and honest progress is shown as per-strand skill ratings driven by always-fresh material.

**The five strands** woven through every unit: **Hear** (functional ear), **Name** (theory), **Play** (keyboard execution), **Read** (symbols → charts → notation), **Make** (harmonize/improvise).

**The core loop (this must be excellent before anything else matters):**
plug in piano → "Today's session" → drill with great real-time feedback → visible mastery movement → tomorrow's session is automatically right.

## Experience pillars

1. **Instant legibility.** At any moment the learner knows: what to play, how they did, and why it matters. One primary action per screen.
2. **The keyboard is the hero.** The on-screen keyboard is the largest element in every practice context; notation and text serve it, not vice versa.
3. **Calm, precise, musical.** Dark "stage" aesthetic, restrained motion, no confetti spam. Feedback is immediate and specific, never punishing. Mistakes cost nothing but information.
4. **Relative color everywhere.** Scale degrees 1–7 have fixed colors used identically on keys, chord symbols, staff, and the ear trainer. The learner's eye learns the system by osmosis.
5. **Wean off the screen.** Every skill climbs the ladder: highlighted keys → note names → chord symbols → lead sheet → by ear. The UI visibly celebrates moving up a rung.

## Quality bar (non-functional requirements)

| Area | Requirement |
|---|---|
| Input latency | MIDI note-on → visual key press < 16ms (one frame); → audio echo < 35ms typical |
| Rendering | Keyboard + feedback at 60fps during play; no React re-render of the app tree per note event |
| Startup | Cold load to interactive < 3s on a mid laptop; samples lazy-load with progress indicator |
| Offline | Full app + piano samples + curriculum usable offline after first visit (PWA) |
| Data safety | All progress local (IndexedDB); export/import of full progress as a JSON file from Settings |
| Accessibility | Full keyboard (computer) operability; visible focus; color never the only signal (numerals/labels always paired); respects `prefers-reduced-motion` |
| Browser gates | No Web MIDI → friendly explainer screen (still allows browsing curriculum + computer-keyboard fallback for non-timing exercises). Firefox → one-line hint about its permission add-on flow |
| Code | TypeScript `strict`; ESLint + Prettier clean; engine/theory/progress ≥ 90% line coverage in Vitest; Playwright smoke suite green |

## Glossary (use these terms consistently in code and UI)

| Term | Meaning |
|---|---|
| **Stage** | One of the 8 macro-phases of the path (0–7). |
| **Unit** | A lesson node on the path (~10–20 min). Belongs to a stage. Has lesson steps and a graded take. |
| **Lesson step** | One screen of a unit: `explain`, `guided`, `ladder`, `graded`, `create`. |
| **Exercise** | A concrete generated task instance (e.g., "D major scale, RH, 1 octave, 80 BPM"). |
| **Generator** | Pure function producing an `ExerciseInstance` from params + seed. |
| **Skill atom** | The smallest tracked skill (one FSRS card), e.g. `chord:Eb:maj:inv1`. |
| **Strand** | One of `ear`, `theory`, `keys`, `read`, `create` (the spiral strands) — also the rating categories. |
| **Take** | One recorded attempt at an exercise (note-event log + scores). |
| **Wait mode** | Untimed guided mode: playback/advance waits for the correct note(s). |
| **Tempo mode** | Metronome-locked mode; timing is scored. The pass bar. |
| **Weaning rung** | Prompt level of an exercise: `keys-lit` → `note-names` → `chord-symbols` → `lead-sheet` → `by-ear`. |
| **Session** | A generated daily practice plan (warmup / new / review / create blocks). |
| **Rating** | Per-strand adaptive skill number (ladder level × 10), driven by fresh generated items. |

## Decisions log

Create `docs/decisions.md`. Every time the implementing agent makes a choice not covered by these docs, append: date, decision, alternatives considered (one line), and which doc section it extends. Keep entries to 3 lines.

## Out of scope for v1 (do not build)

Accounts/cloud sync; mobile layouts (<1024px gets a "desktop + MIDI required" notice with read-only curriculum browsing); microphone input; MusicXML import; velocity/dynamics grading (velocity is *recorded*, not graded); social features; monetization.
