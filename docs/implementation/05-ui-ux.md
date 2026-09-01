# 05 — UI / UX Specification

## Design language

Calm, precise, musical. Dark "stage" theme is the default identity; a full light theme exists and is selectable (and follows `prefers-color-scheme` when set to "system"). Depth via subtle borders and elevation, not heavy shadows. Motion is quick (120–200ms, ease-out) and purposeful; anything decorative respects `prefers-reduced-motion`.

## Tokens (`src/styles/tokens.css`) — single source of truth

```css
:root {
  /* light */
  --bg: #f7f7f5;
  --surface: #ffffff;
  --surface-2: #efefec;
  --border: #dededa;
  --text: #1a1b1e;
  --text-2: #5c5f66;
  --text-3: #8b8d98;
  --accent: #3e63dd;
  --accent-contrast: #ffffff;
  /* feedback */
  --ok: #218358;
  --warn: #d97706;
  --err: #ce2c31;
  --info: #0072d3;
  --judge-perfect: #21a66e;
  --judge-good: #7bc96a;
  --judge-ok: #d9a514;
  --judge-wrong: #e5484d;
  --judge-missed: #9ba1a6;
  --judge-early: #e8a33d;
  --judge-late: #4fa9f2;
  /* degree colors — FIXED, identical in both themes, always paired with a numeral */
  --deg-1: #e5484d;
  --deg-2: #f76b15;
  --deg-3: #ffc53d;
  --deg-4: #46a758;
  --deg-5: #00a2c7;
  --deg-6: #3e63dd;
  --deg-7: #8e4ec6;
  --deg-x: #8b8d98; /* non-diatonic */
  /* keyboard */
  --key-white: #fafaf8;
  --key-black: #26282c;
  --key-border: #c9c9c4;
  --key-active: #3e63dd; /* learner is holding it */
  --key-target: #ffffff00; /* target ring drawn with --accent outline */
  --radius-s: 6px;
  --radius-m: 10px;
  --radius-l: 16px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --font-ui: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, 'JetBrains Mono', monospace;
  --fs-xs: 12px;
  --fs-s: 13.5px;
  --fs-m: 15px;
  --fs-l: 18px;
  --fs-xl: 24px;
  --fs-xxl: 34px;
  --elev-1: 0 1px 2px rgb(0 0 0 / 0.06);
  --elev-2: 0 4px 16px rgb(0 0 0 / 0.1);
  --dur-fast: 120ms;
  --dur-med: 200ms;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
[data-theme='dark'] {
  --bg: #0f1115;
  --surface: #16181d;
  --surface-2: #1d2026;
  --border: #2a2e36;
  --text: #edeef0;
  --text-2: #a7abb4;
  --text-3: #6e7480;
  --key-white: #e8e8e4;
  --key-black: #17181b;
  --key-border: #3a3e46;
  --elev-1: 0 1px 2px rgb(0 0 0 / 0.4);
  --elev-2: 0 8px 24px rgb(0 0 0 / 0.5);
}
```

**Color precedence on keys** (strict order, highest wins): judgment flash (during/just after grading) → active (held) → target outline → degree tint (when the exercise's label mode shows degrees) → plain. Degree tints on keys are 35%-opacity fills so held/judgment states stay readable. Feedback colors are never used for degrees and vice versa; every colored element carries its numeral/label (a11y).

Typography: Inter (self-hosted via `@fontsource/inter`, weights 400/500/650). Numbers in stats/timers use `font-variant-numeric: tabular-nums`. Musical accidentals use real glyphs (♭ ♯ ♮) from Inter, never `b`/`#` in learner-facing text (parser accepts both).

## Navigation & routes

Left sidebar (72px collapsed / 220px expanded, persisted): logo, then **Today** (`/practice`), **Path** (`/path`), **Songs** (`/songs`), **Sandbox** (`/sandbox`), **Progress** (`/progress`), bottom: **Settings** (`/settings`) + MIDI status dot (green connected / amber no-device / red unsupported; click → `/setup`).

| Route                      | Screen                                                      |
| -------------------------- | ----------------------------------------------------------- |
| `/`                        | redirect: first run → `/welcome`, else `/practice`          |
| `/welcome`                 | Onboarding wizard                                           |
| `/setup`                   | MIDI & sound setup (also reachable any time)                |
| `/practice`                | Today's session hub                                         |
| `/path`                    | The journey map                                             |
| `/path/:unitId`            | Unit intro card (modal-over-path) → launches player         |
| `/lesson/:unitId`          | Lesson player (full-screen focus mode)                      |
| `/drill/:sessionBlockId`   | Player for review/warmup blocks (same player component)     |
| `/rating/:strand`          | Rating challenge (same player, challenge chrome)            |
| `/songs`, `/songs/:songId` | Song library / song player                                  |
| `/sandbox`                 | Free play: chord explorer, drone improv, progression looper |
| `/progress`                | Ratings, stats, replays, badges                             |
| `/settings`                | Preferences, calibration, data export/import                |

**Focus mode:** `/lesson`, `/drill`, `/rating`, `/songs/:id` hide the sidebar; top-left ✕ (Esc) exits with confirm-if-mid-take (toast-style confirm, not modal, 3s undo pattern).

## Screens

### Welcome (onboarding, 4 steps, progress dots)

1. Value proposition (one sentence + looping silent demo of the lesson player) → "Get started".
2. MIDI setup: live device list; when a device sends any note, a mini keyboard lights it and a check appears ("We hear you!"). Firefox hint line; unsupported-browser panel with explainer if applicable. Skippable ("I'll use computer keys for now").
3. Sound: "Enable sound" button (unlocks AudioContext, loads sampler w/ progress) + "My piano makes its own sound" (sets audioEnabled false).
4. Start point: "Start from zero" → Unit s0.u1; "I know some piano" → placement (Stage 0–2 checkpoint quizzes back-to-back until one fails; unlock accordingly). Then → `/practice`.

### Today (`/practice`) — the home screen

- Header: greeting, streak flame w/ count (+ freeze indicator), week dots (M–S, filled = practiced).
- **Session card** (primary, large): today's blocks listed with icons, minutes, and state — Warmup (2m) / Continue: _Unit title_ (8m) / Review: 7 skills due (6m) / Create (2m). One primary button: **Start session** (or **Continue** mid-session). Completing all blocks → session-done state with recap summary.
- Secondary row of small cards: **5-minute workout** (reviews only), **Rating challenge** (per strand, shows current level), **Sandbox**.
- If reviews overdue > 20 atoms: gentle banner "Big review day — want a catch-up workout instead?".

### Path (`/path`) — the journey map

- Vertical scroll, one column. Stages are sections with a header card (title, tagline, progress ring, strand chips). Units are nodes on an alternating left/right spine: circle w/ state — locked (dim, lock icon), available (accent ring, pulse animation once), in-progress (half ring), passed (filled, ★ count). Review nodes = rounded-square; checkpoints = shield shape.
- Click node → Unit intro card (title, concepts as chips, minutes, best score, [Start]/[Redo], and for passed units a "raise the bar" line: next weaning rung or stricter tier if applicable).
- Sticky mini-header shows current stage while scrolling. "You are here" auto-scroll on mount.

### Lesson player (`/lesson/:unitId`) — THE core screen

Layout (three fixed vertical zones, no scrolling during play):

```
┌────────────────────────────────────────────────────────┐
│ TopBar: ✕ | Unit title · step 3/7 | step-type chip     │  56px
├────────────────────────────────────────────────────────┤
│ PromptZone (flex): explain blocks OR the exercise      │
│ prompt: big chord symbols / roman chips / staff /      │
│ ear-play button — per weaning rung                     │
├────────────────────────────────────────────────────────┤
│ Keyboard (fixed height 190px, full width)              │
├────────────────────────────────────────────────────────┤
│ TransportBar: [◀ step] [count-in/metronome/bpm]        │  64px
│ [hand chips RH/LH/Both] [tempo ladder pips] [▶ / ⟳]    │
└────────────────────────────────────────────────────────┘
```

Behavior by step kind:

- **explain**: PromptZone renders blocks; keyboardDemo blocks animate the Keyboard (ghost presses w/ audio); "Continue" advances. Explain steps ≤ 90 seconds of content; text ≤ 60 words per block.
- **guided** (wait mode): targets shown per rung (keys-lit = target outline on keys; note-names = "D F♯ A" text; chord-symbols = `D` symbol card; etc.). Judgments flash on keys (fill, 300ms fade). Hint ladder per 04. Progress = thin bar of target dots.
- **ladder**: same, plus tempo pips (50% → 75% → 100%); each pip requires one clean pass (score ≥0.8) to light; learner may replay any pip.
- **graded**: count-in → run → live judgments; at completion a **Results overlay** slides up: score dial, stars, pitch/timing split, per-target strip (colored dots, hover = note & delta), buttons: [Try again] [Continue] (Continue enabled only on pass; a "practice this slower" link drops to 75% and back to ladder). Fail 3× → soft option: "Mark for extra review and move on" (allowed everywhere except checkpoint units; schedules atom as Again).
- **create**: prompt text + sandbox player (backing loop, palette highlighted, record light). 90-second suggested timer (soft). [Done] always available; a 4-bar take is auto-saved to replays.

### Drill player (`/drill/...`)

Same component, chrome variant: shows "Review 3/7" with the atom label, no explain steps; items are `grip-interleave`/`scale-run`/flashcard instances from due atoms; after each item, 1-tap self-flow continues automatically (800ms pause).

### Rating challenge (`/rating/:strand`)

Challenge chrome: level badge, 10-item progress bar, no retries, items generated at current level difficulty (07). End screen: level up/hold/down animation on the rating dial + "new material unlocked at level N" when thresholds cross.

### Songs (`/songs`, `/songs/:songId`)

Library: cards w/ title, styleRef, key, difficulty dots, stage gate (locked until stage reached). Song player = lesson player variant: PromptZone shows the **chart** (bars as a grid, current bar highlighted, chord symbols with degree-colored roman toggle), sections selectable, loop toggle, transpose menu (any key; romanized data makes this free), tempo slider 50–110%.

### Sandbox (`/sandbox`)

Three tabs:

1. **Chord explorer**: play anything; app names it live (`Chord.detect`), shows spelling, inversion, and roman numeral within a selectable key; big history strip of the last 8 chords (click = replay).
2. **Drone improv**: pick key + palette (degree toggles); drone plays (root+fifth pad from sampler, low volume); keys tinted by degree.
3. **Progression looper**: pick from learned progressions (or build: roman chips), style pattern, bpm; loops as backing; keyboard tints chord tones of the current bar.

### Progress (`/progress`)

- **Ratings row**: five strand dials (level number + 8-week sparkline).
- **Heatmap**: 12-key × skill-family grid (scales, triads, inversions, 7ths, progressions) colored by fluency (gray → accent). Click cell → drill that atom now.
- **Replays**: list of starred/best takes; player with keyboard playback + judgment overlay; "Then vs now" pairing when the same atom has takes ≥ 4 weeks apart (side-by-side play button) — this is the "look what you couldn't do" feature; surface one pairing per week on Today as a card.
- **Badges** wall (07 list) + weekly recap cards (archive).

### Settings

Sections: Profile (name, daily minutes goal 10/15/20/30) · Sound (volumes, mute app piano) · MIDI (device picker, live monitor strip, calibrate timing) · Appearance (theme, label defaults, reduced motion) · Data (export JSON, import, wipe w/ double confirm) · About (licenses page — required by attribution terms of samples/fonts).

## Component inventory (`src/ui/`) — key contracts

**`Keyboard`** (the hero):

```ts
interface KeyboardProps {
  range: [MidiNumber, MidiNumber];         // default [48, 84] (C3–C6); Settings can widen
  pressed: ReadonlySet<MidiNumber>;         // live from midiStore
  targets?: ReadonlyMap<MidiNumber, 'target'|'hint'>;
  judgments?: ReadonlyMap<MidiNumber, JudgeVerdict>;  // flash-fade handled internally
  degreeTint?: { key: KeyContext; degrees?: Degree[] } | null;
  labels: 'none'|'names'|'degrees'|'fingers';
  fingerMap?: ReadonlyMap<MidiNumber, number>;
  ghost?: ReadonlySet<MidiNumber>;          // demo/replay presses
  onKeyDown?/onKeyUp?: (midi) => void;      // mouse/touch play (also triggers sampler echo)
  height?: number;                          // default 190
}
```

SVG; white key = rounded-bottom rect; black keys at true offsets (pattern per octave: C♯ at 0.62w, D♯ at 1.38w, F♯ 3.58w, G♯ 4.42w, A♯ 5.26w — standard visual approximation); key press = 2px translate-down + fill; all state changes CSS-transitioned 80ms. Renders ≤ 500 SVG nodes; memoized per-key components keyed on their own state slice.

**`TransportBar`**: play/restart, bpm display (tap to edit, ±5 stepper), metronome mute, count-in indicator (beat dots), hand chips, tempo-ladder pips, mute-app-sound toggle. Keyboard shortcuts: Space = play/restart, M = metronome, Esc = exit.

**`ChordSymbol`**: renders `Ebm7` as root + quality with proper glyphs; optional roman chip underneath in degree color. **`DegreeBadge`**: numeral in its degree color (circle). **`ProgressRing`, `StarRating`, `ScoreDial`**: pure SVG. **`Toast`**: bottom-center, 3s, max 1 visible.

## Empty/edge states (each needs a designed state, not a blank div)

No MIDI device (every player: banner + computer-keys hint) · sampler still loading (transport disabled w/ progress pill) · unsupported browser (full-screen explainer w/ browser logos) · narrow viewport (<1024px: notice) · no due reviews ("all caught up" + suggest rating challenge) · day 1 (Today shows only Start-the-path card).

## Copy tone

Second person, short, concrete, zero shame. Errors: "Not yet — listen for the leap" not "Wrong!". Praise names the thing: "Smooth voice leading — nice." Never block with modals for encouragement; celebrate inline (Results overlay, badge toast).
