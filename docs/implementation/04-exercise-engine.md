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
  def: ExerciseDef; seed: number;
  targets: Target[];                        // ordered
  prompt: PromptModel;                      // what the UI shows (per weaning rung)
  beatsPerTarget?: number;                  // tempo mode: grid spacing (default 1)
  audioPreview?: DemoScript;                // for "Hear it" / ear exercises
}
export type Target =
  | { kind: 'note'; midi: MidiNumber; atBeat?: number; finger?: number }
  | { kind: 'set';  midis: MidiNumber[]; atBeat?: number; label: string;   // chord: exact voicing
      octaveFlexible: boolean; inversionOf?: { root: string; quality: ChordQuality } } // if set, ANY voicing of that chord+inversion passes
  | { kind: 'any-of-degree'; degree: Degree; key: KeyContext };            // ear answers: any octave of that pitch class
```

## Generators (`src/engine/generators/`)

Each generator: `(params, seed) => ExerciseInstance`, deterministic per seed (use a small xorshift PRNG in `engine/rng.ts`). Param types below are the contract; validate with zod.

| Generator | Params | Produces |
|---|---|---|
| `scale-run` | `{tonic, scaleType:'major'\|'natural-minor'\|'harmonic-minor'\|'major-pentatonic'\|'minor-pentatonic'\|'blues', hand, octaves:1\|2, direction:'up'\|'down'\|'updown', startOctave?}` | Note targets with standard fingering annotations from `theory/scales.ts` fingering table |
| `five-finger` | `{tonic, quality:'maj'\|'min', hand, pattern:'asc'\|'desc'\|'updown'\|'melodyId'}` | 5-note patterns; melodyId picks from a small built-in melody set |
| `chord-grip` | `{root, quality, inversion, hand, voicing:'closed'\|'shell17'\|'shell13'\|'rootOnly'}` | One set target (octaveFlexible true unless params say otherwise) |
| `grip-interleave` | `{pool: GripPoolFilter, count, hand}` — pool filters by roots/qualities/inversions learned | `count` set targets drawn without immediate repeats (true interleaving) |
| `spell-drill` | `{pool, count, answerVia:'midi'}` | "Spell F♯m7" → targets as sets; prompt shows symbol only (rung `chord-symbols`) |
| `progression-play` | `{key, roman: string[], voiceLead:'free'\|'smooth', hand, loops, style:'block'\|'brokenLH'}` | Set targets per bar; `smooth` enables voice-leading scoring |
| `chart-play` | `{songId, sectionIdx?, transposeTo?}` | Set targets from the song's bars on its grid |
| `ear-degree` | `{key, degreePool: Degree[], count}` | Cadence preview (I-IV-V-I demo script) then single-note probes; targets `any-of-degree` |
| `ear-quality` | `{qualityPool: ChordQuality[], count}` | Plays a chord (audioPreview per item); answer = play any voicing of that quality on a fixed root shown on screen |
| `ear-progression` | `{key, pool: string[][], count}` | Plays 4-bar progression; answer = play the roman sequence (bass roots acceptable per params) |
| `flashcard` | `{atomKind:'keysig'\|'spell'\|'interval', pool, count, answerVia:'choice'\|'midi'}` | Theory Q&A; `choice` renders 4 options, `midi` expects played answer |
| `read-snippet` (Phase 8) | `{key, rhythmLevel, range, bars}` | Generated 1–2 bar melodies rendered by StaffSnippet |
| `improv-sandbox` | `{key, palette: Degree[], backing:'drone'\|'progressionId', bpm?}` | No targets (unscored); provides backing loop + highlighted palette |

Every generator caps range to the learner's keyboard if known (Settings stores detected min/max from seen events; default 61-key C2–C7 assumption).

## Matchers

### Wait matcher (`waitMatcher.ts`)
FSM over targets, no clock. For `note`: advance on correct noteon (judgment `perfect`, deltaMs null); wrong noteon → mark `wrong` on that attempt (does NOT advance; increments per-target `misses`). For `set`: collect currently-held notes; when held set ⊇ target set (and, if not octaveFlexible, exactly equal as pitch set), advance. Extra held notes outside the target → `extra` judgment but still advance if target satisfied after a 60ms settle window. Hints: after 2 misses on the same target emit `hintEligible` (UI lights the key(s)); after 4, auto-light.

### Tempo matcher (`tempoMatcher.ts`)
Consumes the metronome's beat grid. Each target has an expected time `tExpect` (from `atBeat`). A noteon at `t` (minus `latencyOffsetMs`) matches the nearest unconsumed target within the outer window whose pitch matches; judged by |delta|:

| Tier | perfect | good | ok (outer) | set/roll window |
|---|---|---|---|---|
| relaxed | ≤120ms | ≤240ms | ≤350ms | 120ms |
| standard | ≤70ms | ≤140ms | ≤220ms | 90ms |
| strict | ≤45ms | ≤90ms | ≤140ms | 60ms |

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
extraPenalty = 0.02 * #extra   (cap 0.10)
score = clamp01( (wait mode: pitchAccuracy) | (tempo: 0.6*pitchAccuracy + 0.4*timingAccuracy) − extraPenalty )
stars: ≥0.80 ★, ≥0.90 ★★, ≥0.97 ★★★     pass = score ≥ passScore (default 0.80)
```

### Voice-leading metric (`voiceLeading.ts`) — only when `voiceLead:'smooth'`
For consecutive played chords, movement cost = sum over voices of semitone distance (greedy min-cost pairing of the two voicings). Ideal cost from the reference smooth voicing sequence (generator computes it: keep common tones, move others minimally). `vlScore = clamp01(1 − (playedCost − idealCost) / (2*idealCost + 4))`. Final score for these exercises: `0.5*pitch + 0.3*timing + 0.2*vl`.

## Match events (UI contract)

Matcher emits (runStore forwards to UI):
`runStarted`, `countIn(beat)`, `beat(bar,beat)`, `targetFocused(index)`, `noteJudged(NoteJudgment)`, `hintEligible(index)`, `completed(TakeResult)`, `aborted`.

## Replay (`replay.ts`)

Record every MidiEvent during a run as `CompactEvent` (dt from run start). `finalize()` builds the `Take`. Replay playback (Progress screen): feed events through the sampler + Keyboard at recorded timing, with judgments overlaid — reuses the same Keyboard component in `replay` mode.

## Testing (minimum fixtures)

Scripted streams in `src/test/streams/`: perfect scale; scale with 1 wrong + recovery; rolled chord inside/outside window; early/late notes at each band edge (±1ms of boundary); extra-note spam; missed target; set with sustain pedal held (pedal ignored); interleave no-repeat property test (100 seeds). Scoring: golden exact-value tests for each formula branch.
