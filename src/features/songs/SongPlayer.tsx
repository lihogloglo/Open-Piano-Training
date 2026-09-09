import { saveTake } from '@/progress/db';
import { exerciseRange } from '@/ui/Keyboard/utils';
import { inputNoteOn, inputNoteOff } from '@/store/midiStore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getSong } from '@/curriculum/content/songs';
import { generate } from '@/engine/generators';
import { resolveSeed } from '@/engine/rng';
import type { ExerciseDef } from '@/engine/types';
import { CIRCLE_OF_FIFTHS } from '@/theory/keys';
import { useMidiStore } from '@/store/midiStore';
import { useRunStore } from '@/store/runStore';
import { Keyboard } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { PlayerNotices } from '@/ui/PlayerNotices';
import { ExerciseSequence } from '@/ui/ExerciseSequence';
import { TransportBar } from '@/ui/TransportBar';
import { toast } from '@/ui/Toast';
import styles from './SongPlayer.module.css';

export function SongPlayer() {
  const { songId } = useParams();
  const navigate = useNavigate();
  const song = songId ? getSong(songId) : undefined;

  useEffect(() => {
    if (!song) void navigate('/songs', { replace: true });
  }, [song, navigate]);

  const activeNotes = useMidiStore((s) => s.activeNotes);
  const phase = useRunStore((s) => s.phase);
  const targets = useRunStore((s) => s.targets);
  const judgments = useRunStore((s) => s.judgments);
  const targetIndex = useRunStore((s) => s.targetIndex);
  const beatIndex = useRunStore((s) => s.beatIndex);
  const liveInstance = useRunStore((s) => s.instance);
  const result = useRunStore((s) => s.result);
  const startRun = useRunStore((s) => s.startRun);
  const abortRun = useRunStore((s) => s.abortRun);

  const [tonic, setTonic] = useState(song?.key.tonic ?? 'C');
  const [tempoPct, setTempoPct] = useState(1);
  const [practiceMode, setPracticeMode] = useState(true);

  useEffect(() => () => abortRun(), [abortRun]);

  useEffect(() => {
    return useRunStore.subscribe((s, prev) => {
      if (s.phase === 'done' && prev.phase !== 'done' && s.result) {
        if (s.lastTake) void saveTake(s.lastTake);
        const pct = Math.round(s.result.score * 100);
        toast(s.result.passed ? `Nice, ${pct}%` : `${pct}%, loop it again`, s.result.passed ? 'ok' : 'info');
      }
    });
  }, []);

  const prepared = useMemo(() => {
    if (!song) return null;
    const def: ExerciseDef = {
      generator: 'chart-play',
      assessment: !practiceMode,
      params: { songId: song.id, ...(tonic !== song.key.tonic ? { transposeTo: tonic } : {}) },
      mode: practiceMode ? 'wait' : 'tempo',
      bpm: Math.round(song.bpm * tempoPct),
      timingTier: 'relaxed',
      rung: 'chord-symbols',
      hand: 'both',
      seedPolicy: 'fixed',
    };
    return generate(def, resolveSeed('fixed'));
  }, [song, tonic, tempoPct, practiceMode]);
  const start = useCallback(() => {
    if (prepared) void startRun(prepared);
  }, [prepared, startRun]);
  const instance = liveInstance ?? prepared;
  const active = phase === 'preview' || phase === 'running' || phase === 'count-in';

  if (!song) return null;
  const perTarget = instance?.prompt.perTarget ?? [];
  const beatsPerBar = song.timeSig[0];

  return (
    <div className={styles['player']}>
      <header className={styles['topbar']}>
        <button
          className={styles['close']}
          onClick={() => void navigate('/songs')}
          aria-label="Back to songs"
        >
          <Icon name="close" />
        </button>
        <span className={styles['title']}>{song.title}</span>
        <span className={styles['style']}>{song.styleRef}</span>
        <div className={styles['controls']}>
          <label>
            Key
            <select
              disabled={active}
              aria-label="Key"
              value={tonic}
              onChange={(e) => {
                abortRun();
                setTonic(e.target.value);
              }}
            >
              {CIRCLE_OF_FIFTHS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            Tempo
            <select
              disabled={active}
              aria-label="Tempo"
              value={tempoPct}
              onChange={(e) => {
                abortRun();
                setTempoPct(Number(e.target.value));
              }}
            >
              <option value={0.75}>75%</option>
              <option value={1}>100%</option>
            </select>
          </label>
          <label>
            Mode
            <select
              disabled={active}
              aria-label="Mode"
              value={practiceMode ? 'practice' : 'intime'}
              onChange={(e) => {
                abortRun();
                setPracticeMode(e.target.value === 'practice');
              }}
            >
              <option value="practice">Practice (waits for you)</option>
              <option value="intime">In time</option>
            </select>
          </label>
        </div>
      </header>

      <PlayerNotices />
      <p>
        Play one chord per bar. Any octave and inversion work. In time mode, watch first, then play after the
        count-in.
      </p>
      <div className={styles['chartZone']}>
        {instance ? (
          <div className={styles['chart']} style={{ gridTemplateColumns: `repeat(${beatsPerBar}, 1fr)` }}>
            {perTarget.map((t, i) => (
              <div
                key={i}
                className={styles['bar']}
                data-state={
                  i === targetIndex && phase !== 'idle' ? 'current' : i < targetIndex ? 'done' : 'todo'
                }
              >
                <span className={styles['symbol']}>{t.label}</span>
                <span className={styles['roman']}>{t.detail}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles['intro']}>
            <p>One chord per bar, any octave or inversion. Pick a key and the chart follows you.</p>
            {result && <p>Last take: {Math.round(result.score * 100)}%</p>}
          </div>
        )}
      </div>

      {instance && phase === 'preview' && <ExerciseSequence instance={instance} activeIndex={targetIndex} />}
      <Keyboard
        range={exerciseRange(instance)}
        pressed={activeNotes}
        targets={targets}
        judgments={judgments}
        height={170}
        onKeyDown={inputNoteOn}
        onKeyUp={inputNoteOff}
      />
      <TransportBar
        showSequence={false}
        phase={phase}
        bpm={practiceMode ? null : Math.round(song.bpm * tempoPct)}
        beatIndex={beatIndex}
        beatsPerBar={beatsPerBar}
        canStart={true}
        onStart={start}
        {...(phase === 'idle' ? { startLabel: 'Play the chart' } : {})}
      />
      {phase === 'done' && (
        <div className={styles['footerHint']}>
          <Button variant="ghost" onClick={() => abortRun()}>
            Change key or tempo
          </Button>
        </div>
      )}
    </div>
  );
}
