# Status — session handoff

_Last updated: 2026-09-02. For a fresh session: read [IMPLEMENTATION.md](../IMPLEMENTATION.md), then this file, then continue with the next phase in [docs/implementation/08-build-order.md](implementation/08-build-order.md)._

## Where the build stands

**Phases 0–5 of the build order are complete and verified.** The app is a working product: a learner with a MIDI keyboard (or the QWERTY fallback / `?midi=fake` test adapter) can onboard, be carried through Stages 0–2 of the curriculum with real-time pitch+timing feedback, get FSRS-scheduled daily review sessions, play songs from transposable charts, and calibrate their setup's latency.

| Phase | State | Proof |
|---|---|---|
| 0 — Skeleton & rails | ✅ | `npm run check` green; smoke e2e; CI workflow |
| 1 — MIDI in, sound out | ✅ | smoke e2e (fake adapter, status dot, wizard) |
| 2 — Theory + engine | ✅ | ~100 unit tests, ≥90% coverage on theory/engine; `e2e/lab.spec.ts` |
| 3 — Lesson player + curriculum | ✅ | `e2e/stage0.spec.ts` (full Stage 0 marathon) |
| 4 — Memory & daily loop | ✅ | progress unit tests (FSRS sim, streaks, session builder); `e2e/daily.spec.ts` |
| 5 — Stages 1–2, songs, ear, calibration | ✅ | `e2e/stage1.spec.ts` (Stage 1 drive + transposed song) |
| 6 — Stages 3–4, sandbox, checkpoints/placement | ⬜ next | see 08-build-order Phase 6 |
| 7 — Stage 5, ratings, PWA, polish | ⬜ | |
| 8 — Stages 6–7, notation, endgame | ⬜ | |

## What exists (map)

- `src/theory/` — tonal wrappers: notes/keys/degrees/chords (inversion-aware detect)/scales (fingering tables)/progressions. Pure, tested.
- `src/engine/` — generators (`scale-run`, `five-finger`, `chord-grip`, `grip-interleave`, `flashcard` spell+interval, `note-find`, `ear-degree`, `ear-quality`, `progression-play`, `chart-play`), wait/tempo matchers, timing tiers, scoring, take recorder, calibration helper. Pure, tested. Songs reach `chart-play` via `registerSongProvider` (no upward imports).
- `src/curriculum/` — zod schema + validator, Stages 0–2 authored (`content/stage{0,1,2}.ts`), song catalog (`content/songs.ts`), path logic with auto review nodes.
- `src/progress/` — Dexie v1 (`db.ts`), atom registry + difficulty rule, ts-fsrs wrapper, session builder, streaks, service layer.
- `src/store/` — settings (localStorage), midiStore (adapters+dedupe+rAF batching), runStore (drives matchers, metronome, ear-preview listening gate), runTestBridge (`window.__runTest`).
- `src/features/` — welcome wizard, setup, Today (session card/streaks), Path, lesson player (5 step kinds, results overlay, fail-3 escape), drill player, songs library+player, settings (goal/sound/calibration/data), `/lab` (exercise debugger — keep forever).
- `e2e/` — `drive.ts` is the shared fake-MIDI lesson driver; marathons in `stage0/stage1.spec.ts`.

## How to verify from scratch

```
npm ci && npm run check && npm run build && npx playwright test
```
(Playwright uses `/opt/pw-browsers/chromium` in sandboxes, installs its own in CI. The two marathon specs take ~3 min each.)

## Known gaps / notes for the next session

- Phase 6 is next: Stages 3–4 content, voice-leading scoring, `acceptAlternatives` harmonization, sandbox (chord explorer / drone / looper), checkpoint-based placement in onboarding.
- `earCheck` explain-block renderer is stubbed (schema exists, no content uses it yet).
- Choice-mode flashcards (key signatures) deferred — spelled drills cover Stage 2.
- Review nodes on the path show a toast; wiring them to the drill player is trivial now that `/drill/:sessionId/:blockIdx` exists (route a synthetic workout).
- `docs/decisions.md` logs deviations from the spec docs; keep appending.
- Real-hardware pass still pending: latency feel, timing-window tuning on an actual keyboard (see 00-overview quality bar). The calibration panel exists in Settings.
