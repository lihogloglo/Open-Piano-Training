# 02 — Data Model

All types live where noted; this doc is the source of truth. Use these names verbatim.

## ID conventions

Deterministic, human-readable, lowercase:

| Entity     | Pattern                                              | Examples                                                                                                                                                       |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage      | `s{n}`                                               | `s0`, `s3`                                                                                                                                                     |
| Unit       | `s{n}.u{m}`                                          | `s1.u3`                                                                                                                                                        |
| Checkpoint | `s{n}.cp`                                            | `s2.cp`                                                                                                                                                        |
| Skill atom | `{kind}:{params-joined-by-:}`                        | `scale:d:major:rh:1oct`, `chord:eb:maj:inv1`, `prog:i-v-vi-iv:g`, `keysig:e:major`, `ear:degree:5`, `ear:quality:m7`                                           |
| Generator  | kebab                                                | `scale-run`, `chord-grip`, `grip-interleave`, `progression-play`, `ear-degree`, `ear-progression`, `flashcard`, `chart-play`, `improv-sandbox`, `read-snippet` |
| Song       | `song:{slug}`                                        | `song:axis-anthem`                                                                                                                                             |
| Take       | ULID (library-free 26-char impl in `progress/db.ts`) | —                                                                                                                                                              |

## MIDI & events (`src/midi/types.ts`)

```ts
export type MidiNumber = number; // 21..108 (A0..C8)

export interface NoteEvent {
  kind: 'noteon' | 'noteoff';
  midi: MidiNumber;
  velocity: number; // 0..1 normalized; noteon with raw vel 0 MUST be emitted as kind:'noteoff'
  tPerf: number; // performance.now() ms domain
  channel: number;
}
export interface PedalEvent {
  kind: 'pedal';
  down: boolean;
  value: number;
  tPerf: number;
}
export type MidiEvent = NoteEvent | PedalEvent;

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
}

export interface MidiAdapter {
  init(): Promise<'ok' | 'unsupported' | 'denied'>;
  listInputs(): MidiDeviceInfo[];
  select(deviceId: string | null): void; // null = all inputs
  onEvent(cb: (e: MidiEvent) => void): () => void; // returns unsubscribe
  onDevicesChanged(cb: (inputs: MidiDeviceInfo[]) => void): () => void;
  dispose(): void;
}
```

## Theory display (`src/theory/`)

```ts
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ChordQuality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'maj7'
  | 'm7'
  | '7'
  | 'm7b5'
  | 'dim7'
  | 'sus2'
  | 'sus4'
  | '6'
  | 'm6'
  | 'add9';
export type Inversion = 0 | 1 | 2 | 3;
export interface KeyContext {
  tonic: string;
  mode: 'major' | 'minor';
} // tonic like 'Eb'
// theory/degrees.ts exports DEGREE_COLORS: Record<Degree, string> (values in 05 §Tokens)
```

## Curriculum schema (`src/curriculum/schema.ts`) — validated with zod

```ts
export type Strand = 'ear' | 'theory' | 'keys' | 'read' | 'create';
export type WeaningRung = 'keys-lit' | 'note-names' | 'chord-symbols' | 'lead-sheet' | 'by-ear';
export type Hand = 'rh' | 'lh' | 'both';
export type TimingTier = 'relaxed' | 'standard' | 'strict';

export interface Stage {
  id: string;
  ordinal: number;
  title: string;
  tagline: string;
  summary: string; // 2-3 sentences, shown on the path
  unitIds: string[]; // ordered; last one may be the checkpoint
}

export interface Unit {
  id: string;
  stageId: string;
  ordinal: number;
  title: string; // learner-facing, e.g. "Why V pulls home"
  strandWeights: Partial<Record<Strand, number>>; // for the path node's strand chips
  concepts: string[]; // atom ids INTRODUCED here (registered on completion)
  prerequisites: string[]; // unit ids
  steps: LessonStep[];
  minutes: number; // estimate shown on the node
  kind: 'lesson' | 'review' | 'checkpoint';
}

export type LessonStep =
  | { kind: 'explain'; id: string; blocks: ExplainBlock[] }
  | { kind: 'guided'; id: string; exercise: ExerciseDef } // wait mode forced
  | { kind: 'ladder'; id: string; exercise: ExerciseDef; tempos: number[] } // e.g. [0.5,0.75,1]
  | { kind: 'graded'; id: string; exercise: ExerciseDef; passScore: number } // default 0.8
  | { kind: 'create'; id: string; prompt: string; exercise: ExerciseDef }; // sandbox, unscored

export type ExplainBlock =
  | { kind: 'text'; md: string } // markdown, short
  | { kind: 'keyboardDemo'; demo: DemoScript } // animated keyboard + audio
  | { kind: 'progressionCard'; roman: string[]; key: KeyContext; songRefs?: string[] }
  | { kind: 'circleOfFifths'; highlight?: string[] }
  | { kind: 'earCheck'; question: EarQuestion }; // 1-tap inline check

export interface DemoScript {
  events: { midi: number; atBeat: number; durBeats: number }[];
  bpm: number;
  loop: boolean;
  labels: WeaningRung;
}

export interface ExerciseDef {
  generator: string; // generator id
  params: Record<string, unknown>; // generator-specific, typed per-generator (04)
  mode: 'wait' | 'tempo';
  bpm?: number; // required when mode 'tempo'
  timingTier?: TimingTier; // default from stage (s0-1 relaxed, s2-4 standard, s5+ strict)
  rung: WeaningRung;
  hand: Hand;
  seedPolicy: 'fixed' | 'daily' | 'random'; // fixed = same every time (guided), random = fresh
}
```

## Songs (`src/curriculum/content/songs.ts`)

Original chord charts (no copyrighted lyrics/melodies; style references only):

```ts
export interface Song {
  id: string;
  title: string; // our own titles
  styleRef: string; // "in the style of…" text
  key: KeyContext;
  bpm: number;
  timeSig: [number, number];
  sections: { name: string; bars: Bar[] }[];
  romanized: string[]; // e.g. ['I','V','vi','IV'] per bar for transposition
  stage: number; // earliest stage it appears
}
export interface Bar {
  chords: { symbol: string; beats: number }[];
}
```

## Takes & replay (`src/engine/replay.ts`)

```ts
export interface Take {
  id: string; // ULID
  atomIds: string[]; // skills this take evidences
  unitId?: string;
  sessionId?: string;
  exercise: ExerciseDef & { resolvedSeed: number };
  startedAt: number; // epoch ms
  bpm: number | null;
  events: CompactEvent[]; // [dtMs, midi, kind(0/1), vel*127] tuples — small & replayable
  result: TakeResult;
}
export interface NoteJudgment {
  targetIndex: number;
  midi: MidiNumber;
  verdict: 'perfect' | 'good' | 'ok' | 'wrong' | 'missed' | 'extra';
  deltaMs: number | null;
}
export interface TakeResult {
  pitchAccuracy: number; // 0..1
  timingAccuracy: number; // 0..1 (1 in wait mode)
  score: number; // 0..1 combined (04 §Scoring)
  stars: 0 | 1 | 2 | 3;
  judgments: NoteJudgment[];
  passed: boolean;
}
```

## Progress (`src/progress/`)

```ts
export interface SkillAtom {
  // registry entry (code-defined, not stored)
  id: string;
  kind: 'scale' | 'chord' | 'prog' | 'keysig' | 'spell' | 'ear' | 'read' | 'song';
  strand: Strand;
  label: string; // display, e.g. "E♭ major · 1st inversion"
  params: Record<string, string>;
  gradedBy: string[]; // generator ids that can test it
  difficulty: number; // 1..100, used by ratings (07)
}

export interface AtomProgress {
  // Dexie row
  atomId: string;
  fsrs: FsrsCardState; // ts-fsrs Card serialized
  introducedAt: number;
  lastSeenAt: number;
  bestScore: number;
  attempts: number;
  fluent: boolean; // 07 §Fluency
}

export interface UnitProgress {
  unitId: string;
  status: 'locked' | 'available' | 'in-progress' | 'passed';
  bestScore: number;
  completedAt?: number;
}

export interface StrandRating {
  strand: Strand;
  level: number;
  /*1..99*/ history: { date: string; level: number }[];
}

export interface SessionPlan {
  // built daily (07 §Session builder)
  id: string;
  date: string; // YYYY-MM-DD local
  blocks: SessionBlock[];
  state: 'fresh' | 'partial' | 'done';
}
export type SessionBlock =
  | { kind: 'warmup'; exercises: ExerciseDef[] }
  | { kind: 'new'; unitId: string }
  | { kind: 'review'; atomIds: string[] } // rendered as interleaved drill
  | { kind: 'create'; prompt: string; exercise: ExerciseDef };
```

## Database (`src/progress/db.ts`) — Dexie schema v1

```ts
db.version(1).stores({
  takes: 'id, startedAt, unitId, *atomIds',
  atomProgress: 'atomId, fluent, lastSeenAt',
  unitProgress: 'unitId, status',
  ratings: 'strand',
  sessions: 'id, date',
  settings: 'key', // {key, value} rows: theme, deviceId, audioEnabled, dailyMinutes, name…
  meta: 'key', // schemaVersion, streak data, badges: {key:'badges', value: string[]}
});
```

Rules: schema changes ONLY via new `db.version(n)` with upgrade fn; `takes.events` may be large — cap stored takes at 500 (prune oldest non-best on write). Export/import (Settings) = JSON dump/restore of all tables with schema version check.

## Settings (defaults)

```ts
{ theme: 'dark', deviceId: null, audioEnabled: true, masterVolume: 0.8,
  metronomeVolume: 0.7, labelsDefault: 'auto',    // auto = rung-appropriate
  dailyMinutes: 20, reducedMotion: 'system', latencyOffsetMs: 0 }  // latencyOffset: 03 §Calibration
```
