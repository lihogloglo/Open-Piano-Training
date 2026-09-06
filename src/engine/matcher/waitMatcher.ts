import type { ExerciseInstance, MatchEvent, MatcherNoteEvent, NoteJudgment } from '../types';
import { chordAnySatisfied, noteBelongsToTarget, setSatisfied } from './setMatch';
import { scoreTake } from '../scoring';
import { applyVoiceLeading } from '../voiceLeading';

/**
 * Wait-mode matcher: no clock, advances target-by-target on correct input.
 * Wrong notes inform (and count toward the hint ladder) but never punish.
 * Set targets use a settle window: extra notes outside the set are marked
 * `extra`, but once the full set is held the target passes.
 */
export class WaitMatcher {
  private readonly instance: ExerciseInstance;
  private index = 0;
  private held = new Set<number>();
  private missesOnCurrent = 0;
  private judgments: NoteJudgment[] = [];
  private done = false;
  private focusedAt = 0;
  private lastInputAt = 0;
  private responseTimes: number[] = [];
  private hintsUsed = 0;
  /** Per-target midis that satisfied a set target (voice-leading scoring). */
  private playedVoicings: (number[] | null)[] = [];

  constructor(instance: ExerciseInstance) {
    this.instance = instance;
  }

  get targetIndex(): number {
    return this.index;
  }

  get isDone(): boolean {
    return this.done;
  }

  beginResponse(now: number): void {
    this.focusedAt = now;
  }

  start(now = 0): MatchEvent[] {
    this.focusedAt = now;
    return [{ type: 'targetFocused', index: 0 }];
  }

  feed(e: MatcherNoteEvent): MatchEvent[] {
    if (this.done) return [];
    if (e.kind === 'noteoff') {
      this.held.delete(e.midi);
      return [];
    }
    this.lastInputAt = e.tPerf;
    this.held.add(e.midi);

    const target = this.instance.targets[this.index];
    if (!target) return [];
    const events: MatchEvent[] = [];

    if (target.kind === 'set' || target.kind === 'chord-any') {
      if (!noteBelongsToTarget(e.midi, target)) {
        this.missesOnCurrent += 1;
        events.push(this.judge(e.midi, 'extra'));
        if (!this.instance.def.assessment && this.missesOnCurrent === 2)
          events.push({ type: 'hintEligible', index: this.index, auto: false });
        if (!this.instance.def.assessment && this.missesOnCurrent === 4) {
          this.hintsUsed += 1;
          events.push({ type: 'hintEligible', index: this.index, auto: true });
        }
      }
      // Notes left from the previous target must not block a quick transition.
      // Wrong notes are still judged above, but only possible members take part
      // in the current grip check.
      const relevantHeld = new Set([...this.held].filter((midi) => noteBelongsToTarget(midi, target)));
      const satisfied =
        target.kind === 'set' ? setSatisfied(relevantHeld, target) : chordAnySatisfied(relevantHeld, target);
      if (satisfied) {
        const members = [...relevantHeld];
        this.playedVoicings[this.index] = members;
        for (const m of members) events.push(this.judge(m, 'perfect'));
        events.push(...this.advance());
      }
      return events;
    }

    if (noteBelongsToTarget(e.midi, target)) {
      events.push(this.judge(e.midi, 'perfect'));
      events.push(...this.advance());
    } else {
      this.missesOnCurrent += 1;
      events.push(this.judge(e.midi, 'wrong'));
      if (!this.instance.def.assessment && this.missesOnCurrent === 2)
        events.push({ type: 'hintEligible', index: this.index, auto: false });
      if (!this.instance.def.assessment && this.missesOnCurrent === 4) {
        this.hintsUsed += 1;
        events.push({ type: 'hintEligible', index: this.index, auto: true });
      }
    }
    return events;
  }

  private judge(midi: number, verdict: NoteJudgment['verdict']): MatchEvent {
    const judgment: NoteJudgment = {
      targetIndex: this.index,
      midi,
      verdict,
      deltaMs: null,
    };
    this.judgments.push(judgment);
    return { type: 'noteJudged', judgment };
  }

  private advance(): MatchEvent[] {
    this.responseTimes.push(Math.max(0, this.lastInputAt - this.focusedAt));
    this.focusedAt = this.lastInputAt;
    this.index += 1;
    this.missesOnCurrent = 0;
    if (this.index >= this.instance.targets.length) {
      this.done = true;
      let result = scoreTake(
        this.judgments,
        this.instance.targets.length,
        'wait',
        this.instance.def.passScore ?? 0.8,
      );
      const vl = this.instance.voiceLeading;
      if (vl) {
        const played = this.instance.targets.map((_, i) => this.playedVoicings[i] ?? null);
        result = applyVoiceLeading(result, played, vl.ideal, this.instance.def.passScore ?? 0.8);
      }
      result = { ...result, responseTimesMs: this.responseTimes, hintsUsed: this.hintsUsed };
      return [{ type: 'completed', result }];
    }
    return [{ type: 'targetFocused', index: this.index }];
  }
}
