import type { ChordQuality, Inversion } from '@/theory/chords';
import type { KeyContext } from '@/theory/keys';
import type { Degree } from '@/theory/degrees';

export type MidiNumber = number;
export type Hand = 'rh' | 'lh' | 'both';
export type TimingTier = 'relaxed' | 'standard' | 'strict';
export type MatchMode = 'wait' | 'tempo';
export type WeaningRung = 'keys-lit' | 'note-names' | 'chord-symbols' | 'lead-sheet' | 'by-ear';

export interface ExerciseDef {
  focus?: { start: number; end: number } | undefined;
  assessment?: boolean | undefined;
  passScore?: number | undefined;
  generator: string;
  params: Record<string, unknown>;
  mode: MatchMode;
  // `| undefined` keeps zod-inferred content assignable under exactOptionalPropertyTypes.
  bpm?: number | undefined;
  timingTier?: TimingTier | undefined;
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
  | { kind: 'any-of-degree'; degree: Degree; key: KeyContext; atBeat?: number }
  | { kind: 'pitch-class-group'; pitchClasses: number[]; label: string; atBeat?: number }
  | {
      /** Multiple valid chord answers (harmonization, ear-progression). Wait mode only. */
      kind: 'chord-any';
      accept: { root: string; quality: ChordQuality }[];
      /** A lone root note (any octave) of accept[0] also passes (ear answers). */
      bassRootOk?: boolean;
      label: string;
      atBeat?: number;
    };

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
  beatsPerBar?: number;
  def: ExerciseDef;
  seed: number;
  targets: Target[];
  prompt: PromptModel;
  /** Tempo-mode grid spacing when targets carry no explicit atBeat (default 1). */
  beatsPerTarget?: number;
  /** Played once before the run starts (e.g. a cadence establishing the key). */
  audioPreview?: { notes: DemoNote[]; bpm: number } | undefined;
  /** Ear exercises: played when the target gains focus; input gated until done.
   *  Sparse — targets without their own preview hold `undefined`. */
  perTargetPreview?: ({ notes: DemoNote[]; bpm: number } | undefined)[] | undefined;
  /** Smooth progressions: reference voicings; matchers blend vl into the score. */
  voiceLeading?: { ideal: MidiNumber[][] } | undefined;
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
  firstAnswerAccuracy?: number;
  responseTimesMs?: number[];
  hintsUsed?: number;
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
