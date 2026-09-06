# 04 — Exercise Engine

Everything here is pure TypeScript in `src/engine/` (+ `src/theory/`). No DOM, no stores.

## Pipeline

```
ExerciseDef ──(generator + seed)──▶ ExerciseInstance ──▶ Matcher (wait|tempo)
   ▲                                                        │ MatchEvents
   └──────────── curriculum / sessionBuilder                ▼
                                              Judgments ──▶ scoring ──▶ TakeResult
```

```ts
export interface ExerciseInstance {
  def: ExerciseDef;
  seed: number;
  targets: Target[]; // ordered
  prompt: PromptModel; // what the UI shows (per weaning rung)
  beatsPerTarget?: number; // tempo mode: grid spacing (default 1)
  audioPreview?: { notes: DemoNote[]; bpm: number }; // played once before the run
  perTargetPreview?: ({ notes: DemoNote[]; bpm: number } | undefined)[]; // ear items
  voiceLeading?: { ideal: MidiNumber[][] }; // reference voicings for smooth scoring
}
export type Target =
  | { kind: 'note'; midi: MidiNumber; atBeat?: number; finger?: number }
  | {
      kind: 'set';
      midis: MidiNumber[];
      atBeat?: number;
      label: string; // chord: exact voicing
      octaveFlexible: boolean;
      inversionOf?: { root: string; quality: ChordQuality; inversion: Inversion };
    } // if set, ANY voicing of that chord+inversion passes
  | { kind: 'any-of-degree'; degree: Degree; key: KeyContext; atBeat?: number } // any octave of that pitch class
  | {
      // Several valid chord answers (harmonization, ear-progression). Wait mode only.
      kind: 'chord-any';
      accept: { root: string; quality: ChordQuality }[];
      bassRootOk?: boolean; // a lone root of accept[0] also passes
      label: string;
      atBeat?: number;
    };
```

## Generators (`src/engine/generators/`)

Each generator: `(params, seed) => ExerciseInstance`, deterministic per seed (use a small xorshift PRNG in `engine/rng.ts`). Param types below are the contract; validate with zod.

| Generator          | Params                                                                                                                                                                | Produces                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `scale-run`        | `{tonic, scaleType:'major'\|'natural-minor'\|'harmonic-minor'\|'major-pentatonic'\|'minor-pentatonic'\|'blues'\|'chromatic', hand, octaves, direction, startOctave?}` | Note targets with fingering annotations from `theory/scales.ts`                    |
| `five-finger`      | `{tonic, quality:'maj'\|'min', hand, pattern:'asc'\|'desc'\|'updown'\|'melodyId'}`                                                                                    | 5-note patterns; melodyId picks from a small built-in melody set                   |
| `note-find`        | `{pool: string[], count, octaves?}`                                                                                                                                   | "Find every F": single note targets, any octave                                    |
| `chord-grip`       | `{root, quality, inversion, hand, voicing:'closed'\|'shell17'\|'shell13'\|'rootOnly'}`                                                                                | One set target (octaveFlexible unless params say otherwise)                        |
| `grip-interleave`  | `{pool: GripPoolFilter, count, hand}`                                                                                                                                 | `count` set targets drawn without immediate repeats                                |
| `progression-play` | `{key, roman: string[], voiceLead:'free'\|'smooth', hand, loops, style:'block'\|'brokenLH'\|'rootchord'\| comp patterns, voicing?, swing?}`                           | Set targets per bar; `smooth` scores voice leading; comp styles add pattern rhythm |
| `chart-play`       | `{songId, sectionIdx?, transposeTo?, style?}`                                                                                                                         | Set targets from the song's bars on its grid                                       |
| `unseen-chart`     | `{stage, bars, key?, style?}`                                                                                                                                         | A chart the learner has never seen, generated per seed and validated               |
| `ear-degree`       | `{key, degreePool: Degree[], count}`                                                                                                                                  | Cadence preview, then single-note probes; targets `any-of-degree`                  |
| `ear-quality`      | `{qualityPool: ChordQuality[], count}`                                                                                                                                | Plays a chord (per-target preview); answer = any voicing of that quality           |
| `ear-progression`  | `{key, pool: string[][], count}`                                                                                                                                      | Plays a progression; answer = the roman sequence (`chord-any` targets)             |
| `flashcard`        | `{kind:'keysig'\|'spell'\|'interval'\|'roman', pool, count}`                                                                                                          | Theory question and answer; the answer is played on the keyboard                   |
| `read-snippet`     | `{key, clef, rhythmLevel, range, bars}`                                                                                                                               | Generated 1-2 bar melodies rendered by `StaffSnippet`                              |
| `improv`           | `{key, palette: Degree[], backing:'drone'\| progression, bpm?, tintDegrees?}`                                                                                         | No targets (unscored): a backing loop and a highlighted palette                    |

Generators write inside a 61-key C2–C7 assumption. Detecting the real range from seen events was specified and not built; nothing stores a device range.

## Matchers

### Wait matcher (`waitMatcher.ts`)

FSM over targets, no clock. For `note`: advance on correct noteon (judgment `perfect`, deltaMs null); wrong noteon → mark `wrong` on that attempt (does NOT advance; increments per-target `misses`). For `set`: collect currently-held notes; when held set ⊇ target set (and, if not octaveFlexible, exactly equal as pitch set), advance. Extra held notes outside the target → `extra` judgment but still advance if target satisfied after a 60ms settle window. Hints: after 2 misses on the same target emit `hintEligible` (UI lights the key(s)); after 4, auto-light.

### Tempo matcher (`tempoMatcher.ts`)

Consumes the metronome's beat grid. Each target has an expected time `tExpect` (from `atBeat`). A noteon at `t` (minus `latencyOffsetMs`) matches the nearest unconsumed target within the outer window whose pitch matches; judged by |delta|:

| Tier     | perfect | good   | ok (outer) | set/roll window |
| -------- | ------- | ------ | ---------- | --------------- |
| relaxed  | ≤120ms  | ≤240ms | ≤350ms     | 120ms           |
| standard | ≤70ms   | ≤140ms | ≤220ms     | 90ms            |
| strict   | ≤45ms   | ≤90ms  | ≤140ms     | 60ms            |

- Pitch-correct outside outer window, or no target for it → `extra`.
- Target with no matching noteon by `tExpect + outer` → `missed`.
- Pitch-wrong within window of a target → `wrong` (consumes nothing; the real target can still be hit).
- **Set targets:** first correct member opens the roll window; all members must land within it; the set's deltaMs = mean of members' deltas. Members arriving late-but-within-outer → set judged by worst member's band.
- Early-vs-late is reported on every judgment (`deltaMs` sign) — the UI shows it.
- Run ends at last target + outer window; matcher emits `completed` with all judgments.

## Scoring (`scoring.ts`) — exact formulas

```
noteScore: perfect=1.0, good=0.8, ok=0.5, wrong/missed=0
pitchAccuracy = (#targets judged perfect|good|ok) / #targets
timingAccuracy = mean(noteScore over targets that were pitch-correct)   // wait mode: 1.0
precision = #targets / max(1, #targets + #wrong + #extra)
score = clamp01((wait: pitchAccuracy | tempo: 0.6*pitchAccuracy + 0.4*timingAccuracy) * precision)
stars: ≥0.80 ★, ≥0.90 ★★, ≥0.97 ★★★     pass = score ≥ passScore (default 0.80)
```

### Voice-leading metric (`voiceLeading.ts`) — only when `voiceLead:'smooth'`

For consecutive played chords, movement cost = sum over voices of semitone distance (greedy min-cost pairing of the two voicings). Ideal cost from the reference smooth voicing sequence (generator computes it: keep common tones, move others minimally). `vlScore = clamp01(1 − (playedCost − idealCost) / (2*idealCost + 4))`. Final score for these exercises: `(0.5*pitch + 0.3*timing + 0.2*vl) * precision`.

## Match events (UI contract)

Matcher emits (runStore forwards to UI): `targetFocused(index)`,
`noteJudged(NoteJudgment)`, `hintEligible(index, auto)`, `completed(TakeResult)`.
Run lifecycle (start, count-in, beat, abort) is `runStore` state, not matcher events.

## Replay (`replay.ts`)

Record every MidiEvent during a run as `CompactEvent` (dt from run start). `finalize()` builds the `Take`. Replay playback (Progress screen): feed events through the sampler + Keyboard at recorded timing, with judgments overlaid — reuses the same Keyboard component in `replay` mode.

## Testing (minimum fixtures)

Scripted streams live inline in `src/engine/engine.test.ts`: perfect scale; scale with 1 wrong + recovery; rolled chord inside/outside window; early/late notes at each band edge (±1ms of boundary); extra-note spam; missed target; set with sustain pedal held (pedal ignored); interleave no-repeat property test (100 seeds). Scoring: golden exact-value tests for each formula branch.

## Assessment and phrase extensions (2026-09-06)

Exercise definitions now accept `assessment`, `passScore`, and an optional `focus` target slice.
Focused practice preserves its source seed and removes assessment credit.
Wait results record first-answer accuracy, response times, and hint use.
Tempo results retain signed timing errors. `diagnosis.ts` turns these observations into retry advice.

The `phrase` generator accepts explicit starts, durations, and meter from the practical studio.
Runtime target timers follow fractional beat positions. The metronome uses the authored meter.
Durations guide demonstrations and self-checks. The matcher grades note starts only.
