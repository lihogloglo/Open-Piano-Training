import { useCallback, useEffect, useRef, useState } from 'react';
import type { Take } from '@/engine/replay';
import { Keyboard } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { StarRating } from '@/ui/StarRating';
import { playNote, stopNote } from '@/audio/sampler';
import styles from './ProgressScreen.module.css';

/** Wall-clock length of a take, from its last recorded event. */
export function takeDurationMs(take: Take): number {
  return take.events.length === 0 ? 0 : (take.events[take.events.length - 1]?.[0] ?? 0) + 400;
}

/**
 * Plays a recorded take back on the keyboard — ghost keys light in the
 * learner's own timing, with the sampler echoing what they actually played.
 */
export function ReplayPlayer({
  take,
  title,
  compact = false,
}: {
  take: Take;
  title: string;
  compact?: boolean;
}) {
  const [ghost, setGhost] = useState<ReadonlySet<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sounding = useRef<Set<number>>(new Set());

  const stop = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    for (const midi of sounding.current) stopNote(midi);
    sounding.current.clear();
    setGhost(new Set());
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    stop();
    if (take.events.length === 0) return;
    setPlaying(true);
    const live = new Set<number>();
    for (const [dt, midi, on] of take.events) {
      timers.current.push(
        setTimeout(() => {
          if (on === 1) {
            live.add(midi);
            sounding.current.add(midi);
            playNote(midi);
          } else {
            live.delete(midi);
            sounding.current.delete(midi);
            stopNote(midi);
          }
          setGhost(new Set(live));
        }, dt),
      );
    }
    timers.current.push(setTimeout(stop, takeDurationMs(take)));
  }, [take, stop]);

  useEffect(() => stop, [stop]);

  const date = new Date(take.startedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={styles['replay']}>
      <div className={styles['replayHead']}>
        <div>
          <p className={styles['replayTitle']}>{title}</p>
          <p className={styles['muted']}>{date}</p>
        </div>
        <StarRating stars={take.result.stars} size={18} />
      </div>
      <Keyboard range={[48, 84]} pressed={new Set()} ghost={ghost} height={compact ? 96 : 130} />
      <div className={styles['replayActions']}>
        <Button variant={playing ? 'ghost' : 'secondary'} onClick={playing ? stop : play}>
          {playing ? 'Stop' : 'Play'}
        </Button>
        <span className={styles['muted']}>
          {Math.round(take.result.score * 100)}%{take.bpm !== null ? ` · ${take.bpm} BPM` : ''}
        </span>
      </div>
    </div>
  );
}
