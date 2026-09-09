import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { MUSIC_STUDIES, type MusicStudy, type PlayedNote } from '@/curriculum/content/musicianship';
import { generate } from '@/engine/generators';
import { diagnose } from '@/engine/diagnosis';
import type { ExerciseDef } from '@/engine/types';
import { useMidiStore, inputNoteOn, inputNoteOff } from '@/store/midiStore';
import { useRunStore } from '@/store/runStore';
import { getSamplerStatus, ensureSamplerLoaded, playNote, stopNote } from '@/audio/sampler';
import { unlockAudio } from '@/audio/clock';
import { isTourist } from '@/progress/tourist';
import { db, saveTake } from '@/progress/db';
import { Keyboard } from '@/ui/Keyboard';
import { exerciseRange } from '@/ui/Keyboard/utils';
import { toast } from '@/ui/Toast';
import { MovementGuide } from './MovementGuide';
import { Button } from '@/ui/Button';
import { PlayerNotices } from '@/ui/PlayerNotices';
import { TransportBar } from '@/ui/TransportBar';
import styles from './StudioScreen.module.css';

export function StudioScreen() {
  const { studyId } = useParams();
  const study = MUSIC_STUDIES.find((s) => s.id === studyId);
  if (study) return <StudyPlayer key={study.id} study={study} />;
  return (
    <main className={styles['catalog']}>
      <Link to="/path">Back to the path</Link>
      <h1>At the piano</h1>
      <p>Build rhythm, comfortable movement, and complete musical performances alongside the harmony path.</p>
      <div className={styles['cards']}>
        {MUSIC_STUDIES.map((s) => (
          <Link className={styles['card']} key={s.id} to={`/studio/${s.id}`}>
            <small>
              {s.kind === 'piece' ? 'Complete piece' : 'Practical lesson'} · Suggested from Stage {s.stage}
            </small>
            <h2>{s.title}</h2>
            <p>{s.selfChecks[0]}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

function StudyPlayer({ study }: { study: MusicStudy }) {
  const [tempo, setTempo] = useState(study.bpm);
  const [arrangement, setArrangement] = useState('melody');
  const [hand, setHand] = useState<'rh' | 'lh' | 'both'>('both');
  const [phrase, setPhrase] = useState(-1);
  const [example, setExample] = useState(0);
  const [reveal, setReveal] = useState(!study.ear);
  const [heard, setHeard] = useState(false);
  const [playingDemo, setPlayingDemo] = useState(false);
  const [ghost, setGhost] = useState<ReadonlySet<number>>(new Set());
  const [checked, setChecked] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoNotes = useRef<number[]>([]);
  const demoGeneration = useRef(0);
  const takeSaved = useRef('');
  const run = useRunStore();
  const pressed = useMidiStore((s) => s.activeNotes);
  const pedal = useMidiStore((s) => s.pedalDown);
  const offset = study.transpose[example % study.transpose.length] ?? 0;
  const notes = useMemo(() => {
    const accompaniment = arrangement === 'chords' ? study.chords : arrangement === 'bass' ? study.bass : [];
    const start = phrase < 0 ? 0 : phrase * study.beatsPerBar;
    const end = phrase < 0 ? Infinity : start + 2 * study.beatsPerBar;
    return [...(study.examples[example % study.examples.length] ?? study.notes), ...accompaniment]
      .filter((n) => (hand === 'both' || hand === n.hand) && n.atBeat >= start && n.atBeat < end)
      .map((n) => ({ ...n, midi: n.midi + offset, atBeat: n.atBeat - start }))
      .sort((a, b) => a.atBeat - b.atBeat);
  }, [study, arrangement, phrase, hand, offset, example]);
  const stopDemo = () => {
    demoGeneration.current += 1;
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
    for (const midi of demoNotes.current) stopNote(midi);
    demoNotes.current = [];
  };
  useEffect(
    () => () => {
      stopDemo();
      useRunStore.getState().abortRun();
    },
    [],
  );
  useEffect(
    () =>
      useRunStore.subscribe((s, previous) => {
        if (
          s.phase === 'done' &&
          previous.phase !== 'done' &&
          s.lastTake &&
          takeSaved.current !== s.lastTake.id
        ) {
          takeSaved.current = s.lastTake.id;
          void saveTake(s.lastTake);
        }
      }),
    [],
  );

  const def = (assessment: boolean): ExerciseDef => ({
    generator: 'phrase',
    params: {
      title: study.title,
      studyId: study.id,
      notes,
      beatsPerBar: study.beatsPerBar,
      ear: study.ear && !reveal,
      arrangement,
      phrase,
      offset,
    },
    mode: 'tempo',
    bpm: tempo,
    timingTier: 'relaxed',
    hand,
    rung: assessment ? 'by-ear' : 'keys-lit',
    seedPolicy: 'fixed',
    assessment,
  });
  const instance = notes.length ? generate(def(false), example) : null;
  const demo = async () => {
    run.abortRun();
    stopDemo();
    setPlayingDemo(true);
    setHeard(false);
    const generation = demoGeneration.current;
    await unlockAudio();
    await ensureSamplerLoaded();
    if (generation !== demoGeneration.current) return;
    if (getSamplerStatus().state !== 'ready') {
      setPlayingDemo(false);
      toast('The piano sound is not ready. Retry audio, then hear the phrase.', 'info');
      return;
    }
    demoNotes.current = notes.map((n) => n.midi);
    const beatMs = 60_000 / tempo;
    for (const n of notes) {
      timers.current.push(
        setTimeout(
          () => {
            playNote(n.midi, n.velocity);
            setGhost((g) => new Set([...g, n.midi]));
          },
          200 + n.atBeat * beatMs,
        ),
      );
      timers.current.push(
        setTimeout(
          () => {
            stopNote(n.midi);
            setGhost((g) => new Set([...g].filter((m) => m !== n.midi)));
          },
          200 + (n.atBeat + n.durBeats) * beatMs,
        ),
      );
    }
    const end = Math.max(0, ...notes.map((n) => n.atBeat + n.durBeats)) * beatMs + 300;
    timers.current.push(
      setTimeout(() => {
        setPlayingDemo(false);
        setHeard(true);
        setGhost(new Set());
      }, end),
    );
  };
  const start = (assessment: boolean) => {
    stopDemo();
    setPlayingDemo(false);
    setGhost(new Set());
    if (instance) void run.startRun(generate(def(assessment), example));
  };
  const reset = () => {
    run.abortRun();
    setHeard(false);
    setSaved(false);
  };
  const busy = playingDemo || run.phase === 'preview' || run.phase === 'running' || run.phase === 'count-in';
  const activeTarget = run.instance?.prompt.perTarget?.[run.targetIndex];
  return (
    <main className={styles['player']}>
      <header className={styles['header']}>
        <Link to="/studio">All practical lessons</Link>
        <h1>{study.title}</h1>
        <span>Pedal {pedal ? 'down' : 'up'}</span>
      </header>
      <PlayerNotices />
      <section className={styles['content']}>
        {activeTarget && busy && (
          <p className={styles['prompt']}>
            {run.listening ? 'Listen…' : activeTarget.label} · {activeTarget.detail}
          </p>
        )}
        {run.result && (
          <div role="status">
            <strong>
              {Math.round(run.result.score * 100)}% ·{' '}
              {run.instance?.def.assessment ? 'Performance' : 'Practice'} at {run.bpm} BPM
            </strong>
            <p>{diagnose(run.result, run.instance)}</p>
            <Button onClick={() => start(false)}>Repeat this phrase</Button>{' '}
            <Button onClick={() => run.abortRun()}>Change phrase or settings</Button>
          </div>
        )}
        {busy && (
          <div className={styles['live']}>
            {playingDemo && <h2>Listen to the phrase</h2>}
            {run.phase === 'count-in' && (
              <p>
                Count {Array.from({ length: study.beatsPerBar }, (_, i) => i + 1).join(', ')}, then begin.
              </p>
            )}
            <Button
              onClick={() => {
                stopDemo();
                setPlayingDemo(false);
                setGhost(new Set());
                run.abortRun();
              }}
            >
              Stop and adjust
            </Button>
          </div>
        )}
        <div hidden={busy || run.phase === 'done'}>
          <details>
            <summary>How to read this practice</summary>
            <p>
              C4 means middle C. The number shows the octave, a group of eight note names from one C to the
              next. R and L mean right and left hand. Finger 1 is the thumb and finger 5 is the little finger.
              A beat is a steady pulse. A bar groups beats: count 1 to {study.beatsPerBar}, then start again.
              A phrase is a short musical sentence. The note cards show when to press and how many beats to
              hold.
            </p>
          </details>
          <p>{study.instruction}</p>
          {study.movementGuide && <MovementGuide />}
          <div className={styles['controls']}>
            <label>
              Tempo{' '}
              <input
                aria-label="Practice tempo"
                type="number"
                min={40}
                max={160}
                value={tempo}
                disabled={busy}
                onChange={(e) => {
                  reset();
                  setTempo(Math.max(40, Math.min(160, Number(e.target.value) || 40)));
                }}
              />{' '}
              BPM
            </label>
            {study.kind === 'piece' && (
              <label>
                Arrangement{' '}
                <select
                  aria-label="Arrangement"
                  value={arrangement}
                  disabled={busy}
                  onChange={(e) => {
                    reset();
                    setArrangement(e.target.value);
                  }}
                >
                  <option value="melody">1. Melody</option>
                  <option value="bass">2. Melody and bass</option>
                  <option value="chords">3. Melody and chords</option>
                </select>
              </label>
            )}
            <label>
              Hands{' '}
              <select
                aria-label="Hands"
                value={hand}
                disabled={busy}
                onChange={(e) => {
                  reset();
                  setHand(e.target.value as typeof hand);
                }}
              >
                <option value="both">Both hands</option>
                <option value="rh">Right hand</option>
                <option value="lh">Left hand</option>
              </select>
            </label>
            <label>
              Phrase{' '}
              <select
                aria-label="Phrase"
                value={phrase}
                disabled={busy}
                onChange={(e) => {
                  reset();
                  setPhrase(Number(e.target.value));
                }}
              >
                <option value={-1}>Whole piece</option>
                {Array.from({ length: Math.ceil(study.bars / 2) }, (_, i) => (
                  <option key={i} value={i * 2}>
                    Bars {i * 2 + 1}–{Math.min(study.bars, i * 2 + 2)}
                  </option>
                ))}
              </select>
            </label>
            {(study.transpose.length > 1 || study.examples.length > 1) && (
              <Button
                disabled={busy}
                onClick={() => {
                  reset();
                  setExample(example + 1);
                  setReveal(false);
                }}
              >
                Another example
              </Button>
            )}
            <Button disabled={busy || !notes.length} onClick={() => void demo()}>
              Hear this phrase
            </Button>
            {study.ear && (
              <Button disabled={busy} onClick={() => setReveal(!reveal)}>
                {reveal ? 'Hide the phrase' : 'Reveal for practice'}
              </Button>
            )}
          </div>
          {(!study.ear || reveal) && !(run.instance?.def.assessment && run.phase !== 'done') && (
            <Phrase notes={notes} meter={study.beatsPerBar} />
          )}
          {notes.length === 0 && (
            <p>This arrangement has no notes for that hand. Choose both hands or add accompaniment.</p>
          )}
        </div>
        <details hidden={busy} className={styles['checks']}>
          <summary>Listen and check your playing</summary>
          {study.selfChecks.map((check) => (
            <label key={check}>
              <input
                type="checkbox"
                checked={checked.includes(check)}
                onChange={(e) =>
                  setChecked(e.target.checked ? [...checked, check] : checked.filter((c) => c !== check))
                }
              />{' '}
              {check}
            </label>
          ))}
          <Button
            disabled={checked.length !== study.selfChecks.length}
            onClick={() => {
              if (isTourist()) {
                toast('Self-check complete. Tourist mode keeps it unsaved.');
                return;
              }
              void db.meta
                .put({ key: `study:${study.id}`, value: { title: study.title, completedAt: Date.now() } })
                .then(() => setSaved(true));
            }}
          >
            Save my self-check
          </Button>
          {saved && (
            <p role="status">
              Completed. Independent and retained performances appear in Progress after assessment.
            </p>
          )}
        </details>
      </section>
      <Keyboard
        range={exerciseRange(instance)}
        height={160}
        pressed={pressed}
        ghost={study.ear && !reveal ? new Set() : ghost}
        targets={run.targets}
        fingerMap={
          playingDemo && (!study.ear || reveal)
            ? new Map(notes.filter((n) => ghost.has(n.midi) && n.finger).map((n) => [n.midi, n.finger!]))
            : run.fingerMap
        }
        labels={run.instance?.def.assessment ? 'none' : 'fingers'}
        onKeyDown={inputNoteOn}
        onKeyUp={inputNoteOff}
      />
      <TransportBar
        phase={run.phase}
        bpm={tempo}
        beatIndex={run.beatIndex}
        beatsPerBar={study.beatsPerBar}
        canStart={!busy && notes.length > 0 && (!study.ear || heard)}
        onStart={() => start(false)}
        startLabel="Practice this phrase"
      />
      <div className={styles['performance']}>
        <Button
          disabled={busy || !notes.length || (study.ear && (!heard || reveal))}
          onClick={() => start(true)}
        >
          Perform without hints
        </Button>
        <span>Only note starts are scored. Use the self-checks for touch, releases, balance, and pedal.</span>
      </div>
    </main>
  );
}

function Phrase({ notes, meter }: { notes: PlayedNote[]; meter: number }) {
  return (
    <div className={styles['phrase']} role="region" tabIndex={0} aria-label="Phrase notes and durations">
      {notes.map((n, i) => (
        <span key={i}>
          <strong>
            {n.hand === 'lh' ? 'L' : 'R'} ·{' '}
            {['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][n.midi % 12]}
            {Math.floor(n.midi / 12) - 1}
          </strong>
          <small>
            Bar {Math.floor(n.atBeat / meter) + 1}, beat {(n.atBeat % meter) + 1} ·{' '}
            {Math.round(n.durBeats * 10) / 10} beats{n.finger ? ` · finger ${n.finger}` : ''}
          </small>
        </span>
      ))}
    </div>
  );
}
