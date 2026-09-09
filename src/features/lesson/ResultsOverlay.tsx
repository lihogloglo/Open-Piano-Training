import { tr } from '@/i18n';
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
                ? tr('Practice complete')
                : p.result.passed
                  ? tr('Passed!')
                  : tr('Let’s focus the next try')}
            </h3>
            <p className={styles['split']}>
              {tr('Notes ')}
              {Math.round(p.result.pitchAccuracy * 100)}%
              {p.isTempo && (
                <>
                  {tr(' · Timing ')}
                  {Math.round(p.result.timingAccuracy * 100)}%
                </>
              )}
            </p>
          </div>
        </div>
        <p>{diagnose(p.result, p.instance)}</p>
        {p.result.firstAnswerAccuracy !== undefined && (
          <p>
            {tr('First answers: ')}
            {Math.round(p.result.firstAnswerAccuracy * 100)}%
          </p>
        )}
        {p.practiceOnly && <p>{tr('Try the full exercise at the target tempo to complete this step.')}</p>}
        <div className={styles['strip']} aria-label={tr('Per-note results')}>
          {strip.map((v, i) => (
            <span
              key={i}
              className={styles['dot']}
              style={{ background: VERDICT_COLOR[v] }}
              title={tr('{v0}: {v1}', { v0: i + 1, v1: v })}
            />
          ))}
        </div>
        <div className={styles['actions']}>
          <Button onClick={p.onRetry}>{tr('Try again')}</Button>
          {p.onFocus && !p.practiceOnly && !p.result.passed && (
            <Button onClick={p.onFocus}>{tr('Practice the trouble spot')}</Button>
          )}
          {p.onRetrySlower && !p.result.passed && (
            <Button variant="ghost" onClick={p.onRetrySlower}>
              {tr('Practice slower')}
            </Button>
          )}
          {p.result.passed && !p.practiceOnly && (
            <Button variant="primary" onClick={p.onContinue}>
              {tr('Continue')}
            </Button>
          )}
          {!p.result.passed && p.allowSkip && (
            <Button variant="ghost" onClick={p.onSkip} title={tr('This skill gets extra review later')}>
              {tr('Mark for extra review & move on')}
            </Button>
          )}
          {!p.result.passed && p.onPlacementStop && (
            <Button variant="primary" onClick={p.onPlacementStop}>
              {tr('Start my path here')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
