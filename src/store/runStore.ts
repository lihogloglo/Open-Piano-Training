import { create } from 'zustand';
import type { ExerciseInstance, JudgeVerdict, MatchEvent, TakeResult } from '@/engine/types';
import { WaitMatcher } from '@/engine/matcher/waitMatcher';
import { TempoMatcher } from '@/engine/matcher/tempoMatcher';
import { TIER_WINDOWS } from '@/engine/matcher/timing';
import { targetMidis } from '@/engine/matcher/setMatch';
import { TakeRecorder, type Take } from '@/engine/replay';
import { startMetronome, stopMetronome, onBeat, type BeatInfo } from '@/audio/metronome';
import { unlockAudio } from '@/audio/clock';
import { playNote, stopNote } from '@/audio/sampler';
import { subscribeMidiEvents } from './midiStore';
import { useSettingsStore } from './settingsStore';

export type RunPhase = 'idle' | 'count-in' | 'running' | 'done';

interface RunState {
  phase: RunPhase;
  instance: ExerciseInstance | null;
  bpm: number | null;
  targetIndex: number;
  /** midi -> highlight state for the Keyboard */
  targets: ReadonlyMap<number, 'target' | 'hint'>;
  /** midi -> most recent judgment (flash; cleared after 350ms) */
  judgments: ReadonlyMap<number, JudgeVerdict>;
  fingerMap: ReadonlyMap<number, number>;
  /** negative during count-in, then 0.. */
  beatIndex: number | null;
  beatsPerBar: number;
  /** perf-clock time of beat 0 (tempo mode) — lets tools schedule against the grid. */
  anchorT0Perf: number | null;
  /** Ear exercises: a preview is playing; input is ignored until it ends. */
  listening: boolean;
  result: TakeResult | null;
  lastTake: Take | null;
  startRun(instance: ExerciseInstance): Promise<void>;
  abortRun(): void;
}

let waitMatcher: WaitMatcher | null = null;
let tempoMatcher: TempoMatcher | null = null;
let recorder: TakeRecorder | null = null;
let unsubBeat: (() => void) | null = null;
let finishTimer: ReturnType<typeof setTimeout> | undefined;
let tempoStartGate = 0; // ignore input earlier than this (count-in)
const flashTimers = new Map<number, ReturnType<typeof setTimeout>>();
let previewTimers: ReturnType<typeof setTimeout>[] = [];
let previewUntilPerf = 0;

function clearPreview(): void {
  for (const t of previewTimers) clearTimeout(t);
  previewTimers = [];
  previewUntilPerf = 0;
}

/** Play a demo (ear prompts) through the sampler; gates input until done. */
function schedulePreview(
  preview: { notes: { midi: number; atBeat: number; durBeats: number }[]; bpm: number },
  set: (partial: Partial<RunState>) => void,
  leadMs = 150,
): void {
  const beatMs = 60_000 / preview.bpm;
  let end = leadMs;
  for (const n of preview.notes) {
    const at = leadMs + n.atBeat * beatMs;
    const until = at + n.durBeats * beatMs;
    end = Math.max(end, until);
    previewTimers.push(
      setTimeout(() => playNote(n.midi, 0.7), at),
      setTimeout(() => stopNote(n.midi), until),
    );
  }
  previewUntilPerf = performance.now() + end + 120;
  set({ listening: true });
  previewTimers.push(
    setTimeout(() => {
      set({ listening: false });
    }, end + 120),
  );
}

function computeHighlights(
  instance: ExerciseInstance,
  index: number,
  hint: boolean,
): Map<number, 'target' | 'hint'> {
  const map = new Map<number, 'target' | 'hint'>();
  const target = instance.targets[index];
  if (!target) return map;
  const lit = instance.def.rung === 'keys-lit' || hint;
  if (!lit) return map;
  for (const midi of targetMidis(target)) map.set(midi, hint ? 'hint' : 'target');
  return map;
}

function computeFingerMap(instance: ExerciseInstance): Map<number, number> {
  const map = new Map<number, number>();
  for (const t of instance.targets) {
    if (t.kind === 'note' && t.finger !== undefined) map.set(t.midi, t.finger);
  }
  return map;
}

export const useRunStore = create<RunState>((set, get) => ({
  phase: 'idle',
  instance: null,
  bpm: null,
  targetIndex: 0,
  targets: new Map(),
  judgments: new Map(),
  fingerMap: new Map(),
  beatIndex: null,
  beatsPerBar: 4,
  anchorT0Perf: null,
  listening: false,
  result: null,
  lastTake: null,

  async startRun(instance) {
    get().abortRun();
    const settings = useSettingsStore.getState();
    recorder = new TakeRecorder(performance.now());
    const fingerMap =
      instance.def.rung === 'keys-lit' ? computeFingerMap(instance) : new Map<number, number>();

    if (instance.def.mode === 'wait') {
      waitMatcher = new WaitMatcher(instance);
      set({
        phase: 'running',
        instance,
        bpm: null,
        targetIndex: 0,
        targets: computeHighlights(instance, 0, false),
        judgments: new Map(),
        fingerMap,
        beatIndex: null,
        anchorT0Perf: null,
        listening: false,
        result: null,
      });
      if (instance.audioPreview || instance.perTargetPreview) {
        await unlockAudio();
        let lead = 150;
        if (instance.audioPreview) {
          schedulePreview(instance.audioPreview, set, lead);
          lead = previewUntilPerf - performance.now() + 350;
        }
        const first = instance.perTargetPreview?.[0];
        if (first) schedulePreview(first, set, lead);
      }
      processEvents(waitMatcher.start(), set, get);
      return;
    }

    // Tempo mode: metronome + count-in.
    const bpm = instance.def.bpm ?? 80;
    await unlockAudio();
    const anchor = startMetronome({ bpm, volume: settings.metronomeVolume });
    const windows = TIER_WINDOWS[instance.def.timingTier ?? 'standard'];
    tempoStartGate = anchor.t0Perf - windows.outer;
    tempoMatcher = new TempoMatcher(instance, bpm, anchor.t0Perf, settings.latencyOffsetMs);
    set({
      phase: 'count-in',
      instance,
      bpm,
      targetIndex: 0,
      targets: new Map(),
      judgments: new Map(),
      fingerMap,
      beatIndex: null,
      anchorT0Perf: anchor.t0Perf,
      listening: false,
      result: null,
    });

    unsubBeat = onBeat((beat) => handleBeat(beat, set, get));
    const endDelay = tempoMatcher.endTimePerf - performance.now() + 100;
    finishTimer = setTimeout(() => {
      if (tempoMatcher && !tempoMatcher.isDone) processEvents(tempoMatcher.finish(), set, get);
    }, endDelay);
  },

  abortRun() {
    stopMetronome();
    clearPreview();
    unsubBeat?.();
    unsubBeat = null;
    clearTimeout(finishTimer);
    for (const t of flashTimers.values()) clearTimeout(t);
    flashTimers.clear();
    waitMatcher = null;
    tempoMatcher = null;
    recorder = null;
    set({
      phase: 'idle',
      instance: null,
      bpm: null,
      targetIndex: 0,
      targets: new Map(),
      judgments: new Map(),
      fingerMap: new Map(),
      beatIndex: null,
      anchorT0Perf: null,
      listening: false,
      result: null,
    });
  },
}));

type Set = (partial: Partial<RunState>) => void;
type Get = () => RunState;

function handleBeat(beat: BeatInfo, set: Set, get: Get): void {
  const { phase, instance } = get();
  if (!instance || !tempoMatcher) return;
  set({ beatIndex: beat.beatIndex });
  if (beat.beatIndex >= 0 && phase === 'count-in') set({ phase: 'running' });
  // Advance the highlighted target on the grid (keys-lit rung).
  if (beat.beatIndex >= 0) {
    const spacing = instance.beatsPerTarget ?? 1;
    const index = Math.min(Math.floor(beat.beatIndex / spacing), instance.targets.length - 1);
    set({ targetIndex: index, targets: computeHighlights(instance, index, false) });
  }
  processEvents(tempoMatcher.tick(performance.now()), set, get);
}

function flashJudgment(midi: number, verdict: JudgeVerdict, set: Set, get: Get): void {
  const next = new Map(get().judgments);
  next.set(midi, verdict);
  set({ judgments: next });
  clearTimeout(flashTimers.get(midi));
  flashTimers.set(
    midi,
    setTimeout(() => {
      const cleared = new Map(get().judgments);
      cleared.delete(midi);
      set({ judgments: cleared });
      flashTimers.delete(midi);
    }, 350),
  );
}

function processEvents(events: MatchEvent[], set: Set, get: Get): void {
  for (const ev of events) {
    if (ev.type === 'noteJudged') {
      flashJudgment(ev.judgment.midi, ev.judgment.verdict, set, get);
    } else if (ev.type === 'targetFocused') {
      const { instance } = get();
      if (instance) {
        set({ targetIndex: ev.index, targets: computeHighlights(instance, ev.index, false) });
        const preview = instance.perTargetPreview?.[ev.index];
        if (preview && ev.index > 0) schedulePreview(preview, set, 500);
      }
    } else if (ev.type === 'hintEligible') {
      const { instance } = get();
      if (instance && ev.auto) {
        set({ targets: computeHighlights(instance, get().targetIndex, true) });
      }
    } else {
      // completed
      stopMetronome();
      unsubBeat?.();
      unsubBeat = null;
      clearTimeout(finishTimer);
      const { instance, bpm } = get();
      let lastTake: Take | null = null;
      if (instance && recorder) {
        lastTake = recorder.finalize(instance.def, instance.seed, ev.result, { bpm: bpm ?? null });
      }
      set({ phase: 'done', result: ev.result, lastTake, targets: new Map() });
    }
  }
}

// Single module-level wiring: every normalized MIDI event reaches the live matcher.
subscribeMidiEvents((e) => {
  if (e.kind === 'pedal') return;
  const { phase } = useRunStore.getState();
  if (phase !== 'running' && phase !== 'count-in') return;
  recorder?.record(e.kind, e.midi, e.velocity, e.tPerf);
  const set = useRunStore.setState.bind(useRunStore) as Set;
  const get = useRunStore.getState.bind(useRunStore) as Get;
  if (waitMatcher && !waitMatcher.isDone) {
    // Ear exercises: ignore presses while a preview is sounding — but releases
    // must always reach the matcher or its held-note set goes stale.
    if (e.kind === 'noteon' && e.tPerf < previewUntilPerf) return;
    processEvents(waitMatcher.feed({ kind: e.kind, midi: e.midi, tPerf: e.tPerf }), set, get);
  } else if (tempoMatcher && !tempoMatcher.isDone && e.tPerf >= tempoStartGate) {
    processEvents(tempoMatcher.feed({ kind: e.kind, midi: e.midi, tPerf: e.tPerf }), set, get);
  }
});
