# 08 — Build Order

Phases are strictly ordered; each ends with its acceptance criteria demonstrably passing (automated where stated). Commit per task; tag per phase (`v0.P`). Keep `docs/decisions.md` current.

## Phase 0 — Skeleton & rails
**Tasks**
1. Scaffold Vite+React+TS; strict tsconfig; ESLint (flat, typescript-eslint, import-order + dependency-direction rule) + Prettier; Vitest; Playwright (chromium at `/opt/pw-browsers/chromium` if env var set).
2. `styles/tokens.css` + `global.css` complete per 05; theme switching (`data-theme`, system-follow).
3. Router + AppShell + sidebar with all routes stubbed; error boundary; Toast system.
4. CI (GitHub Actions): install, lint, typecheck, vitest, playwright smoke, build.

**Accept:** `npm run check` (lint+type+test) green in CI; all routes render placeholder screens with no console errors (Playwright); theme toggle works and persists.

## Phase 1 — MIDI in, sound out
**Tasks**
1. `midi/` adapters (webmidi, computer-keyboard, fake) + `midiStore` (activeNotes Set, ring buffer, dedupe, ingest wiring).
2. `audio/sampler.ts` (smplr, unlock flow, load progress) + direct echo path; `audio/clock.ts`.
3. `ui/Keyboard` full component per 05 contract (pressed/targets/judgments/degreeTint/labels/ghost), perf-tested.
4. Setup screen + onboarding steps 1–3; MIDI status dot; settings rows for device/sound.

**Accept:** real keyboard press → key lights <16ms and sounds <35ms (manual); `?midi=fake` script lights keys in Playwright; computer-keyboard fallback plays; hot-plug toast works; Keyboard stays 60fps under 30 notes/s (fake stress script, measured via `PerformanceObserver` in a dev harness page).

## Phase 2 — Theory + engine core
**Tasks**
1. `theory/` wrappers (notes/scales incl. fingering table for all majors + minors, chords incl. detect, keys, progressions, degrees).
2. `engine/`: rng, types, generators `scale-run`, `five-finger`, `chord-grip`, `grip-interleave`, `flashcard`; wait & tempo matchers; timing tiers; scoring; replay.
3. `audio/metronome.ts` with beat grid feeding tempoMatcher; count-in.
4. `runStore` + a dev-only `/lab` route: pick generator/params, run it live (this harness stays forever — it's the exercise debugger).

**Accept:** Vitest suites of 01 §Testing (theory tables, all stream fixtures, scoring goldens) green with ≥90% coverage on `theory/`+`engine/`; in `/lab`, "D major scale RH @80, standard tier" is fully playable with correct judgments via fake scripts AND a real keyboard.

## Phase 3 — Lesson player + curriculum rails
**Tasks**
1. `curriculum/schema.ts` (+zod), `path.ts` (unlock, auto review-node insertion), content validation test suite.
2. Lesson player (`/lesson/:unitId`): all five step kinds, TransportBar, tempo pips, Results overlay, hint ladder, fail-3 flow, focus mode.
3. Explain-block renderers: text (markdown-lite), keyboardDemo (ghost playback), progressionCard, circleOfFifths (SVG, reusable), earCheck.
4. Author **Stage 0 complete** (content/stage0.ts) + `songs.ts` scaffold.
5. `progress/db.ts` + unitProgress writes + Path screen v1 (nodes, states, intro card).

**Accept:** a fresh profile can complete all of Stage 0 end-to-end with fake MIDI in Playwright (scripted full run, asserts pass states in Dexie); curriculum validation test enforces referential integrity; review nodes appear after 3rd unit.

## Phase 4 — Memory & the daily loop
**Tasks**
1. `progress/atoms.ts` (registry + difficulty rule), `fsrs.ts` (mapping incl. per-atom sub-scores), fluency calc.
2. `sessionBuilder.ts` + Today screen (session card, blocks, resume, workout mode, catch-up banner) + drill player chrome.
3. Streaks + freezes; settings dailyMinutes; onboarding step 4 (start-from-zero path; placement deferred to Phase 6).
4. Take pruning; export/import JSON in Settings.

**Accept:** sessionBuilder Vitest scenarios (fresh day, mid-day resume, 25-due catch-up, 10-min budget) green; simulated 14-day usage script (Vitest, mocked clock) shows FSRS intervals growing for well-played atoms and shrinking on failures; streak/freeze math tested.

## Phase 5 — Stages 1–2 + degrees + first songs
**Tasks**
1. Author Stage 1 & Stage 2 fully, incl. `song:first-light`; degree color system live in Keyboard + DegreeBadge + prompts.
2. `chart-play` generator + song player screen + Songs library (gating).
3. Ear foundations: `ear-degree`, `ear-quality` generators with audio preview via sampler; earCheck blocks.
4. Latency calibration flow.

**Accept:** full Playwright run through s1.u5 with fake MIDI; ear exercises answerable via keyboard (fake + real); transposed chart plays in G; calibration stores and matcher applies offset (unit test).

## Phase 6 — Harmony payoff (Stages 3–4) + sandbox + checkpoints/placement
**Tasks**
1. Author Stages 3–4; `progression-play` (incl. `acceptAlternatives` harmonization mode), `ear-progression`, voiceLeading scoring.
2. Sandbox all three tabs (chord explorer w/ live detect, drone improv, progression looper — looper uses metronome grid + sampler comp pattern).
3. Checkpoints + placement flow in onboarding; passed* amber state.
4. Improv `create` steps recording to replays.

**Accept:** vl-scoring unit tests (ideal vs clunky voicing streams); harmonization accepts documented alternative answers; placement lands a "knows C major basics" scripted profile at Stage 2 start; sandbox chord explorer names inversions correctly for 20 test voicings.

## Phase 7 — The whole map (Stage 5) + ratings + PWA + polish pass 1
**Tasks**
1. Author Stage 5 (all keys); minor scales/fingerings; `song:ember`, `round-the-circle`.
2. `ratings.ts` + challenge screen + Progress screen v1 (dials, heatmap, sparklines).
3. Badges + weekly recap; replay player + then-vs-now pairing.
4. PWA (vite-plugin-pwa, sample caching, offline banner); licenses page; empty/edge states audit vs 05 list.

**Accept:** rating ladder property tests (promote/demote paths, floor); offline reload works with sound after first visit (manual + Playwright offline emulation for app shell); heatmap reflects seeded Dexie fixtures; Lighthouse PWA installable.

## Phase 8 — Comping & endgame (Stages 6–7) + notation strand
**Tasks**
1. Author Stage 6 (voicings/comp patterns — comp patterns are beat-grid exercise variants of progression-play w/ pattern rhythm targets) + generated unseen-chart generator + Stage 7 (improv units, blues, swing metronome mode, find-key/transcription exercises, epilogue).
2. `read-snippet` generator + `ui/StaffSnippet` (VexFlow 5) + optional Read strand toggles in Settings; read rating strand.
3. Backing loops for improv (Tone.js Transport introduced here; comp pattern playback).
4. Final polish: animation audit, reduced-motion audit, copy pass over all learner-facing text, a11y pass (keyboard nav through every screen, focus traps in overlays).

**Accept:** unseen-chart generator produces valid, playable charts across 50 seeds (validation test); full-path Playwright marathon (scripted fake-MIDI "perfect student" completes s0→s7.cp; asserts epilogue + all gates); axe-core scan no serious violations; bundle < 450KB gz before samples/vexflow chunks (both lazy).

## Ongoing rules
- Never merge with red `npm run check`.
- Any schema change: Dexie version bump + migration + migration test.
- Any new generator: fixtures + `/lab` support in the same PR.
- Content PRs (`content:`) may not touch engine code.
