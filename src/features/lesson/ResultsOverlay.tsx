import { diagnose } from '@/engine/diagnosis';
import type { ExerciseInstance } from '@/engine/types';
import type { TakeResult, JudgeVerdict } from '@/engine/types';
import { ScoreDial } from '@/ui/ScoreDial';
import { StarRating } from '@/ui/StarRating';
import { Button } from '@/ui/Button';
import styles from './ResultsOverlay.module.css';

const VERDICT_COLOR: Record<JudgeVerdict, string> = {
  perfect: 'var(--judge-perfect)',
  good: 'var(--judge-good)',
  ok: 'var(--judge-ok)',
  wrong: 'var(--judge-wrong)',
  missed: 'var(--judge-missed)',
  extra: 'var(--judge-wrong)',
};

/** Worst verdict per target, in target order. */
function targetStrip(result: TakeResult, targetCount: number): JudgeVerdict[] {
  const rank: Record<JudgeVerdict, number> = { perfect: 0, good: 1, ok: 2, wrong: 3, extra: 3, missed: 4 };
  const strip: (JudgeVerdict | undefined)[] = Array.from({ length: targetCount });
  for (const j of result.judgments) {
    if (j.targetIndex < 0 || j.targetIndex >= targetCount) continue;
    const prev = strip[j.targetIndex];
    if (prev === undefined || rank[j.verdict] > rank[prev]) strip[j.targetIndex] = j.verdict;
  }
  return strip.map((v) => v ?? 'missed');
}

interface ResultsOverlayProps {
  result: TakeResult;
  instance?: ExerciseInstance | null;
  practiceOnly?: boolean;
  targetCount: number;
  isTempo: boolean;
  failCount: number;
  allowSkip: boolean;
  onRetry: () => void;
  onRetrySlower?: (() => void) | undefined;
  onFocus?: (() => void) | undefined;
  onContinue: () => void;
  onSkip: () => void;
  /** Placement mode: bail out of the checkpoint chain and start the path here. */
  onPlacementStop?: (() => void) | undefined;
}

export function ResultsOverlay(p: ResultsOverlayProps) {
  const strip = targetStrip(p.result, p.targetCount);
  return (
    <div className={styles['overlay']}>
      <div className={styles['panel']}>
        <div className={styles['top']}>
          <ScoreDial score={p.result.score} />
          <div className={styles['summary']}>
            <StarRating stars={p.result.stars} />
            <h3>
              {p.practiceOnly
                ? 'Practice complete'
                : p.result.passed
                  ? 'Passed!'
                  : 'Let’s focus the next try'}
            </h3>
            <p className={styles['split']}>
              Notes {Math.round(p.result.pitchAccuracy * 100)}%
              {p.isTempo && <> · Timing {Math.round(p.result.timingAccuracy * 100)}%</>}
            </p>
          </div>
        </div>
        <p>{diagnose(p.result, p.instance)}</p>
        {p.result.firstAnswerAccuracy !== undefined && (
          <p>First answers: {Math.round(p.result.firstAnswerAccuracy * 100)}%</p>
        )}
        {p.practiceOnly && <p>Try the full exercise at the target tempo to complete this step.</p>}
        <div className={styles['strip']} aria-label="Per-note results">
          {strip.map((v, i) => (
            <span
              key={i}
              className={styles['dot']}
              style={{ background: VERDICT_COLOR[v] }}
              title={`${i + 1}: ${v}`}
            />
          ))}
        </div>
        <div className={styles['actions']}>
          <Button onClick={p.onRetry}>Try again</Button>
          {p.onFocus && !p.practiceOnly && !p.result.passed && (
            <Button onClick={p.onFocus}>Practice the trouble spot</Button>
          )}
          {p.onRetrySlower && !p.result.passed && (
            <Button variant="ghost" onClick={p.onRetrySlower}>
              Practice slower
            </Button>
          )}
          {p.result.passed && !p.practiceOnly && (
            <Button variant="primary" onClick={p.onContinue}>
              Continue
            </Button>
          )}
          {!p.result.passed && p.failCount >= 3 && p.allowSkip && (
            <Button variant="ghost" onClick={p.onSkip} title="This skill gets extra review later">
              Mark for extra review & move on
            </Button>
          )}
          {!p.result.passed && p.onPlacementStop && (
            <Button variant="primary" onClick={p.onPlacementStop}>
              Start my path here
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
