import type { RunPhase } from '@/store/runStore';
import { Button } from './Button';
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
  onStart: () => void;
  pips?: LadderPips;
  startLabel?: string;
}

export function TransportBar({
  phase,
  bpm,
  beatIndex,
  beatsPerBar = 4,
  canStart,
  onStart,
  pips,
  startLabel,
}: TransportBarProps) {
  const running = phase === 'running' || phase === 'count-in';
  const label = startLabel ?? (phase === 'done' ? 'Try again' : running ? 'Restart' : 'Start');
  const beatInBar = beatIndex === null ? null : ((beatIndex % beatsPerBar) + beatsPerBar) % beatsPerBar;

  return (
    <div className={styles['bar']}>
      <Button variant="primary" onClick={onStart} disabled={!canStart} title="Space">
        {label}
      </Button>

      {bpm !== null && (
        <span className={styles['bpm']}>
          <span className="tabular">{bpm}</span> BPM
        </span>
      )}

      {bpm !== null && (
        <span className={styles['beats']} data-countin={phase === 'count-in'} aria-hidden>
          {Array.from({ length: beatsPerBar }, (_, i) => (
            <span key={i} className={styles['beatDot']} data-active={running && beatInBar === i} />
          ))}
          {phase === 'count-in' && <span className={styles['countinLabel']}>count-in</span>}
        </span>
      )}

      {pips && (
        <span className={styles['pips']} aria-label="Tempo ladder">
          {pips.tempos.map((t, i) => (
            <button
              key={i}
              className={styles['pip']}
              data-lit={pips.lit[i]}
              data-current={i === pips.current}
              onClick={() => pips.onSelect?.(i)}
              title={`${Math.round(t * 100)}% tempo`}
            >
              {Math.round(t * 100)}%
            </button>
          ))}
        </span>
      )}
    </div>
  );
}
