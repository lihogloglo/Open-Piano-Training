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
  const order: JudgeVerdict[] = ['missed', 'wrong', 'ok', 'good', 'perfect'];
  const strip: JudgeVerdict[] = Array.from({ length: targetCount }, () => 'missed');
  for (const j of result.judgments) {
    if (j.targetIndex < 0 || j.targetIndex >= targetCount) continue;
    const prev = strip[j.targetIndex] ?? 'missed';
    if (order.indexOf(j.verdict) < order.indexOf(prev) && prev !== 'missed') continue;
    // Keep the best "hit" verdict but never upgrade an actual miss marker set by a hit.
    strip[j.targetIndex] = j.verdict === 'wrong' && prev !== 'missed' ? prev : j.verdict;
  }
  return strip;
}

interface ResultsOverlayProps {
  result: TakeResult;
  targetCount: number;
  isTempo: boolean;
  failCount: number;
  allowSkip: boolean;
  onRetry: () => void;
  onRetrySlower?: (() => void) | undefined;
  onContinue: () => void;
  onSkip: () => void;
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
            <h3>{p.result.passed ? 'Passed!' : 'Not yet — you’re close'}</h3>
            <p className={styles['split']}>
              Notes {Math.round(p.result.pitchAccuracy * 100)}%
              {p.isTempo && <> · Timing {Math.round(p.result.timingAccuracy * 100)}%</>}
            </p>
          </div>
        </div>
        <div className={styles['strip']} aria-label="Per-note results">
          {strip.map((v, i) => (
            <span key={i} className={styles['dot']} style={{ background: VERDICT_COLOR[v] }} title={`${i + 1}: ${v}`} />
          ))}
        </div>
        <div className={styles['actions']}>
          <Button onClick={p.onRetry}>Try again</Button>
          {p.onRetrySlower && !p.result.passed && (
            <Button variant="ghost" onClick={p.onRetrySlower}>
              Practice slower
            </Button>
          )}
          {p.result.passed && (
            <Button variant="primary" onClick={p.onContinue}>
              Continue
            </Button>
          )}
          {!p.result.passed && p.failCount >= 3 && p.allowSkip && (
            <Button variant="ghost" onClick={p.onSkip} title="This skill gets extra review later">
              Mark for extra review & move on
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
