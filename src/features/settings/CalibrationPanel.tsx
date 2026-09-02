import { useEffect, useRef, useState } from 'react';
import { startMetronome, stopMetronome, onBeat } from '@/audio/metronome';
import { unlockAudio } from '@/audio/clock';
import { calibrationOffset } from '@/engine/matcher/timing';
import { subscribeMidiEvents } from '@/store/midiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/ui/Button';
import { toast } from '@/ui/Toast';
import styles from './CalibrationPanel.module.css';

const CLICKS = 8;

export function CalibrationPanel() {
  const latency = useSettingsStore((s) => s.latencyOffsetMs);
  const setLatency = useSettingsStore((s) => s.setLatencyOffsetMs);
  const [running, setRunning] = useState(false);
  const [hits, setHits] = useState(0);
  const cleanup = useRef<(() => void)[]>([]);

  const stop = () => {
    stopMetronome();
    for (const fn of cleanup.current) fn();
    cleanup.current = [];
    setRunning(false);
  };

  useEffect(() => stop, []);

  const start = async () => {
    await unlockAudio();
    setHits(0);
    setRunning(true);
    const beatTimes: number[] = [];
    const deltas: number[] = [];
    let beats = 0;

    const unBeat = onBeat((b) => {
      beatTimes.push(b.tPerf);
      beats += 1;
      if (beats >= CLICKS) {
        setTimeout(() => {
          stop();
          if (deltas.length < 4) {
            toast('Not enough presses — try again and hit every click', 'warn');
            return;
          }
          const offset = calibrationOffset(deltas);
          setLatency(offset);
          toast(`Calibrated: ${offset >= 0 ? '+' : ''}${offset}ms`, 'ok');
        }, 400);
      }
    });
    const unMidi = subscribeMidiEvents((e) => {
      if (e.kind !== 'noteon' || beatTimes.length === 0) return;
      const nearest = beatTimes.reduce((best, t) =>
        Math.abs(e.tPerf - t) < Math.abs(e.tPerf - best) ? t : best,
      );
      const delta = e.tPerf - nearest;
      if (Math.abs(delta) < 250) {
        deltas.push(delta);
        setHits((h) => h + 1);
      }
    });
    cleanup.current = [unBeat, unMidi];
    startMetronome({ bpm: 90, countInBars: 0, volume: 0.6 });
  };

  return (
    <div className={styles['panel']}>
      <p className={styles['note']}>
        Play any key exactly on each click ({CLICKS} clicks at 90 BPM). We measure your setup's delay and
        subtract it from every timing judgment. Current offset:{' '}
        <strong className="tabular">
          {latency >= 0 ? '+' : ''}
          {latency}ms
        </strong>
      </p>
      <div className={styles['row']}>
        {running ? (
          <>
            <span className={styles['live']}>
              Listening… <span className="tabular">{hits}</span>/{CLICKS}
            </span>
            <Button onClick={stop}>Cancel</Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={() => void start()}>
              Calibrate timing
            </Button>
            {latency !== 0 && (
              <Button variant="ghost" onClick={() => setLatency(0)}>
                Reset to 0
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
