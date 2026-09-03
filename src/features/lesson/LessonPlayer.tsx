import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { getUnit } from '@/curriculum/content';
import type { LessonStep, Unit } from '@/curriculum/schema';
import type { ExerciseDef, ExerciseInstance } from '@/engine/types';
import { generate } from '@/engine/generators';
import { resolveSeed } from '@/engine/rng';
import { subscribeMidiEvents, useMidiStore } from '@/store/midiStore';
import { TakeRecorder } from '@/engine/replay';
import { useRunStore } from '@/store/runStore';
import { markUnitInProgress, saveTake } from '@/progress/db';
import { addPracticeMinutes, completeUnit, markBlockComplete } from '@/progress/service';
import { localDateString } from '@/progress/sessionBuilder';
import { Keyboard } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { TransportBar } from '@/ui/TransportBar';
import { StaffSnippet } from '@/ui/StaffSnippet';
import { PlayerNotices } from '@/ui/PlayerNotices';
import { startBacking, type BackingHandle } from '@/audio/backing';
import type { KeyContext } from '@/theory/keys';
import { snippetNotes } from '@/engine/generators/readSnippet';
import { toast } from '@/ui/Toast';
import { playNote, stopNote } from '@/audio/sampler';
import { ExplainBlockView } from './blocks';
import { ResultsOverlay } from './ResultsOverlay';
import styles from './LessonPlayer.module.css';

const STEP_CHIP: Record<LessonStep['kind'], string> = {
  explain: 'Learn',
  guided: 'Try it',
  ladder: 'Bring it to tempo',
  graded: 'Show it',
  create: 'Make something',
};

export function LessonPlayer() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const unit = unitId ? getUnit(unitId) : undefined;

  useEffect(() => {
    if (!unit) void navigate('/path', { replace: true });
  }, [unit, navigate]);

  if (!unit) return null;
  return <LessonPlayerInner unit={unit} />;
}

/** Onboarding placement: checkpoints taken back-to-back until one fails (05 §Welcome). */
const PLACEMENT_CHAIN = ['s0.cp', 's1.cp', 's2.cp'];

/** Passing this finishes the path (06 s7.cp → epilogue). */
const FINAL_CHECKPOINT = 's7.cp';

/**
 * Keyboard tint for an improv palette: the notes the learner is invited to
 * use. Blues and chord-tone palettes have no clean diatonic subset, so they
 * tint the whole key rather than lying about which notes are "in".
 */
function improvTint(
  params: { key?: KeyContext; palette?: string; tintDegrees?: number[] } | undefined,
): { tonic: string; degrees?: readonly number[] } | null {
  if (!params?.key) return null;
  // An authored `tintDegrees` wins: a create step that says "only C and F"
  // should light C and F, not the whole key. (Ignored by the generator's
  // schema, which strips it — it is a presentation hint, not exercise data.)
  const degrees = params.tintDegrees?.length
    ? params.tintDegrees
    : params.palette === 'degrees123'
      ? [1, 2, 3]
      : params.palette === 'pentatonic'
        ? [1, 2, 3, 5, 6]
        : null;
  return degrees ? { tonic: params.key.tonic, degrees } : { tonic: params.key.tonic };
}

function LessonPlayerInner({ unit }: { unit: Unit }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const sessionBlock = searchParams.get('block');
  const placement = searchParams.get('placement') !== null && unit.kind === 'checkpoint';
  const [stepIdx, setStepIdx] = useState(0);
  const gradedScores = useRef<number[]>([]);
  const flaggedRef = useRef(false);
  const [exitArmed, setExitArmed] = useState(false);
  const abortRun = useRunStore((s) => s.abortRun);
  const phase = useRunStore((s) => s.phase);

  useEffect(() => {
    void markUnitInProgress(unit.id);
    return () => abortRun();
  }, [unit.id, abortRun]);

  const step = unit.steps[stepIdx];

  const finishUnit = useCallback(async () => {
    const scores = gradedScores.current;
    const score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
    await completeUnit(unit, score, flaggedRef.current);
    await addPracticeMinutes(localDateString(new Date()), unit.minutes);
    if (placement) {
      const next = PLACEMENT_CHAIN[PLACEMENT_CHAIN.indexOf(unit.id) + 1];
      if (next) {
        toast(`${unit.title} passed! Next checkpoint…`, 'ok');
        void navigate(`/lesson/${next}?placement=1`);
        return;
      }
      toast('Placement complete. The path opens well ahead!', 'ok');
      void navigate('/path');
      return;
    }
    // The final checkpoint ends the path; the epilogue does the celebrating.
    if (unit.id === FINAL_CHECKPOINT) {
      void navigate('/epilogue');
      return;
    }
    toast(`${unit.title} complete!`, 'ok');
    if (sessionId && sessionBlock !== null) {
      // Minutes already counted above; the block just gets ticked off.
      await markBlockComplete(sessionId, Number(sessionBlock), 0);
      void navigate('/practice');
      return;
    }
    void navigate('/path');
  }, [unit, placement, sessionId, sessionBlock, navigate]);

  const advance = useCallback(() => {
    if (stepIdx + 1 >= unit.steps.length) {
      void finishUnit();
    } else {
      setStepIdx((i) => i + 1);
    }
  }, [stepIdx, unit.steps.length, finishUnit]);

  const requestExit = useCallback(() => {
    const running = useRunStore.getState().phase !== 'idle' && useRunStore.getState().phase !== 'done';
    if (running && !exitArmed) {
      setExitArmed(true);
      toast('Mid-exercise. Press Esc again to leave');
      setTimeout(() => setExitArmed(false), 3000);
      return;
    }
    abortRun();
    void navigate('/path');
  }, [exitArmed, abortRun, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestExit]);

  if (!step) return null;

  return (
    <div className={styles['player']}>
      <header className={styles['topbar']}>
        <button className={styles['close']} onClick={requestExit} aria-label="Exit lesson">
          <Icon name="close" />
        </button>
        <span className={styles['unitTitle']}>{unit.title}</span>
        <span className={styles['stepCount']} aria-label={`Step ${stepIdx + 1} of ${unit.steps.length}`}>
          <span className="tabular">
            {stepIdx + 1}/{unit.steps.length}
          </span>
        </span>
        <span className={styles['chip']} data-kind={step.kind}>
          {STEP_CHIP[step.kind]}
        </span>
      </header>
      {/* The step counter says where you are; the rail shows how far that is. */}
      <div className={styles['progress']} aria-hidden>
        <span style={{ width: `${((stepIdx + 1) / unit.steps.length) * 100}%` }} />
      </div>

      {/* Explain steps need the instrument too — their demos play through the
          sampler, and a missing keyboard is better learned early than late. */}
      <PlayerNotices />

      {step.kind === 'explain' && <ExplainStep key={step.id} step={step} onDone={advance} />}
      {step.kind === 'create' && <CreateStep key={step.id} step={step} unitId={unit.id} onDone={advance} />}
      {(step.kind === 'guided' || step.kind === 'ladder' || step.kind === 'graded') && (
        <ExerciseStep
          key={step.id}
          step={step}
          unitId={unit.id}
          allowSkip={unit.kind !== 'checkpoint'}
          placement={placement}
          onDone={(score, flagged) => {
            if (step.kind === 'graded') gradedScores.current.push(score);
            if (flagged) flaggedRef.current = true;
            advance();
          }}
        />
      )}
      {phase === 'idle' && step.kind === 'explain' && null}
    </div>
  );
}

function ExplainStep({
  step,
  onDone,
}: {
  step: Extract<LessonStep, { kind: 'explain' }>;
  onDone: () => void;
}) {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  // Play-checks on one step take turns: a note answers the earliest unsatisfied
  // one, so "play a C" and "now play three Cs" cannot both be solved at once.
  const [satisfied, setSatisfied] = useState<ReadonlySet<number>>(new Set());
  const markSatisfied = useCallback((i: number) => {
    setSatisfied((prev) => (prev.has(i) ? prev : new Set([...prev, i])));
  }, []);
  const pendingCheck = step.blocks.findIndex((b, i) => b.kind === 'playCheck' && !satisfied.has(i));

  // The listening check borrows this keyboard, so a learner with no MIDI device
  // answers by clicking the same keys everyone else plays.
  const offerRef = useRef<((midi: number) => void) | null>(null);
  const registerOffer = useCallback((handler: ((midi: number) => void) | null) => {
    offerRef.current = handler;
  }, []);

  return (
    <>
      <div className={styles['promptZone']}>
        <div className={styles['blocks']}>
          {step.blocks.map((b, i) => (
            <ExplainBlockView
              key={i}
              block={b}
              active={pendingCheck === -1 || i <= pendingCheck}
              onSatisfied={() => markSatisfied(i)}
              registerOffer={registerOffer}
            />
          ))}
        </div>
      </div>
      <Keyboard
        range={[48, 84]}
        pressed={activeNotes}
        height={150}
        onKeyDown={(m) => {
          playNote(m);
          offerRef.current?.(m);
        }}
        onKeyUp={(m) => stopNote(m)}
      />
      <div className={styles['footer']}>
        <Button variant="primary" size="l" onClick={onDone}>
          Continue
        </Button>
      </div>
    </>
  );
}

/** Nominal result for unscored create takes — saved to replays, never graded. */
const CREATE_RESULT = {
  pitchAccuracy: 1,
  timingAccuracy: 1,
  score: 1,
  stars: 0 as const,
  judgments: [],
  passed: true,
};

function CreateStep({
  step,
  unitId,
  onDone,
}: {
  step: Extract<LessonStep, { kind: 'create' }>;
  unitId: string;
  onDone: () => void;
}) {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const recorder = useRef<TakeRecorder | null>(null);
  const backing = useRef<BackingHandle | null>(null);
  const [backingOn, setBackingOn] = useState(false);
  const [barIdx, setBarIdx] = useState(-1);

  // Everything played during the step is captured for the replay shelf.
  useEffect(() => {
    recorder.current = new TakeRecorder(performance.now());
    return subscribeMidiEvents((e) => {
      if (e.kind === 'pedal') return;
      recorder.current?.record(e.kind, e.midi, e.velocity, e.tPerf);
    });
  }, [step.id]);

  // A create step carrying an improv exercise gets a looping backing track.
  const improv = step.exercise?.generator === 'improv' ? step.exercise : null;
  const improvParams = improv?.params as
    | { key?: KeyContext; roman?: string[]; beatsPerChord?: number; palette?: string; tintDegrees?: number[] }
    | undefined;

  const stopBacking = useCallback(() => {
    backing.current?.stop();
    backing.current = null;
    setBackingOn(false);
    setBarIdx(-1);
  }, []);

  useEffect(() => stopBacking, [stopBacking]);

  const toggleBacking = (): void => {
    if (backingOn) {
      stopBacking();
      return;
    }
    if (!improvParams?.key) return;
    setBackingOn(true);
    void startBacking({
      key: improvParams.key,
      romans: improvParams.roman?.length ? improvParams.roman : ['I'],
      bpm: improv?.bpm ?? 84,
      beatsPerChord: improvParams.beatsPerChord ?? 4,
      pattern: 'block',
      onBar: setBarIdx,
    }).then((handle) => {
      backing.current = handle;
    });
  };

  const finish = () => {
    stopBacking();
    const rec = recorder.current;
    if (rec) {
      const def: ExerciseDef = {
        generator: 'improv-sandbox',
        params: { prompt: step.prompt },
        mode: 'wait',
        rung: 'by-ear',
        hand: 'both',
        seedPolicy: 'random',
      };
      const take = rec.finalize(def, 0, CREATE_RESULT, { unitId });
      if (take.events.length > 0) void saveTake(take);
    }
    onDone();
  };

  return (
    <>
      <div className={styles['promptZone']}>
        <div className={styles['createPrompt']}>
          <h2>Make something</h2>
          <p>{step.prompt}</p>
          <p className={styles['hintText']}>There's no score here. Just play. Your take lands in Replays.</p>
          {improvParams?.key && (
            <>
              <Button variant={backingOn ? 'primary' : 'secondary'} onClick={toggleBacking}>
                <Icon name={backingOn ? 'stop' : 'play'} size={16} />
                {backingOn ? 'Stop backing' : 'Play backing'}
              </Button>
              {backingOn && barIdx >= 0 && improvParams.roman && improvParams.roman.length > 0 && (
                <p className={styles['hintText']} aria-live="off">
                  {improvParams.roman[barIdx % improvParams.roman.length]}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <Keyboard
        range={[48, 84]}
        pressed={activeNotes}
        height={190}
        degreeTint={improvTint(improvParams)}
        onKeyDown={(m) => playNote(m)}
        onKeyUp={(m) => stopNote(m)}
      />
      <div className={styles['footer']}>
        <Button variant="primary" size="l" onClick={finish}>
          Done
        </Button>
      </div>
    </>
  );
}

interface ExerciseStepProps {
  step: Extract<LessonStep, { kind: 'guided' | 'ladder' | 'graded' }>;
  unitId: string;
  allowSkip: boolean;
  placement?: boolean;
  onDone: (score: number, flagged?: boolean) => void;
}

function ExerciseStep({ step, unitId, allowSkip, placement, onDone }: ExerciseStepProps) {
  const navigate = useNavigate();
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const phase = useRunStore((s) => s.phase);
  const targets = useRunStore((s) => s.targets);
  const judgments = useRunStore((s) => s.judgments);
  const fingerMap = useRunStore((s) => s.fingerMap);
  const targetIndex = useRunStore((s) => s.targetIndex);
  const beatIndex = useRunStore((s) => s.beatIndex);
  const bpmLive = useRunStore((s) => s.bpm);
  const result = useRunStore((s) => s.result);
  const listening = useRunStore((s) => s.listening);
  const startRun = useRunStore((s) => s.startRun);
  const abortRun = useRunStore((s) => s.abortRun);

  const isLadder = step.kind === 'ladder';
  const tempos = useMemo(() => (step.kind === 'ladder' ? step.tempos : [1]), [step]);
  const [pip, setPip] = useState(0);
  const [lit, setLit] = useState<boolean[]>(() => tempos.map(() => false));
  const [failCount, setFailCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [instance, setInstance] = useState<ExerciseInstance | null>(null);
  const handledDone = useRef(false);
  const autoAdvance = useRef<ReturnType<typeof setTimeout>>(undefined);

  const defFor = useCallback(
    (pipIdx: number, slow = false): ExerciseDef => {
      const base = step.exercise;
      const factor = (tempos[pipIdx] ?? 1) * (slow ? 0.75 : 1);
      if (base.mode === 'tempo') {
        return { ...base, bpm: Math.round((base.bpm ?? 80) * factor) };
      }
      return base;
    },
    [step.exercise, tempos],
  );

  const start = useCallback(
    (pipIdx = pip, slow = false) => {
      clearTimeout(autoAdvance.current);
      handledDone.current = false;
      setShowResults(false);
      const def = defFor(pipIdx, slow);
      const inst = generate(def, resolveSeed(def.seedPolicy));
      setInstance(inst);
      void startRun(inst);
    },
    [pip, defFor, startRun],
  );

  // Guided steps begin immediately (deferred a tick — effects must not set state
  // synchronously); tempo steps wait for an explicit Start.
  useEffect(() => {
    const t = step.kind === 'guided' ? setTimeout(() => start(0), 0) : undefined;
    return () => {
      clearTimeout(t);
      clearTimeout(autoAdvance.current);
      abortRun();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  // React to run completion via a store subscription (external system → React).
  useEffect(() => {
    return useRunStore.subscribe((s, prev) => {
      if (s.phase !== 'done' || prev.phase === 'done' || !s.result || handledDone.current) return;
      handledDone.current = true;
      const runResult = s.result;
      if (s.lastTake) void saveTake({ ...s.lastTake, unitId });

      if (step.kind === 'guided') {
        clearTimeout(autoAdvance.current);
        autoAdvance.current = setTimeout(() => onDone(runResult.score), 900);
        return;
      }
      if (step.kind === 'ladder') {
        if (runResult.score >= 0.8) {
          setLit((prevLit) => {
            const next = [...prevLit];
            next[pip] = true;
            return next;
          });
          if (pip + 1 < tempos.length) {
            setPip(pip + 1);
            toast(`Clean at ${Math.round((tempos[pip] ?? 1) * 100)}%, next tempo!`, 'ok');
          } else {
            toast('Full tempo, nailed it', 'ok');
          }
        } else {
          toast('Almost. Same tempo again', 'info');
        }
        return;
      }
      // graded
      if (!runResult.passed) setFailCount((f) => f + 1);
      setShowResults(true);
    });
  }, [step.kind, unitId, pip, tempos, onDone]);

  const allLit = lit.every(Boolean);
  const prompt = instance?.prompt;
  const perTarget = prompt?.perTarget?.[targetIndex];
  const isTempo = step.exercise.mode === 'tempo';
  const currentBpm = bpmLive ?? (isTempo ? Math.round((step.exercise.bpm ?? 80) * (tempos[pip] ?? 1)) : null);

  return (
    <>
      <div className={styles['promptZone']}>
        <div className={styles['exercisePrompt']}>
          <p className={styles['promptDetail']}>{prompt?.title ?? '…'}</p>
          {instance?.def.generator === 'read-snippet' && prompt?.key ? (
            // Notation reading: the staff IS the prompt.
            <StaffSnippet
              midis={snippetNotes(instance)}
              keyContext={prompt.key}
              clef={instance.def.params['clef'] === 'bass' ? 'bass' : 'treble'}
              highlightIndex={targetIndex}
            />
          ) : (
            <h2 className={styles['promptMain']}>
              {listening ? 'Listen…' : (perTarget?.label ?? prompt?.detail ?? '')}
            </h2>
          )}
          {instance && (
            <p className={styles['targetCount']}>
              <span className="tabular">
                {Math.min(targetIndex + 1, instance.targets.length)} / {instance.targets.length}
              </span>
            </p>
          )}
        </div>
        {showResults && result && instance && (
          <ResultsOverlay
            result={result}
            targetCount={instance.targets.length}
            isTempo={isTempo}
            failCount={failCount}
            allowSkip={allowSkip}
            onRetry={() => start()}
            onRetrySlower={isTempo ? () => start(pip, true) : undefined}
            onContinue={() => onDone(result.score)}
            onSkip={() => onDone(result.score, true)}
            onPlacementStop={
              placement
                ? () => {
                    abortRun();
                    toast('Good place to start. The path is yours from here', 'ok');
                    void navigate('/path');
                  }
                : undefined
            }
          />
        )}
      </div>
      <Keyboard
        range={[48, 84]}
        pressed={activeNotes}
        targets={targets}
        judgments={judgments}
        fingerMap={fingerMap}
        labels={fingerMap.size > 0 ? 'fingers' : 'none'}
        height={190}
        onKeyDown={(m) => playNote(m)}
        onKeyUp={(m) => stopNote(m)}
      />
      <TransportBar
        phase={phase}
        bpm={currentBpm}
        beatIndex={beatIndex}
        // Guided steps auto-start and auto-advance; a manual restart mid-advance
        // would race the pending step change.
        canStart={step.kind !== 'guided'}
        onStart={() => start()}
        {...(isLadder
          ? {
              pips: {
                tempos,
                lit,
                current: pip,
                onSelect: (i: number) => {
                  setPip(i);
                  start(i);
                },
              },
            }
          : {})}
      />
      {isLadder && allLit && (
        <div className={styles['footer']}>
          <Button variant="primary" size="l" onClick={() => onDone(1)}>
            Continue
          </Button>
        </div>
      )}
    </>
  );
}
