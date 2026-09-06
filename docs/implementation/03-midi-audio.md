# 03 — MIDI & Audio

## MIDI adapters

Three implementations of `MidiAdapter` (interface in 02):

### `webmidiAdapter.ts`

- Lazy `import('webmidi')` on first `init()` (keeps it out of the boot bundle).
- `WebMidi.enable({ sysex: false })`. Map results: unsupported browser → `'unsupported'`; permission refusal → `'denied'`.
- Normalization rules (apply here so downstream never thinks about them):
  - noteon with raw velocity 0 → emit `kind:'noteoff'`.
  - velocity normalized 0..1.
  - CC64: value ≥ 64 → `PedalEvent{down:true}`, < 64 → `{down:false}`; debounce repeats (emit only on down/up transitions, but include raw `value`).
  - Use the event's own `timestamp` (performance-clock domain) as `tPerf`; if absent, `performance.now()`.
- `select(null)` listens to all inputs (default until user picks one); persist picked id via settingsStore.
- Hot-plug: forward `connected`/`disconnected` via `onDevicesChanged`; if the selected device disappears, fall back to all-inputs and toast "Keyboard disconnected".

### `computerKeyboardAdapter.ts` (fallback + dev)

- QWERTY mapping (hold Shift for velocity 1.0, else 0.7):
  `a w s e d f t g y h u j k` → C4 C#4 D4 D#4 E4 F4 F#4 G4 G#4 A4 A#4 B4 C5; `z`/`x` shift octave −/+ (range clamp A0..C8).
- Key repeat suppressed (track held keys).
- Active automatically when no MIDI adapter is available or in exercises with `rung !== 'keys-lit'`? No — always active as a supplement (harmless), except disabled inside text inputs.

### `fakeAdapter.ts` (E2E/dev)

- Selected by `?midi=fake`.
- `window.__fakeMidi = { play(script: {midi:number; at:number; dur:number; vel?:number}[]) }` — schedules events on the perf clock relative to call time. Also `pressNow(midi)`, `releaseAll()`.

`midi/index.ts` chooses: fake (url param) → webmidi (if `navigator.requestMIDIAccess`) → computer-keyboard-only, and always layers the computer keyboard on top.

## Clocks (`audio/clock.ts`)

- Input/scoring domain: `tPerf` (ms). Audio scheduling domain: `tAudio` (s).
- On `AudioContext` creation, capture the pair via `ctx.getOutputTimestamp()` (fallback: `{contextTime: ctx.currentTime, performanceTime: performance.now()}`) and expose `perfToAudio(tPerf)` / `audioToPerf(tAudio)`. Refresh the anchor pair every 30s (clocks drift).
- **Never** score timing in the audio domain.

## Sampler (`audio/sampler.ts`)

- `smplr`'s `SplendidGrandPiano` on a module-level `AudioContext` (shared with metronome).
- `AudioContext` starts suspended: `unlock()` is called from the first user gesture (Setup screen's "Enable sound" button and any Start button). Until unlocked, suppress echo silently.
- API: `load(onProgress)`, `noteOn(midi, vel)`, `noteOff(midi)`, `setPedal(down)` (route CC64 so releases sustain), `setVolume(v)`, `mute(bool)`.
- Echo path is direct: `midiStore.ingest` calls `sampler.echo(e)` synchronously with `time: undefined` (= now). Never queue through a scheduler.
- Sample source: `scripts/fetch-samples.mjs` vendors the 226 OGG files into `public/samples/`. The sampler sends one HEAD request at load time and uses the local copy if it answers, otherwise smplr's own host. The desktop build always ships the local copy.
- Loading UX: lazy-load on first screen that needs sound; show a small progress pill ("Loading piano… 40%"); app remains usable meanwhile (visuals only). Cache via PWA runtime caching (CacheFirst for the sample CDN origin).
- Users with keyboard speakers: Settings + TransportBar mute toggle ("Use your piano's sound").

## Metronome (`audio/metronome.ts`)

- Standard lookahead scheduler: `setInterval` 25ms, schedule clicks 120ms ahead on `tAudio`.
- Sounds: synthesized (no samples) — downbeat: 2ms sine burst 1568Hz (G6); other beats: 1046Hz (C6); through a sharp envelope (attack 0.001, decay 0.03). Accent pattern from time signature.
- API: `start({bpm, timeSig, countInBars})`, `stop()`, `onBeat(cb: (beat: {bar, beatInBar, tAudio, tPerf}) => void)` — `tPerf` computed via clock helpers; the matcher consumes **these** beat timestamps as the timing grid (so audible click and scoring grid are identical by construction).
- Count-in: 1 bar default (2 bars at <60 BPM), visually mirrored by the TransportBar.

## Latency calibration (`latencyOffsetMs`)

Settings → "Calibrate timing": metronome plays 8 clicks at 90 BPM; user plays any key on each click; store `median(deltaMs)` as `latencyOffsetMs` (clamped ±80ms). The matcher subtracts it from every judgment delta. Default 0; prompt calibration once after onboarding (skippable).

## Gotchas checklist (implement + unit test where testable)

1. Velocity-0 noteon = noteoff (normalize in adapter; test).
2. Never compare `tPerf` with `tAudio` raw (lint: name suffixes; review).
3. Resume/unlock AudioContext only from real user gestures.
4. Hot-plug after page load must work (statechange handling; test manually + fake adapter script).
5. Sustain pedal: affects audio, logged in takes, **ignored by correctness matching**.
6. Chord rolls: matching tolerance lives in the matcher (04), not the adapter — adapter stays raw.
7. Multiple MIDI inputs sending simultaneously (e.g., through-port duplicates): dedupe identical events (same midi+kind) within 3ms in `midiStore.ingest`.

## Review changes (2026-09-06)

Pointer input and computer keys now use the same event ingestion as MIDI.
Rapid note-on/off repetitions remain distinct. Identical duplicate messages within three milliseconds remain filtered.
Disconnect and focus loss release held notes and sustain. Pending audio starts use cancellation tokens.
Muting releases current sampler voices. Replays use recorded velocity and include the recorded note range.

The local sample probe uses GET, which the browser service worker can satisfy offline.
The sample cache limit is 512 files, above the current 226-file piano library.
Programmatic demonstrations wait for the sampler. Audio load failures expose a retry control.
Physical latency, pedal behavior, and audible offline quality remain human checks.
