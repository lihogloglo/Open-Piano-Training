# Status — session handoff

_Last updated: 2026-09-02 (Phase 6). For a fresh session: read [IMPLEMENTATION.md](../IMPLEMENTATION.md), then this file, then continue with the next phase in [docs/implementation/08-build-order.md](implementation/08-build-order.md)._

## Where the build stands

**Phases 0–6 of the build order are complete and verified.** The app carries a learner through Stages 0–4: onboarding (with a real placement flow through the checkpoint chain), real-time pitch+timing feedback, FSRS-scheduled review, songs with LH/RH textures, voice-leading-scored smooth progressions, melody harmonization with multiple valid answers, progression ear training, and a three-tab sandbox.

| Phase | State | Proof |
|---|---|---|
| 0 — Skeleton & rails | ✅ | `npm run check` green; smoke e2e; CI workflow |
| 1 — MIDI in, sound out | ✅ | smoke e2e (fake adapter, status dot, wizard) |
| 2 — Theory + engine | ✅ | unit tests, ≥90% coverage on theory/engine; `e2e/lab.spec.ts` |
| 3 — Lesson player + curriculum | ✅ | `e2e/stage0.spec.ts` (full Stage 0 marathon) |
| 4 — Memory & daily loop | ✅ | progress unit tests (FSRS sim, streaks, session builder); `e2e/daily.spec.ts` |
| 5 — Stages 1–2, songs, ear, calibration | ✅ | `e2e/stage1.spec.ts` (Stage 1 drive + transposed song) |
| 6 — Stages 3–4, sandbox, checkpoints/placement | ✅ | `voiceLeading.test.ts` (vl goldens, harmonization alternatives, 20 explorer voicings); `e2e/placement.spec.ts` (C-major-basics profile lands at s2.u1); `e2e/stage3.spec.ts` (harmonize + smooth vl + sandbox) |
| 7 — Stage 5, ratings, PWA, polish | ⬜ next | see 08-build-order Phase 7 |
| 8 — Stages 6–7, notation, endgame | ⬜ | |

## What exists (map)

- `src/theory/` — tonal wrappers: notes/keys/degrees/chords (inversion-aware detect, slash symbols)/scales/progressions. Pure, tested.
- `src/engine/` — generators (`scale-run`, `five-finger`, `chord-grip`, `grip-interleave`, `flashcard` spell+interval+roman, `note-find`, `ear-degree`, `ear-quality`, `ear-progression`, `progression-play` incl. `voiceLead:'smooth'`, `style:'brokenLH'` and `acceptAlternatives` harmonization, `chart-play` with the same textures), wait/tempo matchers (wait handles the `chord-any` target kind), `voiceLeading.ts` (movement cost, reference smooth voicings, vl score blend), timing tiers, scoring, take recorder, calibration helper. Pure, tested.
- `src/curriculum/` — zod schema + validator, Stages 0–4 authored (`content/stage{0..4}.ts`), song catalog, path logic with auto review nodes (review nodes now launch a workout drill).
- `src/progress/` — Dexie v1, atom registry + difficulty rule, ts-fsrs wrapper, session builder, streaks, service layer. Checkpoint pass marks its whole stage passed (placement path).
- `src/store/` — settings, midiStore, runStore (drives matchers; ear-preview gate blocks note-ons only), runTestBridge.
- `src/features/` — welcome wizard **with placement** ("I know some piano" → s0.cp→s1.cp→s2.cp chain, "Start my path here" bail-out), setup, Today, Path (passed* amber dots, review-node workouts), lesson player (create steps record replay takes; earCheck blocks render), drill player, songs, **sandbox (chord explorer / drone improv / progression looper)**, settings, `/lab` (all new generators selectable).
- `e2e/` — `drive.ts` (fake-MIDI driver, `until` predicate for placement chains); marathons + `placement.spec.ts` + `stage3.spec.ts`.

## How to verify from scratch

```
npm ci && npm run check && npm run build && npx playwright test
```
(Playwright uses `/opt/pw-browsers/chromium` in sandboxes, installs its own in CI. The marathon/placement specs take ~1–3 min each; the whole suite ~8 min.)

## Known gaps / notes for the next session

- Phase 7 is next: Stage 5 (sevenths, minor, all 12 keys, `song:ember`, `round-the-circle`), `ratings.ts` + challenge screen, Progress screen v1 (dials/heatmap/sparklines), badges + weekly recap, replay player + then-vs-now, PWA, licenses page, edge-state audit.
- Placement covers s0–s2 checkpoints per 05; extend `PLACEMENT_CHAIN` (LessonPlayer) if the spec ever widens it.
- `passed*` re-test inside the next review node (07 §Gates) is not yet special-cased — flagged units' atoms are simply scheduled `Again`, so they surface in reviews; the graded-step re-test can ride on Phase 7's review work.
- Choice-mode flashcards (key signatures) still deferred — spelled drills cover Stages 2–4.
- Bundle warning: main chunk > 500 KB (tonal + smplr eager). Phase 7's PWA work should code-split (samples/vexflow are already planned lazy in 08).
- `docs/decisions.md` logs deviations from the spec docs; keep appending.
- Real-hardware pass still pending: latency feel, timing-window tuning on an actual keyboard (see 00-overview quality bar). The calibration panel exists in Settings.
