import type { ExerciseInstance, MatchEvent, MatcherNoteEvent, NoteJudgment, Target } from '../types';
import { TIER_WINDOWS, bandOf, worseBand, type TimingWindows } from './timing';
import { noteBelongsToTarget, setSatisfied, setMemberKey } from './setMatch';
import { scoreTake } from '../scoring';
import { applyVoiceLeading } from '../voiceLeading';

interface TargetState {
  target: Target;
  tExpect: number;
  /** note targets: consumed on hit. set targets: per-member pc tracking. */
  consumed: boolean;
  missed: boolean;
  /** set targets only */
  rollOpenAt: number | null;
  memberDeltas: number[];
  memberBands: ('perfect' | 'good' | 'ok')[];
  membersHit: Set<number>; // pitch classes (flexible) or midis (exact)
  /** Actual midis that landed (voice-leading scoring). */
  playedMidis: number[];
  wantedCount: number;
}

/**
 * Tempo-mode matcher: targets live on a beat grid; every noteon is judged
 * early/late/perfect against its nearest matching target. Call `tick(now)`
 * regularly (each beat and at the end) to flush missed targets; `finish()`
 * force-completes.
 */
export class TempoMatcher {
  private readonly instance: ExerciseInstance;
  private readonly windows: TimingWindows;
  private readonly beatMs: number;
  private readonly latencyOffsetMs: number;
  private states: TargetState[] = [];
  private judgments: NoteJudgment[] = [];
  private done = false;

  /**
   * @param t0Perf perf-clock time of beat 0 (first beat after count-in)
   */
  constructor(instance: ExerciseInstance, bpm: number, t0Perf: number, latencyOffsetMs = 0) {
    this.instance = instance;
    this.windows = TIER_WINDOWS[instance.def.timingTier ?? 'standard'];
    this.beatMs = 60_000 / bpm;
    this.latencyOffsetMs = latencyOffsetMs;
    const spacing = instance.beatsPerTarget ?? 1;
    this.states = instance.targets.map((target, i) => {
      if (target.kind === 'chord-any') {
        throw new Error('chord-any targets are wait-mode only');
      }
      const atBeat = target.atBeat ?? i * spacing;
      const wantedCount =
        target.kind === 'set' ? new Set(target.midis.map((m) => setMemberKey(m, target))).size : 1;
      return {
        target,
        tExpect: t0Perf + atBeat * this.beatMs,
        consumed: false,
        missed: false,
        rollOpenAt: null,
        memberDeltas: [],
        memberBands: [],
        membersHit: new Set<number>(),
        playedMidis: [],
        wantedCount,
      };
    });
  }

  get isDone(): boolean {
    return this.done;
  }

  /** Perf-time after which the run cannot change (for scheduling the final tick). */
  get endTimePerf(): number {
    const last = this.states[this.states.length - 1];
    return (last?.tExpect ?? 0) + this.windows.outer + 50;
  }

  feed(e: MatcherNoteEvent): MatchEvent[] {
    if (this.done || e.kind !== 'noteon') return [];
    const t = e.tPerf - this.latencyOffsetMs;
    const events: MatchEvent[] = [];

    // Find the nearest unconsumed, unmissed target within the outer window
    // whose pitch matches.
    let best: { state: TargetState; index: number; delta: number } | null = null;
    for (let i = 0; i < this.states.length; i++) {
      const s = this.states[i];
      if (!s || s.consumed || s.missed) continue;
      const delta = t - s.tExpect;
      if (Math.abs(delta) > this.windows.outer) continue;
      if (!noteBelongsToTarget(e.midi, s.target)) continue;
      if (!best || Math.abs(delta) < Math.abs(best.delta)) best = { state: s, index: i, delta };
    }

    if (!best) {
      // Octave doublings belong to the chord just completed, not an extra note.
      if (
        this.states.some(
          (s) =>
            s.consumed &&
            s.target.kind === 'set' &&
            s.target.octaveFlexible &&
            !s.target.inversionOf &&
            !s.target.transposeOnly &&
            Math.abs(t - s.tExpect) <= this.windows.roll &&
            noteBelongsToTarget(e.midi, s.target),
        )
      )
        return [];
      // Pitch-wrong near some pending target → wrong; otherwise extra.
      const nearest = this.states
        .map((s, index) => ({ s, index }))
        .filter(({ s }) => !s.consumed && !s.missed && Math.abs(t - s.tExpect) <= this.windows.outer)
        .sort((a, b) => Math.abs(t - a.s.tExpect) - Math.abs(t - b.s.tExpect))[0];
      const verdict = nearest ? 'wrong' : 'extra';
      const judgment: NoteJudgment = {
        targetIndex: nearest?.index ?? -1,
        midi: e.midi,
        verdict,
        deltaMs: null,
      };
      this.judgments.push(judgment);
      events.push({ type: 'noteJudged', judgment });
      return events;
    }

    const { state, index } = best;
    if (state.target.kind === 'set') {
      events.push(...this.feedSetMember(state, index, e.midi, t));
    } else {
      const band = bandOf(best.delta, this.windows);
      if (band) {
        state.consumed = true;
        const judgment: NoteJudgment = {
          targetIndex: index,
          midi: e.midi,
          verdict: band,
          deltaMs: Math.round(best.delta),
        };
        this.judgments.push(judgment);
        events.push({ type: 'noteJudged', judgment });
      }
    }
    events.push(...this.maybeComplete());
    return events;
  }

  private feedSetMember(state: TargetState, index: number, midi: number, t: number): MatchEvent[] {
    const events: MatchEvent[] = [];
    const target = state.target;
    if (target.kind !== 'set') return events;

    const memberKey = setMemberKey(midi, target);
    if (state.membersHit.has(memberKey)) return events; // repeated member — ignore

    // First member opens the roll window.
    if (state.rollOpenAt === null) state.rollOpenAt = t;
    const withinRoll = t - state.rollOpenAt <= this.windows.roll;
    const delta = t - state.tExpect;
    const band = bandOf(delta, this.windows);
    if (!band) return events;

    state.membersHit.add(memberKey);
    state.memberDeltas.push(delta);
    state.memberBands.push(withinRoll ? band : worseBand(band, 'ok'));
    state.playedMidis.push(midi);

    if (state.membersHit.size >= state.wantedCount) {
      state.consumed = true;
      const meanDelta = state.memberDeltas.reduce((a, b) => a + b, 0) / state.memberDeltas.length;
      const worst = setSatisfied(new Set(state.playedMidis), target)
        ? state.memberBands.reduce(worseBand)
        : 'wrong';
      const judgment: NoteJudgment = {
        targetIndex: index,
        midi,
        verdict: worst,
        deltaMs: Math.round(meanDelta),
      };
      this.judgments.push(judgment);
      events.push({ type: 'noteJudged', judgment });
    }
    return events;
  }

  /** Flush targets whose outer window has closed without a hit. */
  tick(nowPerf: number): MatchEvent[] {
    if (this.done) return [];
    const t = nowPerf - this.latencyOffsetMs;
    const events: MatchEvent[] = [];
    this.states.forEach((s, i) => {
      if (s.consumed || s.missed) return;
      if (t > s.tExpect + this.windows.outer) {
        s.missed = true;
        const midi =
          s.target.kind === 'note'
            ? s.target.midi
            : s.target.kind === 'set'
              ? (s.target.midis[0] ?? 0)
              : s.target.kind === 'pitch-class-group'
                ? (s.target.pitchClasses[0] ?? 0) + 60
                : 0;
        const judgment: NoteJudgment = { targetIndex: i, midi, verdict: 'missed', deltaMs: null };
        this.judgments.push(judgment);
        events.push({ type: 'noteJudged', judgment });
      }
    });
    events.push(...this.maybeComplete());
    return events;
  }

  /** Force completion (end of run). */
  finish(): MatchEvent[] {
    if (this.done) return [];
    const events = this.tick(Number.POSITIVE_INFINITY);
    if (!this.done) {
      this.done = true;
      events.push({ type: 'completed', result: this.finalResult() });
    }
    return events;
  }

  private maybeComplete(): MatchEvent[] {
    if (this.done) return [];
    const allSettled = this.states.every((s) => s.consumed || s.missed);
    if (!allSettled) return [];
    this.done = true;
    return [{ type: 'completed', result: this.finalResult() }];
  }

  private finalResult() {
    let result = scoreTake(
      this.judgments,
      this.instance.targets.length,
      'tempo',
      this.instance.def.passScore ?? 0.8,
    );
    const vl = this.instance.voiceLeading;
    if (vl) {
      const played = this.states.map((s) =>
        s.target.kind === 'set' && s.consumed && s.playedMidis.length > 0 ? s.playedMidis : null,
      );
      result = applyVoiceLeading(result, played, vl.ideal, this.instance.def.passScore ?? 0.8);
    }
    return result;
  }
}
