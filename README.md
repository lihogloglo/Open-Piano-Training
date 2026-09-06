# pianolearning

A theory-first, MIDI-native piano learning path: from zero to fluent in the _system_ of the keyboard — scales, chords, inversions, functional harmony — so songs become something you can reason about.

The app is **Keysense**. Plug in a MIDI keyboard (or use the computer keys), and it takes you from finding middle C to comping an unseen chart and improvising over your own left hand. Everything runs locally in the browser; nothing you play leaves the device.

## Run it

```bash
npm ci
npm run dev            # http://localhost:5173
```

No MIDI keyboard to hand? The computer keyboard works, and `?midi=fake` selects the scripted test adapter.

## Install it on Windows

Keysense also builds as a desktop app, so there is no dev server to start.

```bash
npm run desktop:build   # downloads the samples, builds, then packages
```

Two files land in `release/`:

- **Keysense Setup 0.1.0.exe** — the installer. It makes a Start menu entry and a desktop shortcut.
- **Keysense-0.1.0-portable.exe** — one file, no install. Run it from anywhere.

The desktop app works with no network. It carries the piano samples inside it, which is most of its 139 MB.

Pushing a version tag (`git tag v0.1.1 && git push origin v0.1.1`) builds the
portable .exe on GitHub Actions and attaches it to a release.

To run the shell without packaging it:

```bash
npm run desktop         # builds the web app, then opens it in Electron
```

## Verify it

```bash
npm run check          # lint + typecheck + contrast + unit tests (~10s)
npm run build          # production build (PWA, service worker, icons)
npm run check:bundle   # eager-bundle budget (< 450 kB gz)
npx playwright test    # full e2e suite (~25 min; the path marathon is most of it)
```

## The eight stages

| Stage | Title                 | What it gives you                                            |
| ----- | --------------------- | ------------------------------------------------------------ |
| 0     | Bearings              | The keyboard's layout, note names, a first five-finger shape |
| 1     | One key, whole system | C major from the inside: scale, degrees, its three chords    |
| 2     | The spelling engine   | Build any triad from any note, in any key                    |
| 3     | The Roman lens        | Chords get jobs — functional harmony and your first charts   |
| 4     | Smooth hands          | Inversions and voice leading                                 |
| 5     | The whole map         | Sevenths, minor, all twelve keys                             |
| 6     | Charts for real       | Shells, guide tones, comping grooves, sight-reading a chart  |
| 7     | Your own voice        | Improvisation, the blues, swing, working songs out by ear    |

Finish it and the app keeps going: FSRS-scheduled reviews, rating challenges per strand, twelve transposable songs, and a sandbox with no ceiling.

## Docs

- [PLAN.md](PLAN.md) — the project plan: landscape research, the 8-stage learning path, product design, tech stack, roadmap.
- [IMPLEMENTATION.md](IMPLEMENTATION.md) — the build specification (architecture, data model, MIDI/audio, exercise engine, UI/UX, curriculum, progress/scheduling, build order).
- [docs/STATUS.md](docs/STATUS.md) — where the build stands and what is still open.
- [docs/decisions.md](docs/decisions.md) — every deviation from the spec, with its reason.

Status: all eight phases of [the build order](docs/implementation/08-build-order.md) are complete. The outstanding item is a pass on real hardware — latency feel and timing-window tuning on an actual keyboard.
