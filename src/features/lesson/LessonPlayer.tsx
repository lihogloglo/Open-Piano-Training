import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { getUnit } from '@/curriculum/content';
import type { LessonStep, Unit } from '@/curriculum/schema';
import type { ExerciseDef, ExerciseInstance } from '@/engine/types';
import { generate } from '@/engine/generators';
import { resolveSeed } from '@/engine/rng';
import { useMidiStore } from '@/store/midiStore';
import { useRunStore } from '@/store/runStore';
import { markUnitInProgress, saveTake } from '@/progress/db';
import { addPracticeMinutes, completeUnit, markBlockComplete } from '@/progress/service';
import { localDateString } from '@/progress/sessionBuilder';
import { Keyboard } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { TransportBar } from '@/ui/TransportBar';
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

function LessonPlayerInner({ unit }: { unit: Unit }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const sessionBlock = searchParams.get('block');
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
    toast(`${unit.title} — complete!`, 'ok');
    if (sessionId && sessionBlock !== null) {
      // Minutes already counted above; the block just gets ticked off.
      await markBlockComplete(sessionId, Number(sessionBlock), 0);
      void navigate('/practice');
      return;
    }
    void navigate('/path');
  }, [unit, sessionId, sessionBlock, navigate]);

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
      toast('Mid-exercise — press ✕ or Esc again to leave');
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

      {step.kind === 'explain' && <ExplainStep key={step.id} step={step} onDone={advance} />}
      {step.kind === 'create' && <CreateStep key={step.id} step={step} onDone={advance} />}
      {(step.kind === 'guided' || step.kind === 'ladder' || step.kind === 'graded') && (
        <ExerciseStep
          key={step.id}
          step={step}
          unitId={unit.id}
          allowSkip={unit.kind !== 'checkpoint'}
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
  return (
    <>
      <div className={styles['promptZone']}>
        <div className={styles['blocks']}>
          {step.blocks.map((b, i) => (
            <ExplainBlockView key={i} block={b} />
          ))}
        </div>
      </div>
      <Keyboard
        range={[48, 84]}
        pressed={activeNotes}
        height={150}
        onKeyDown={(m) => playNote(m)}
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

function CreateStep({ step, onDone }: { step: Extract<LessonStep, { kind: 'create' }>; onDone: () => void }) {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  return (
    <>
      <div className={styles['promptZone']}>
        <div className={styles['createPrompt']}>
          <h2>Make something</h2>
          <p>{step.prompt}</p>
          <p className={styles['hintText']}>There's no score here — just play.</p>
        </div>
      </div>
      <Keyboard
        range={[48, 84]}
        pressed={activeNotes}
        height={190}
        onKeyDown={(m) => playNote(m)}
        onKeyUp={(m) => stopNote(m)}
      />
      <div className={styles['footer']}>
        <Button variant="primary" size="l" onClick={onDone}>
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
  onDone: (score: number, flagged?: boolean) => void;
}

function ExerciseStep({ step, unitId, allowSkip, onDone }: ExerciseStepProps) {
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
            toast(`Clean at ${Math.round((tempos[pip] ?? 1) * 100)}% — next tempo!`, 'ok');
          } else {
            toast('Full tempo — nailed it', 'ok');
          }
        } else {
          toast('Almost — same tempo again', 'info');
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
          <h2 className={styles['promptMain']}>
            {listening ? '🔊 Listen…' : (perTarget?.label ?? prompt?.detail ?? '')}
          </h2>
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
