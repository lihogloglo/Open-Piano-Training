# Status — session handoff

_Last updated: 2026-09-06 (review implementation). For a fresh session: read [IMPLEMENTATION.md](../IMPLEMENTATION.md), then this file. The build order is complete; what remains is listed under "Known gaps"._

## Current review work

The software changes from the app review are implemented. Track scope, evidence, and human checks in [improvement-tracker.md](improvement-tracker.md).
The practical studio adds 14 lessons and three complete eight-bar pieces.
Assessment scoring, focused retries, lesson resume, daily budgets, progress labels, backups, and input handling were repaired.
The core curriculum now contains 68 units, 421 steps, 348 exercise instances, and 64 ladders.

The checks from earlier build phases below are historical. Current verification includes lint, types, 36 contrast pairs, 258 unit tests, targeted browser checks, and desktop security tests.
A production build passes. The eager bundle is about 320 kB gzipped against a 450 kB budget.
Teacher review, physical MIDI/audio checks, and beginner observations remain open.

## Where the build stands

**All eight phases of the build order are complete.** A learner with a MIDI keyboard (or the QWERTY fallback / `?midi=fake` test adapter) can walk the whole path from "which key is C" to improvising a blues chorus over their own comping — and the app then keeps them there with FSRS reviews, rating challenges and free play.

| Phase                                          | State | Proof                                                                                          |
| ---------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| 0 — Skeleton & rails                           | ✅    | `npm run check` green; smoke e2e; CI workflow                                                  |
| 1 — MIDI in, sound out                         | ✅    | smoke e2e (fake adapter, status dot, wizard)                                                   |
| 2 — Theory + engine                            | ✅    | unit tests, ≥90% coverage on theory/engine; `e2e/lab.spec.ts`                                  |
| 3 — Lesson player + curriculum                 | ✅    | `e2e/stage0.spec.ts` (full Stage 0 marathon)                                                   |
| 4 — Memory & daily loop                        | ✅    | progress unit tests; `e2e/daily.spec.ts`                                                       |
| 5 — Stages 1–2, songs, ear, calibration        | ✅    | `e2e/stage1.spec.ts`                                                                           |
| 6 — Stages 3–4, sandbox, checkpoints/placement | ✅    | `voiceLeading.test.ts`; `e2e/placement.spec.ts`; `e2e/stage3.spec.ts`                          |
| 7 — Stage 5, ratings, PWA, polish              | ✅    | `ratings.test.ts`, `motivation.test.ts`; `e2e/rating.spec.ts`, `e2e/stage5.spec.ts`            |
| 8 — Stages 6–7, notation, endgame              | ✅    | `phase8.test.ts` (50-seed unseen-chart validation); `e2e/marathon.spec.ts`, `e2e/a11y.spec.ts` |

Two passes ran after the build order closed:

- **Content rebuild** (2026-09-03). All eight stages were rewritten against `docs/content-audit.md` and are held by two lints in `curriculum.test.ts`: the minimum unit grammar, and "graded takes only score rehearsed material". Totals: 879 nominal minutes, 345 exercise instances, 62 tempo ladders.
- **Desktop build** (2026-09-06). `electron/main.cjs` serves the built app over a private `keysense://` scheme and grants MIDI. `npm run desktop:build` packages a Windows installer and a portable .exe; pushing a `v*` tag builds the portable one in `.github/workflows/release.yml`. The samples are vendored by `scripts/fetch-samples.mjs`, so the installed app needs no network.

## What exists (map)

- `src/theory/` — tonal wrappers: notes/keys/degrees/chords (inversion-aware detect, slash symbols)/scales/progressions. Pure, tested.
- `src/engine/` — generators (`scale-run`, `five-finger`, `chord-grip`, `grip-interleave`, `flashcard`, `note-find`, `ear-degree`, `ear-quality`, `ear-progression`, `progression-play`, `chart-play`, **`unseen-chart`**, **`improv`**, **`read-snippet`**), wait/tempo matchers, `voiceLeading.ts`, **`comp.ts`** (shell/guide-tone voicings, four comp patterns, swing), timing tiers, scoring, take recorder. Pure, tested.
- `src/curriculum/` — zod schema + validator, **Stages 0–7 authored**, 12-song catalog, path logic with auto review nodes.
- `src/progress/` — Dexie v1, atom registry (every kind is drillable, so anything can be reviewed or rated), ts-fsrs wrapper, session builder, streaks, **`ratings.ts`** (SASR ladder), **`badges.ts`**, **`heatmap.ts`**, weekly recap in `stats.ts`.
- `src/audio/` — clock, metronome, sampler, **`backing.ts`** (looping chord backing on the metronome clock).
- `src/features/` — welcome + placement, setup, Today (session, streak, recap card, challenge suggestion), Path, lesson player (5 step kinds, staff rendering for read steps, improv backing), drill player, songs, sandbox, **Progress (rating dials, heatmap, then-vs-now, best takes, badge wall)**, **rating challenge**, **epilogue**, settings (+ licenses, read strand, reduce motion), `/lab`.
- `scripts/` — `make-icons.mjs` (PWA icons from the mark), `check-bundle.mjs` (eager-bundle budget), `check-contrast.mjs` (WCAG AA on the tokens), `fetch-samples.mjs` (vendors the piano samples).
- `electron/` — `main.cjs` (window, `keysense://` scheme, MIDI permission), `preload.cjs`.
- `e2e/` — `drive.ts` (fake-MIDI driver + challenge driver), per-stage marathons (`stage0/1/3/5`), `marathon.spec.ts` (whole path), `content-lessons.spec.ts`, `daily.spec.ts`, `placement.spec.ts`, `rating.spec.ts`, `lab.spec.ts`, `edge-states.spec.ts`, `offline.spec.ts`, `a11y.spec.ts` (axe-core), `smoke.spec.ts`, `screenshots.spec.ts`.

## How to verify from scratch

```
npm run check
npm run build
npm run check:bundle
node --test electron/security.test.cjs
npx playwright test e2e/improvements.spec.ts --workers=1
```

`npm run check` is lint + typecheck + contrast + unit tests (~10s). Run targeted browser specs for changed features. The whole suite and `marathon.spec.ts` require an explicit user request under `CLAUDE.md`.

## Known gaps / notes for the next session

Open product checks and earlier scope notes follow. See the improvement tracker for closure criteria.

- **Real-hardware pass still pending.** Everything is verified through the fake MIDI adapter. Latency feel and timing-window tuning on an actual keyboard is the one thing no test can close — see the 00-overview quality bar. The calibration panel is in Settings.
- **Offline sound quality still needs a listening check.** The production test caches all 226 samples and runs a demonstration after an offline reload. A human must judge audible quality and timing feel.
- **Lighthouse PWA installability has not been measured** on a real deploy. Manifest, icons, service worker and precache are all in place and the build emits them; nobody has run the audit.
- Choice-mode flashcards (key signatures as a multiple-choice card) are still deferred; `keysig:*` atoms drill as roman-numeral cards in the key instead, which is playable but not the same skill.
- Exact graded retests now appear in review blocks. A unit flag clears after all its queued retests pass.
- The notation strand ships six `read:staff:*` atoms (treble/bass × C/G/F). It is a working strand, not a curriculum: there are no read _units_, by design (05 lists it as optional).
- **Android is not built.** The same web build should wrap with Capacitor, but MIDI over USB inside an Android WebView needs its own proving pass.
- `src/features/shared/Placeholder.tsx` is unreferenced. It is the Phase 0 route stub, and nothing imports it now.
- Preferences remain in `localStorage`. Backups now include them explicitly and preserve calibration. The legacy Dexie settings table remains import-compatible.
- `docs/decisions.md` logs deviations from the spec docs; keep appending.

## Edge states (05 §Empty/edge states) — where each one lives

| State                     | Where                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| No MIDI device            | `ui/PlayerNotices` in every player + `MidiSetupPanel`                  |
| Sampler still loading     | `ui/PlayerNotices` progress pill; `TransportBar` start button disabled |
| Unsupported browser       | `MidiSetupPanel` explainer + the same player notice                    |
| Narrow viewport (<1024px) | `app/ViewportNotice`                                                   |
| No due reviews            | Today's caught-up line + the rating-challenge card                     |
| Day 1                     | Today shows only the start-the-path card (no recap, no challenge)      |
| Offline                   | `app/ConnectionBanner`                                                 |

Covered by `e2e/edge-states.spec.ts` and `e2e/offline.spec.ts`.
