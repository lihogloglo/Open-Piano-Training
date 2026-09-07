import { useLiveQuery } from 'dexie-react-hooks';
import {
  clearResume,
  resumeKey,
  saveResume,
  queueRetest,
  type LessonResume,
  type SavedAssessment,
} from '@/progress/lessonResume';
import { exerciseRange } from '@/ui/Keyboard/utils';
import { inputNoteOn, inputNoteOff } from '@/store/midiStore';
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
import { useSettingsStore } from '@/store/settingsStore';
import { db, markUnitInProgress, saveTake } from '@/progress/db';
import { getSession, completeUnit, markBlockComplete } from '@/progress/service';
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
import { ExplainBlockView, renderMd } from './blocks';
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
  const resume = useLiveQuery(
    async () =>
      unitId ? (((await db.meta.get(resumeKey(unitId)))?.value as LessonResume | undefined) ?? null) : null,
    [unitId],
  );

  useEffect(() => {
    if (!unit) void navigate('/path', { replace: true });
  }, [unit, navigate]);

  if (!unit || resume === undefined) return null;
  return <LessonPlayerInner key={unit.id} unit={unit} resume={resume} />;
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

function LessonPlayerInner({ unit, resume }: { unit: Unit; resume: LessonResume | null }) {
  const navigate = useNavigate();
  const tourist = useSettingsStore((s) => s.tourist);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const sessionBlock = searchParams.get('block');
  const placement = searchParams.get('placement') !== null && unit.kind === 'checkpoint';
  const [stepIdx, setStepIdx] = useState(() =>
    Math.max(
      0,
      unit.steps.findIndex((s) => s.id === resume?.stepId),
    ),
  );
  const advancing = useRef(false);
  useEffect(() => {
    advancing.current = false;
  }, [stepIdx]);
  const gradedScores = useRef<number[]>(resume?.scores ?? []);
  const assessments = useRef(resume?.assessments ?? {});
  const ladders = useRef<Record<string, boolean[]>>(resume?.ladders ?? {});
  const flaggedRef = useRef(resume?.flagged ?? false);
  const [exitArmed, setExitArmed] = useState(false);
  const abortRun = useRunStore((s) => s.abortRun);
  const phase = useRunStore((s) => s.phase);

  useEffect(() => {
    void markUnitInProgress(unit.id);
    return () => abortRun();
  }, [unit.id, abortRun]);

  const step = unit.steps[stepIdx];
  const songTitle =
    step?.kind === 'create' && typeof step.exercise?.params['songTitle'] === 'string'
      ? step.exercise.params['songTitle']
      : null;

  const finishUnit = useCallback(async () => {
    // A tourist reaches the end of the unit and leaves no trace: no pass, no
    // placement chain, no epilogue. The path is exactly where they left it.
    if (tourist) {
      toast(`End of ${unit.title}. Nothing was recorded.`);
      void navigate('/path');
      return;
    }
    const scores = gradedScores.current;
    const score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
    await completeUnit(unit, score, flaggedRef.current);
    await clearResume(unit.id);
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
  }, [unit, tourist, placement, sessionId, sessionBlock, navigate]);

  const advance = useCallback(() => {
    if (advancing.current) return;
    advancing.current = true;
    if (stepIdx + 1 >= unit.steps.length) {
      void finishUnit();
    } else {
      void (async () => {
        await saveResume(unit.id, {
          stepId: unit.steps[stepIdx + 1]!.id,
          scores: gradedScores.current,
          flagged: flaggedRef.current,
          ladders: ladders.current,
          assessments: assessments.current,
        });
        if (sessionId && sessionBlock !== null) {
          const plan = await getSession(sessionId);
          const block = plan?.blocks[Number(sessionBlock)];
          if (block?.kind === 'new' && block.endStep && stepIdx + 1 >= block.endStep) {
            await markBlockComplete(sessionId, Number(sessionBlock), 0);
            toast('Section saved. Continue this lesson next time.', 'ok');
            void navigate('/practice');
            return;
          }
        }
        setStepIdx(stepIdx + 1);
      })();
    }
  }, [stepIdx, unit, finishUnit, sessionId, sessionBlock, navigate]);

  /** Tourist mode: go straight to any step of the unit. */
  const jumpTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= unit.steps.length || idx === stepIdx) return;
      abortRun();
      advancing.current = false;
      setStepIdx(idx);
    },
    [unit.steps.length, stepIdx, abortRun],
  );

  /** Tourist mode: leave the current step without finishing it. */
  const skipStep = useCallback(() => {
    abortRun();
    advance();
  }, [abortRun, advance]);

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
          {songTitle ? 'Play a song' : STEP_CHIP[step.kind]}
        </span>
      </header>
      {/* The step counter says where you are; the rail shows how far that is. */}
      <div className={styles['progress']} aria-hidden>
        <span style={{ width: `${((stepIdx + 1) / unit.steps.length) * 100}%` }} />
      </div>

      {/* Tourist mode: leave any step, or go straight to another one. Every
          gate in this player stays where it is — this bar walks past it. */}
      {tourist && (
        <div className={styles['touristBar']} data-testid="tourist-bar">
          <label className={styles['jump']}>
            Jump to
            <select
              value={stepIdx}
              onChange={(e) => jumpTo(Number(e.target.value))}
              aria-label="Jump to step"
            >
              {unit.steps.map((s, i) => (
                <option key={s.id} value={i}>
                  {i + 1}. {STEP_CHIP[s.kind]}
                </option>
              ))}
            </select>
          </label>
          <Button variant="ghost" onClick={skipStep}>
            Skip this step
            <Icon name="chevronRight" size={16} />
          </Button>
        </div>
      )}

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
          savedLadder={resume?.ladders[step.id]}
          savedAssessment={resume?.assessments?.[step.id]}
          onAssessment={(outcome) => {
            assessments.current[step.id] = outcome;
            void saveResume(unit.id, {
              stepId: step.id,
              scores: gradedScores.current,
              flagged: flaggedRef.current,
              ladders: ladders.current,
              assessments: assessments.current,
            });
          }}
          onLadder={(lit) => {
            ladders.current[step.id] = lit;
            void saveResume(unit.id, {
              stepId: step.id,
              scores: gradedScores.current,
              flagged: flaggedRef.current,
              ladders: ladders.current,
              assessments: assessments.current,
            });
          }}
          onDone={async (score, flagged) => {
            if (advancing.current) return;
            if (step.kind === 'graded') gradedScores.current.push(score);
            if (flagged) {
              flaggedRef.current = true;
              await queueRetest(unit.id, step.id, {
                ...step.exercise,
                assessment: true,
                passScore: step.kind === 'graded' ? step.passScore : 0.8,
              });
            }
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
  const [browse, setBrowse] = useState(false);
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
          {step.blocks.slice(0, browse || pendingCheck === -1 ? undefined : pendingCheck + 1).map((b, i) => (
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
          inputNoteOn(m);
        }}
        onKeyUp={inputNoteOff}
      />
      <div className={styles['footer']}>
        <label>
          <input type="checkbox" checked={browse} onChange={(e) => setBrowse(e.target.checked)} /> Browse the
          explanation
        </label>
        <Button variant="primary" size="l" onClick={onDone} disabled={!browse && pendingCheck !== -1}>
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
  const backingGeneration = useRef(0);
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
    | {
        key?: KeyContext;
        roman?: string[];
        beatsPerChord?: number;
        palette?: string;
        tintDegrees?: number[];
        songTitle?: string;
        songCredit?: string;
        melody?: string[];
      }
    | undefined;

  const stopBacking = useCallback(() => {
    backingGeneration.current += 1;
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
    const generation = ++backingGeneration.current;
    void startBacking({
      key: improvParams.key,
      romans: improvParams.roman?.length ? improvParams.roman : ['I'],
      bpm: improv?.bpm ?? 84,
      beatsPerChord: improvParams.beatsPerChord ?? 4,
      pattern: 'block',
      onBar: setBarIdx,
    }).then((handle) => {
      if (generation !== backingGeneration.current) {
        handle.stop();
        return;
      }
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
          <h2>{improvParams?.songTitle ?? 'Make something'}</h2>
          {improvParams?.songCredit && <p className={styles['songCredit']}>{improvParams.songCredit}</p>}
          <p>{renderMd(step.prompt)}</p>
          {improvParams?.melody && improvParams.melody.length > 0 && (
            <p className={styles['melody']} aria-label="Melody notes">
              {improvParams.melody.join('  ')}
            </p>
          )}
          <p className={styles['hintText']}>
            {improvParams?.songTitle
              ? 'Learn one phrase at a time. Your take lands in Replays.'
              : "There's no score here. Just play. Your take lands in Replays."}
          </p>
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
        onKeyDown={inputNoteOn}
        onKeyUp={inputNoteOff}
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
  savedLadder?: boolean[] | undefined;
  savedAssessment?: SavedAssessment | undefined;
  onAssessment: (outcome: SavedAssessment) => void;
  onLadder: (lit: boolean[]) => void;
  onDone: (score: number, flagged?: boolean) => void;
}

function ExerciseStep({
  step,
  unitId,
  allowSkip,
  placement,
  savedLadder,
  savedAssessment,
  onAssessment,
  onLadder,
  onDone,
}: ExerciseStepProps) {
  const navigate = useNavigate();
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const phase = useRunStore((s) => s.phase);
  const targets = useRunStore((s) => s.targets);
  const judgments = useRunStore((s) => s.judgments);
  const fingerMap = useRunStore((s) => s.fingerMap);
  const targetIndex = useRunStore((s) => s.targetIndex);
  const beatIndex = useRunStore((s) => s.beatIndex);
  const bpmLive = useRunStore((s) => s.bpm);
  const liveResult = useRunStore((s) => s.result);
  const [restoredResult, setRestoredResult] = useState(savedAssessment?.result ?? null);
  const result = liveResult ?? restoredResult;
  const listening = useRunStore((s) => s.listening);
  const startRun = useRunStore((s) => s.startRun);
  const abortRun = useRunStore((s) => s.abortRun);

  const isLadder = step.kind === 'ladder';
  const tempos = useMemo(() => (step.kind === 'ladder' ? step.tempos : [1]), [step]);
  const [pip, setPip] = useState(() =>
    savedLadder
      ? Math.max(
          0,
          savedLadder.findIndex((lit) => !lit),
        )
      : 0,
  );
  const [lit, setLit] = useState<boolean[]>(() =>
    savedLadder?.length === tempos.length ? savedLadder : tempos.map(() => false),
  );
  const [failCount, setFailCount] = useState(savedAssessment?.failCount ?? 0);
  const [slowerPractice, setSlowerPractice] = useState(savedAssessment?.practiceOnly ?? false);
  const [showResults, setShowResults] = useState(!!savedAssessment);
  const [instance, setInstance] = useState<ExerciseInstance | null>(() =>
    savedAssessment ? generate(savedAssessment.exercise, savedAssessment.seed) : null,
  );
  const handledDone = useRef(false);
  const autoAdvance = useRef<ReturnType<typeof setTimeout>>(undefined);

  const defFor = useCallback(
    (pipIdx: number, slow = false): ExerciseDef => {
      const base = {
        ...step.exercise,
        assessment: step.kind === 'graded' && !slow,
        passScore: step.kind === 'graded' ? step.passScore : 0.8,
      };
      const factor = (tempos[pipIdx] ?? 1) * (slow ? 0.75 : 1);
      if (base.mode === 'tempo') {
        return { ...base, bpm: Math.round((base.bpm ?? 80) * factor) };
      }
      return base;
    },
    [step, tempos],
  );

  const start = useCallback(
    (pipIdx = pip, slow = false) => {
      clearTimeout(autoAdvance.current);
      handledDone.current = false;
      setSlowerPractice(slow);
      setShowResults(false);
      setRestoredResult(null);
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
          const nextLit = [...lit];
          nextLit[pip] = true;
          setLit(nextLit);
          onLadder(nextLit);
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
      const nextFails = failCount + (!runResult.passed && !slowerPractice ? 1 : 0);
      setFailCount(nextFails);
      if (s.instance)
        onAssessment({
          result: runResult,
          exercise: s.instance.def,
          seed: s.instance.seed,
          failCount: nextFails,
          practiceOnly: slowerPractice,
        });
      setShowResults(true);
    });
  }, [step.kind, unitId, pip, tempos, onDone, lit, onLadder, failCount, slowerPractice, onAssessment]);

  const allLit = lit.every(Boolean);
  const prompt = instance?.prompt;
  const perTarget = prompt?.perTarget?.[targetIndex];
  const isTempo = step.exercise.mode === 'tempo';
  const currentBpm = bpmLive ?? (isTempo ? Math.round((step.exercise.bpm ?? 80) * (tempos[pip] ?? 1)) : null);

  return (
    <>
      <div className={styles['promptZone']}>
        <div className={styles['exercisePrompt']}>
          <p className={styles['promptDetail']}>
            {prompt?.title ??
              (isLadder ? 'Choose a tempo, then press Start' : 'Press Start when you are ready')}
          </p>
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
              {listening
                ? 'Listen…'
                : (perTarget?.label ??
                  prompt?.detail ??
                  (isLadder ? `Selected tempo: ${currentBpm ?? 0} BPM` : 'The count-in starts after Start'))}
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
            instance={instance}
            practiceOnly={slowerPractice}
            targetCount={instance.targets.length}
            isTempo={isTempo}
            failCount={failCount}
            allowSkip={allowSkip}
            onRetry={() => start()}
            onFocus={() => {
              const errors = result.judgments.filter(
                (j) => ['wrong', 'missed', 'extra'].includes(j.verdict) && j.targetIndex >= 0,
              );
              const counts = new Map<number, number>();
              for (const error of errors)
                counts.set(error.targetIndex, (counts.get(error.targetIndex) ?? 0) + 1);
              const worst = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
              const focused = generate(
                {
                  ...instance.def,
                  assessment: false,
                  rung: 'keys-lit',
                  focus: { start: Math.max(0, worst - 1), end: Math.min(instance.targets.length, worst + 2) },
                },
                instance.seed,
              );
              handledDone.current = false;
              setRestoredResult(null);
              setSlowerPractice(true);
              setShowResults(false);
              setInstance(focused);
              void startRun(focused);
            }}
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
        range={exerciseRange(instance)}
        pressed={activeNotes}
        targets={targets}
        judgments={judgments}
        fingerMap={fingerMap}
        labels={fingerMap.size > 0 ? 'fingers' : 'none'}
        height={190}
        onKeyDown={inputNoteOn}
        onKeyUp={inputNoteOff}
      />
      <TransportBar
        hideStart={showResults}
        phase={phase}
        bpm={currentBpm}
        beatIndex={beatIndex}
        // Guided steps auto-start and auto-advance; a manual restart mid-advance
        // would race the pending step change.
        canStart={step.kind !== 'guided'}
        onStart={() => start()}
        {...(isTempo && phase === 'idle'
          ? { startLabel: `Start at ${currentBpm ?? step.exercise.bpm ?? 80} BPM` }
          : {})}
        {...(isLadder
          ? {
              pips: {
                tempos,
                lit,
                current: pip,
                onSelect: (i: number) => {
                  setPip(i);
                  abortRun();
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
