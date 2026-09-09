import { tr } from '@/i18n';
import { useRunStore, type RunPhase } from '@/store/runStore';
import { ExerciseSequence } from './ExerciseSequence';
import { Button } from './Button';
import { useSamplerLoading } from './PlayerNotices';
import styles from './TransportBar.module.css';

export interface LadderPips {
  tempos: number[]; // fractions of full tempo
  lit: boolean[];
  current: number;
  onSelect?: (index: number) => void;
}

interface TransportBarProps {
  phase: RunPhase;
  bpm: number | null;
  beatIndex: number | null;
  beatsPerBar?: number;
  canStart: boolean;
  hideStart?: boolean;
  onStart: () => void;
  pips?: LadderPips;
  startLabel?: string;
  showSequence?: boolean;
}

export function TransportBar({
  phase,
  bpm,
  beatIndex,
  beatsPerBar = 4,
  canStart,
  hideStart = false,
  onStart,
  pips,
  startLabel,
  showSequence = true,
}: TransportBarProps) {
  const instance = useRunStore((s) => s.instance);
  const targetIndex = useRunStore((s) => s.targetIndex);
  const preview = phase === 'preview';
  const running = preview || phase === 'running' || phase === 'count-in';
  const abortRun = useRunStore((s) => s.abortRun);
  const label = preview
    ? tr('Stop demonstration')
    : (startLabel ?? (phase === 'done' ? tr('Try again') : running ? tr('Restart') : tr('Start')));
  const beatInBar = beatIndex === null ? null : ((beatIndex % beatsPerBar) + beatsPerBar) % beatsPerBar;
  // Starting before the samples land would run the exercise in silence.
  const loading = useSamplerLoading();

  return (
    <div className={styles['bar']}>
      {preview && showSequence && instance && (
        <ExerciseSequence instance={instance} activeIndex={targetIndex} />
      )}
      {!hideStart && (
        <Button
          variant="primary"
          onClick={preview ? abortRun : onStart}
          disabled={!preview && (!canStart || loading)}
          title={loading ? tr('Waiting for the piano sounds to load') : undefined}
        >
          {loading ? tr('Loading sounds…') : label}
        </Button>
      )}

      {preview && <span role="status">{tr('Watch and listen. Play after the count-in.')}</span>}
      {bpm !== null && (
        <span className={styles['bpm']}>
          <span className="tabular">{bpm}</span>
          {tr(' BPM')}
        </span>
      )}

      {bpm !== null && (
        <span className={styles['beats']} data-countin={phase === 'count-in'} aria-hidden>
          {Array.from({ length: beatsPerBar }, (_, i) => (
            <span key={i} className={styles['beatDot']} data-active={running && beatInBar === i} />
          ))}
          {phase === 'count-in' && <span className={styles['countinLabel']}>{tr('count-in')}</span>}
        </span>
      )}

      {pips && (
        <span className={styles['pips']} aria-label={tr('Tempo ladder')}>
          {pips.tempos.map((t, i) => (
            <button
              key={i}
              className={styles['pip']}
              data-lit={pips.lit[i]}
              data-current={i === pips.current}
              onClick={() => pips.onSelect?.(i)}
              title={tr('{v0}% tempo', { v0: Math.round(t * 100) })}
            >
              {Math.round(t * 100)}%
            </button>
          ))}
        </span>
      )}
    </div>
  );
}
