# 01 — Architecture

## Stack (pin these; do not substitute)

| Concern             | Package                                               | Version policy                                                   |
| ------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Build               | `vite` + `@vitejs/plugin-react`                       | latest stable at start; then locked                              |
| UI                  | `react`, `react-dom`                                  | 19.x                                                             |
| Language            | `typescript`                                          | 5.x, `"strict": true`                                            |
| Routing             | `react-router` (data router, `createBrowserRouter`)   | 7.x                                                              |
| State               | `zustand`                                             | 5.x                                                              |
| MIDI                | `webmidi`                                             | 3.x                                                              |
| Theory              | `tonal`                                               | 6.x                                                              |
| Piano sound         | `smplr`                                               | 0.16+                                                            |
| Notation (Phase 8+) | `vexflow`                                             | 5.x                                                              |
| Storage             | `dexie`, `dexie-react-hooks`                          | 4.x                                                              |
| Spaced repetition   | `ts-fsrs`                                             | 5.x                                                              |
| PWA                 | `vite-plugin-pwa`                                     | latest                                                           |
| Unit tests          | `vitest`                                              | latest                                                           |
| E2E                 | `@playwright/test`                                    | latest (browser at `/opt/pw-browsers/chromium` in CI containers) |
| Lint/format         | `eslint` (flat config, typescript-eslint), `prettier` | latest                                                           |

No CSS framework. Styling = CSS Modules (`*.module.css`) + design tokens as CSS custom properties (see 05). No Tailwind, no styled-components (keeps the styling system fully specified by 05-ui-ux.md).

## Folder structure

```
src/
  app/                 # shell only
    main.tsx           # bootstrap
    router.tsx         # all routes (see 05 §Navigation)
    AppShell.tsx       # sidebar + outlet + global overlays
    brand.ts           # app name, version
    providers.tsx      # error boundary, theme, toasts
  styles/
    tokens.css         # ALL design tokens (05 §Tokens) — single source of truth
    global.css         # reset, base typography
  midi/                # NO React imports allowed
    types.ts           # NoteEvent, MidiDeviceInfo, MidiAdapter interface
    webmidiAdapter.ts  # real implementation (lazy-imports 'webmidi')
    fakeAdapter.ts     # scripted/test implementation
    computerKeyboardAdapter.ts  # QWERTY fallback (a..k = C4..C5 etc.)
    index.ts           # adapter selection
  audio/               # NO React imports allowed
    sampler.ts         # smplr wrapper: load, noteOn/Off, sustain, mute
    metronome.ts       # WebAudio click scheduler (lookahead pattern)
    clock.ts           # perf-clock <-> audio-clock conversion helpers
  theory/              # pure; wraps tonal — UI/engine never import 'tonal' directly
    notes.ts           # midi<->name, spelling in key context
    scales.ts          # scale notes, standard fingerings table
    chords.ts          # build, detect (inversion-aware), symbols
    keys.ts            # key signatures, circle of fifths, diatonic chords
    progressions.ts    # roman numeral <-> chords, common progression catalog
    degrees.ts         # degree math, degree-color mapping
  engine/              # pure; the exercise engine (04)
    types.ts
    generators/        # one file per generator id
    matcher/
      waitMatcher.ts
      tempoMatcher.ts
      setMatch.ts      # chord/set comparison
      timing.ts        # windows, judgments
    scoring.ts
    voiceLeading.ts
    replay.ts          # take serialization
  curriculum/          # schema + content-as-data (06)
    schema.ts          # types + zod validators
    content/
      stage0.ts ... stage7.ts
      songs.ts         # chord-chart song catalog
      index.ts         # assembled, validated path
    path.ts            # unlock logic, next-unit selection
  progress/            # pure logic + Dexie persistence (07)
    db.ts              # Dexie schema (02 §Database)
    atoms.ts           # skill atom registry & id helpers
    fsrs.ts            # ts-fsrs wrapper, grade mapping
    ratings.ts         # per-strand rating ladder
    sessionBuilder.ts  # builds today's session
    gates.ts           # unit/checkpoint mastery logic
    stats.ts           # streaks, recap aggregation
  store/               # zustand stores (thin; logic lives in the pure modules)
    midiStore.ts       # device, active notes (Set<number>), last events
    runStore.ts        # current exercise run state (matcher output)
    sessionStore.ts    # today's session plan + position
    settingsStore.ts   # persisted prefs (mirrors Dexie settings)
  ui/                  # reusable presentational components (05 §Components)
    Keyboard/          # the SVG keyboard (own folder: component, hooks, utils)
    ChordSymbol.tsx  DegreeBadge.tsx  TransportBar.tsx  Metronome.tsx
    ProgressRing.tsx StarRating.tsx  Card.tsx  Button.tsx  Modal.tsx  Toast.tsx
    StaffSnippet.tsx  # VexFlow wrapper (Phase 8)
  features/            # route-level screens composing ui/ + stores
    setup/  path/  lesson/  practice/  sandbox/  songs/  progress/  settings/
  test/                # test utilities (fake MIDI scripts, fixtures)
```

**Dependency rule (enforce with eslint-plugin-import or a lint rule):**
`app → features → {ui, store, curriculum, progress, engine} → {theory, midi, audio} → (npm)`.
Never upward. `theory/`, `engine/`, `progress/`(except db.ts), `curriculum/schema+content` import **no browser APIs** — they must run in Vitest under Node.

## Data flow (the one true path of a note)

```
Device → MidiAdapter.onEvent(NoteEvent {midi, kind, velocity, tPerf})
  1. midiStore.ingest(e)            // updates activeNotes Set; ring buffer of events
  2. sampler.echo(e)                // if app audio enabled (direct call, not via React)
  3. runStore.getState().feed(e)    // if an exercise run is live → matcher.advance()
       → matcher emits MatchEvents (noteJudged, targetAdvanced, completed…)
       → runStore updates (coarse: per-target, not per-frame)
UI reads: Keyboard subscribes to midiStore (activeNotes) + runStore (targets/judgments)
On completion: take = replay.finalize() → progress: gates + fsrs + ratings → Dexie
```

React must never sit between the device and sound. Subscriptions from `ui/Keyboard` use `useSyncExternalStore`/zustand selectors returning stable snapshots; per-note visual updates mutate a `Map` inside the store and bump a version counter (one state update per animation frame max — batch with `requestAnimationFrame`).

## State rules

- **zustand stores hold runtime state only.** Anything that must survive reload lives in Dexie; stores hydrate from Dexie on boot (`progress/db.ts` exposes typed load/save; `settingsStore` persists via a simple subscribe→save debounce).
- **No global event bus.** The matcher is owned by `runStore`; components never talk to the matcher directly — they render `runStore` state and call its actions (`startRun`, `pauseRun`, `abortRun`).
- **Derived data is computed in selectors or pure helpers**, never duplicated in state.

## Error handling

- `providers.tsx` installs a top-level React error boundary → friendly "something broke, your progress is safe" screen with a copyable error and a "reload" button.
- MIDI/audio failures are non-fatal: the app degrades (no device → setup prompt banner; sampler load failure → silent mode toast, retry button).
- All Dexie writes go through `progress/db.ts` helpers that catch quota errors and surface one toast.

## Testing strategy

| Layer         | Tool       | What                                                                                                                                                                               |
| ------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theory/`     | Vitest     | Table-driven: every scale/chord/key helper vs known-good values (incl. enharmonics: F♯ vs G♭ handling per key context)                                                             |
| `engine/`     | Vitest     | Matcher FSMs fed scripted `NoteEvent[]` streams (fixtures in `src/test/streams/`) — correct/wrong/extra/rolled/early/late cases; scoring formulas exact-value tests                |
| `progress/`   | Vitest     | Session builder scenarios; gate logic; rating ladder promote/demote; FSRS grade mapping (mock ts-fsrs clock)                                                                       |
| `curriculum/` | Vitest     | Zod validation of ALL content; referential integrity (every prerequisite/atom/generator id exists); path is a DAG; every unit reachable                                            |
| UI            | Playwright | Smoke: boot with `?midi=fake`, run through Unit 0.1 end-to-end using scripted fake-MIDI input, assert pass screen + Dexie rows. One test per screen renders without console errors |

The fake adapter is selected by URL param `?midi=fake` (dev/E2E) and exposes `window.__fakeMidi.play(script)` for Playwright.

## Conventions

- Named exports only (no default), except route components where the router needs lazy defaults.
- IDs are lowercase kebab/colon strings, never auto-increment (see 02 §IDs).
- Times: `tPerf` = `performance.now()` ms (input domain); `tAudio` = `AudioContext.currentTime` s (output domain). Suffix every time variable; never mix domains (convert via `audio/clock.ts`).
- MIDI numbers are the canonical pitch representation everywhere; note _names_ are a display concern resolved through `theory/notes.ts` with key context (spell C♯ vs D♭ correctly).
- Feature folders own their screens; anything used twice moves to `ui/`.
- Comments: only for invariants and gotchas (e.g., "velocity 0 note-on = note-off").
- Commits: conventional commits (`feat:`, `fix:`, `content:` for curriculum data).
