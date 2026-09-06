# Open Piano Training

> A theory-first piano course that turns scales, chords, and harmony into practical keyboard skills.

[![CI](https://github.com/lihogloglo/Open-Piano-Training/actions/workflows/ci.yml/badge.svg)](https://github.com/lihogloglo/Open-Piano-Training/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/lihogloglo/Open-Piano-Training)](https://github.com/lihogloglo/Open-Piano-Training/releases/latest)

The application is called **Keysense**. Connect a MIDI keyboard or use your computer keyboard, then follow a guided path from finding middle C to reading charts, comping, and improvising. Every exercise responds to what you play, and all learning data stays on your device.

## What is included

- Eight stages covering keyboard geography, scales, triads, functional harmony, inversions, sevenths, comping, sight-reading, ear training, and improvisation
- Immediate note and timing feedback from a MIDI controller, the on-screen piano, or QWERTY keys
- Daily practice sessions with spaced repetition, streaks, ratings, checkpoints, and progress tracking
- Twelve transposable song studies, three complete studio pieces, and a free-play sandbox
- Local-first storage, backup and restore, and offline support
- An installable Windows desktop app and a browser-based PWA

## Download for Windows

Download the current portable app from [GitHub Releases](https://github.com/lihogloglo/Open-Piano-Training/releases/latest). It runs from a single `.exe` and does not require an installer.

The desktop build includes its piano samples and works without a network connection. Windows may show a SmartScreen warning because the executable is not code-signed.

## Run in a browser

You need [Node.js 22](https://nodejs.org/) and npm.

```bash
git clone https://github.com/lihogloglo/Open-Piano-Training.git
cd Open-Piano-Training
npm ci
npm run dev
```

Open `http://localhost:5173` in Chrome, Edge, or Opera for Web MIDI support. A MIDI keyboard is optional: the on-screen piano works with a mouse or touch, and the computer keyboard uses `A`–`K` for white keys, `W`, `E`, `T`, `Y`, and `U` for black keys, and `Z`/`X` to change octaves.

## Build the desktop app

On Windows:

```bash
npm ci
npm run desktop:build
```

This downloads the piano samples, creates the production web build, and writes an installer plus a portable executable to `release/`.

To open the Electron app without packaging it:

```bash
npm run desktop
```

## Curriculum

| Stage | Title                 | Focus                                                      |
| ----: | --------------------- | ---------------------------------------------------------- |
|     0 | Bearings              | Keyboard layout, note names, and a first five-finger shape |
|     1 | One key, whole system | C major, scale degrees, and primary chords                 |
|     2 | The spelling engine   | Building triads from any note in any key                   |
|     3 | The Roman lens        | Functional harmony and reading chord charts                |
|     4 | Smooth hands          | Inversions and voice leading                               |
|     5 | The whole map         | Sevenths, minor harmony, and all twelve keys               |
|     6 | Charts for real       | Shells, guide tones, comping grooves, and sight-reading    |
|     7 | Your own voice        | Improvisation, blues, swing, and learning songs by ear     |

After Stage 7, spaced reviews, rating challenges, song studies, and the sandbox keep the course useful for ongoing practice.

## Development

```bash
npm run check          # lint, types, contrast checks, and unit tests
npm run format:check   # formatting
npm run build          # production PWA build
npm run check:bundle   # compressed bundle-size budget
npm run test:e2e       # Playwright end-to-end suite
```

The app is built with React, TypeScript, Vite, Web MIDI, Web Audio, Dexie, Zustand, VexFlow, Vitest, Playwright, and Electron. CI runs the complete validation suite on every branch and pull request. Version tags build the portable Windows release automatically.

## Privacy and browser support

Keysense has no accounts, analytics, or server-side progress storage. Practice history is stored in IndexedDB on your device. Use the backup tools in Settings before clearing browser data or moving to another device.

Web MIDI is supported by Chromium-based desktop browsers. Safari and iOS do not expose Web MIDI, but the on-screen and computer-keyboard inputs remain available. The interface needs a window at least 1024 pixels wide so the piano remains playable.

## Project documentation

- [Project plan](PLAN.md) — product research, learning path, design, and roadmap
- [Implementation guide](IMPLEMENTATION.md) — architecture, data model, MIDI/audio, exercise engine, UI, curriculum, and scheduling
- [Current status](docs/STATUS.md) — completed work, verification, and known gaps
- [Technical decisions](docs/decisions.md) — documented implementation choices and tradeoffs
- [Song sourcing](docs/song-sourcing.md) — provenance and licensing notes for included musical material

The software is feature-complete through all eight planned stages. Teacher review, testing with more physical MIDI hardware, and observation with beginner learners remain useful areas for contribution.
