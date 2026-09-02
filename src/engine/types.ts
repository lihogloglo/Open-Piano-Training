import type { ChordQuality, Inversion } from '@/theory/chords';
import type { KeyContext } from '@/theory/keys';
import type { Degree } from '@/theory/degrees';

export type MidiNumber = number;
export type Hand = 'rh' | 'lh' | 'both';
export type TimingTier = 'relaxed' | 'standard' | 'strict';
export type MatchMode = 'wait' | 'tempo';
export type WeaningRung = 'keys-lit' | 'note-names' | 'chord-symbols' | 'lead-sheet' | 'by-ear';

export interface ExerciseDef {
  generator: string;
  params: Record<string, unknown>;
  mode: MatchMode;
  bpm?: number;
  timingTier?: TimingTier;
  rung: WeaningRung;
  hand: Hand;
  seedPolicy: 'fixed' | 'daily' | 'random';
}

export type Target =
  | { kind: 'note'; midi: MidiNumber; atBeat?: number; finger?: number }
  | {
      kind: 'set';
      midis: MidiNumber[];
      atBeat?: number;
      label: string;
      octaveFlexible: boolean;
      inversionOf?: { root: string; quality: ChordQuality; inversion: Inversion };
    }
  | { kind: 'any-of-degree'; degree: Degree; key: KeyContext; atBeat?: number };

export interface PromptItem {
  /** Big text shown for the current target (chord symbol, note name, question). */
  label: string;
  /** Smaller support line. */
  detail?: string;
}

export interface PromptModel {
  title: string;
  detail?: string;
  /** Per-target prompt items, aligned with targets (optional). */
  perTarget?: PromptItem[];
  key?: KeyContext;
}

export interface DemoNote {
  midi: MidiNumber;
  atBeat: number;
  durBeats: number;
}

export interface ExerciseInstance {
  def: ExerciseDef;
  seed: number;
  targets: Target[];
  prompt: PromptModel;
  /** Tempo-mode grid spacing when targets carry no explicit atBeat (default 1). */
  beatsPerTarget?: number;
  audioPreview?: { notes: DemoNote[]; bpm: number };
}

export type JudgeVerdict = 'perfect' | 'good' | 'ok' | 'wrong' | 'missed' | 'extra';

export interface NoteJudgment {
  targetIndex: number; // -1 for extras
  midi: MidiNumber;
  verdict: JudgeVerdict;
  /** Signed ms (early < 0 < late); null in wait mode / extras. */
  deltaMs: number | null;
}

export interface TakeResult {
  pitchAccuracy: number;
  timingAccuracy: number;
  score: number;
  stars: 0 | 1 | 2 | 3;
  judgments: NoteJudgment[];
  passed: boolean;
}

export type MatchEvent =
  | { type: 'targetFocused'; index: number }
  | { type: 'noteJudged'; judgment: NoteJudgment }
  | { type: 'hintEligible'; index: number; auto: boolean }
  | { type: 'completed'; result: TakeResult };

/** Normalized note input the matchers consume (pedal is filtered out upstream). */
export interface MatcherNoteEvent {
  kind: 'noteon' | 'noteoff';
  midi: MidiNumber;
  tPerf: number;
}
