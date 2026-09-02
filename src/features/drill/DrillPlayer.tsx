import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { generate } from '@/engine/generators';
import { resolveSeed } from '@/engine/rng';
import type { ExerciseDef } from '@/engine/types';
import { ATOMS } from '@/progress/atoms';
import { getSession, gradeAtom, markBlockComplete } from '@/progress/service';
import type { SessionBlock, SessionPlan } from '@/progress/sessionBuilder';
import { saveTake } from '@/progress/db';
import { useMidiStore } from '@/store/midiStore';
import { useRunStore } from '@/store/runStore';
import { Keyboard } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { TransportBar } from '@/ui/TransportBar';
import { StaffSnippet } from '@/ui/StaffSnippet';
import { snippetNotes } from '@/engine/generators/readSnippet';
import { toast } from '@/ui/Toast';
import { playNote, stopNote } from '@/audio/sampler';
import styles from './DrillPlayer.module.css';

interface DrillItem {
  atomId: string;
  label: string;
  def: ExerciseDef;
}

function itemsForBlock(block: SessionBlock): DrillItem[] {
  if (block.kind === 'review') {
    return block.atomIds.flatMap((atomId) => {
      const atom = ATOMS.get(atomId);
      return atom?.drill ? [{ atomId, label: atom.label, def: atom.drill }] : [];
    });
  }
  if (block.kind === 'warmup') {
    return block.exercises.map((e) => ({
      atomId: e.atomId,
      label: ATOMS.get(e.atomId)?.label ?? e.atomId,
      def: e.def,
    }));
  }
  return [];
}

export function DrillPlayer() {
  const { sessionId, blockIdx } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<SessionPlan | null | 'loading'>('loading');

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) return;
    void getSession(sessionId).then((p) => {
      if (!cancelled) setPlan(p);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (plan === null) void navigate('/practice', { replace: true });
  }, [plan, navigate]);

  if (plan === 'loading' || plan === null) return null;
  const idx = Number(blockIdx ?? 0);
  const block = plan.blocks[idx];
  if (!block) return null;
  return <DrillBlock plan={plan} block={block} blockIdx={idx} />;
}

function DrillBlock({ plan, block, blockIdx }: { plan: SessionPlan; block: SessionBlock; blockIdx: number }) {
  const navigate = useNavigate();
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const phase = useRunStore((s) => s.phase);
  const targets = useRunStore((s) => s.targets);
  const judgments = useRunStore((s) => s.judgments);
  const fingerMap = useRunStore((s) => s.fingerMap);
  const targetIndex = useRunStore((s) => s.targetIndex);
  const beatIndex = useRunStore((s) => s.beatIndex);
  const bpm = useRunStore((s) => s.bpm);
  const instance = useRunStore((s) => s.instance);
  const startRun = useRunStore((s) => s.startRun);
  const abortRun = useRunStore((s) => s.abortRun);

  const items = itemsForBlock(block);
  const [itemIdx, setItemIdx] = useState(0);
  const busy = useRef(false);
  const item = items[itemIdx];

  const finishBlock = useCallback(() => {
    abortRun();
    void markBlockComplete(plan.id, blockIdx, block.minutes).then(() => {
      const nextIdx = plan.blocks.findIndex(
        (_, i) => i !== blockIdx && !plan.completedBlocks.includes(i) && i > blockIdx,
      );
      toast(block.kind === 'create' ? 'Nice — session block done' : 'Block complete!', 'ok');
      if (nextIdx !== -1) {
        const next = plan.blocks[nextIdx];
        if (next?.kind === 'new') {
          void navigate(`/lesson/${next.unitId}?session=${plan.id}&block=${nextIdx}`);
          return;
        }
        void navigate(`/drill/${plan.id}/${nextIdx}`);
        return;
      }
      void navigate('/practice');
    });
  }, [plan, block, blockIdx, abortRun, navigate]);

  const startItem = useCallback(
    (i: number) => {
      const it = items[i];
      if (!it) return;
      busy.current = false;
      const inst = generate(it.def, resolveSeed(it.def.seedPolicy));
      void startRun(inst);
    },
    [items, startRun],
  );

  // Auto-start wait-mode items; tempo items wait for Start.
  useEffect(() => {
    const it = items[itemIdx];
    const t = it && it.def.mode === 'wait' ? setTimeout(() => startItem(itemIdx), 50) : undefined;
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdx]);

  useEffect(() => () => abortRun(), [abortRun]);

  // Completion: grade the atom, brief pause, next item.
  useEffect(() => {
    return useRunStore.subscribe((s, prev) => {
      if (s.phase !== 'done' || prev.phase === 'done' || !s.result || busy.current) return;
      busy.current = true;
      const it = items[itemIdx];
      if (!it) return;
      if (s.lastTake) void saveTake({ ...s.lastTake, sessionId: plan.id });
      void gradeAtom(it.atomId, s.result.score);
      setTimeout(() => {
        if (itemIdx + 1 < items.length) setItemIdx(itemIdx + 1);
        else finishBlock();
      }, 800);
    });
  }, [items, itemIdx, plan.id, finishBlock]);

  if (block.kind === 'create') {
    return (
      <div className={styles['player']}>
        <Header title="Make something" onExit={() => void navigate('/practice')} />
        <div className={styles['promptZone']}>
          <div className={styles['createPrompt']}>
            <h2>Make something</h2>
            <p>{block.prompt}</p>
            <p className={styles['sub']}>No score, no clock — just play.</p>
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
          <Button variant="primary" size="l" onClick={finishBlock}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (!item) {
    // Nothing drillable (shouldn't happen): complete and move on.
    finishBlock();
    return null;
  }

  const perTarget = instance?.prompt.perTarget?.[targetIndex];

  return (
    <div className={styles['player']}>
      <Header
        title={block.kind === 'warmup' ? 'Warmup' : 'Review'}
        subtitle={`${itemIdx + 1}/${items.length} · ${item.label}`}
        onExit={() => void navigate('/practice')}
      />
      <div className={styles['promptZone']}>
        <div className={styles['exercisePrompt']}>
          <p className={styles['sub']}>{instance?.prompt.title ?? item.label}</p>
          {instance?.def.generator === 'read-snippet' && instance.prompt.key ? (
            <StaffSnippet
              midis={snippetNotes(instance)}
              keyContext={instance.prompt.key}
              clef={instance.def.params['clef'] === 'bass' ? 'bass' : 'treble'}
              highlightIndex={targetIndex}
            />
          ) : (
            <h2 className={styles['promptMain']}>{perTarget?.label ?? instance?.prompt.detail ?? ''}</h2>
          )}
          {phase === 'done' && <p className={styles['nextUp']}>Next up…</p>}
        </div>
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
        bpm={bpm ?? (item.def.mode === 'tempo' ? (item.def.bpm ?? 80) : null)}
        beatIndex={beatIndex}
        canStart={item.def.mode === 'tempo' && phase !== 'done'}
        onStart={() => startItem(itemIdx)}
      />
    </div>
  );
}

function Header({ title, subtitle, onExit }: { title: string; subtitle?: string; onExit: () => void }) {
  return (
    <header className={styles['topbar']}>
      <button className={styles['close']} onClick={onExit} aria-label="Exit">
        <Icon name="close" />
      </button>
      <span className={styles['title']}>{title}</span>
      {subtitle && <span className={styles['subtitle']}>{subtitle}</span>}
    </header>
  );
}
