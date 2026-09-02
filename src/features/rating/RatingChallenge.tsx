import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { generate } from '@/engine/generators';
import { resolveSeed } from '@/engine/rng';
import {
  CHALLENGE_ITEMS,
  RATED_STRANDS,
  STRAND_LABEL,
  buildChallenge,
  initialLevel,
  itemPassed,
  levelDisplay,
  recordChallenge,
  supportedLevelRange,
  type ChallengeItem,
  type ChallengeOutcome,
  type RatingStrand,
} from '@/progress/ratings';
import { db, saveTake } from '@/progress/db';
import { refreshBadges } from '@/progress/service';
import { useMidiStore } from '@/store/midiStore';
import { useRunStore } from '@/store/runStore';
import { Keyboard } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { RatingDial } from '@/ui/RatingDial';
import { TransportBar } from '@/ui/TransportBar';
import { StaffSnippet } from '@/ui/StaffSnippet';
import { snippetNotes } from '@/engine/generators/readSnippet';
import { toast } from '@/ui/Toast';
import { playNote, stopNote } from '@/audio/sampler';
import styles from './RatingChallenge.module.css';

function isRatingStrand(value: string | undefined): value is RatingStrand {
  return RATED_STRANDS.includes(value as RatingStrand);
}

interface Loaded {
  level: number;
  items: ChallengeItem[];
}

export function RatingChallenge() {
  const { strand } = useParams();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState<Loaded | null | 'loading'>('loading');
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    if (!isRatingStrand(strand)) {
      void navigate('/progress', { replace: true });
      return;
    }
    void (async () => {
      const rows = await db.atomProgress.toArray();
      const trackedIds = new Set(rows.map((r) => r.atomId));
      const stored = await db.ratings.get(strand);
      const level = stored?.level ?? initialLevel(strand, trackedIds);
      const items = buildChallenge(strand, level, trackedIds, resolveSeed('random'));
      if (cancelled) return;
      setTracked(trackedIds);
      setLoaded(items.length > 0 ? { level, items } : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [strand, navigate]);

  if (!isRatingStrand(strand) || loaded === 'loading') return null;

  if (loaded === null) {
    // Not enough taught material to test honestly — say so plainly.
    return (
      <div className={styles['player']}>
        <div className={styles['center']}>
          <div className={styles['card']}>
            <h1>Not yet</h1>
            <p>
              A {STRAND_LABEL[strand].toLowerCase()} challenge draws only on what your path has already taught
              you. Work through a few more units and it will open up.
            </p>
            <Button variant="primary" onClick={() => void navigate('/path')}>
              Back to the path
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Challenge strand={strand} level={loaded.level} items={loaded.items} tracked={tracked} />;
}

function Challenge({
  strand,
  level,
  items,
  tracked,
}: {
  strand: RatingStrand;
  level: number;
  items: ChallengeItem[];
  tracked: ReadonlySet<string>;
}) {
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

  const [stage, setStage] = useState<'intro' | 'running' | 'done'>('intro');
  const [itemIdx, setItemIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [outcome, setOutcome] = useState<ChallengeOutcome | null>(null);
  const busy = useRef(false);

  const item = items[itemIdx];

  const startItem = useCallback(
    (i: number) => {
      const it = items[i];
      if (!it) return;
      busy.current = false;
      void startRun(generate(it.def, resolveSeed(it.def.seedPolicy)));
    },
    [items, startRun],
  );

  useEffect(() => () => abortRun(), [abortRun]);

  // Auto-start wait-mode items once the challenge is running.
  useEffect(() => {
    if (stage !== 'running') return;
    const it = items[itemIdx];
    const t = it && it.def.mode === 'wait' ? setTimeout(() => startItem(itemIdx), 50) : undefined;
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdx, stage]);

  const finish = useCallback(
    (passes: boolean[]) => {
      abortRun();
      const passedCount = passes.filter(Boolean).length;
      void recordChallenge(strand, passedCount, tracked).then(async (out) => {
        setOutcome(out);
        setStage('done');
        for (const badge of await refreshBadges()) toast(`Badge earned — ${badge.title}`, 'ok');
      });
    },
    [abortRun, strand, tracked],
  );

  // One shot per item: no retries (05 §Rating challenge).
  useEffect(() => {
    if (stage !== 'running') return;
    return useRunStore.subscribe((s, prev) => {
      if (s.phase !== 'done' || prev.phase === 'done' || !s.result || busy.current) return;
      busy.current = true;
      const it = items[itemIdx];
      if (!it) return;
      if (s.lastTake) void saveTake(s.lastTake);
      const passes = [...results, itemPassed(s.result.score)];
      setResults(passes);
      setTimeout(() => {
        if (itemIdx + 1 < items.length) setItemIdx(itemIdx + 1);
        else finish(passes);
      }, 800);
    });
  }, [items, itemIdx, results, stage, finish]);

  const exit = (): void => {
    abortRun();
    void navigate('/progress');
  };

  if (stage === 'intro') {
    const range = supportedLevelRange(strand, tracked);
    return (
      <div className={styles['player']}>
        <div className={styles['center']}>
          <div className={styles['card']}>
            <div className={styles['dialWrap']}>
              <RatingDial level={level} label={STRAND_LABEL[strand]} />
            </div>
            <h1>{STRAND_LABEL[strand]} challenge</h1>
            <p>
              {CHALLENGE_ITEMS} items at your current level. One shot each — no retries, no clock pressure
              beyond the exercise itself. Pass 8 and you move up two.
            </p>
            {range && level >= range.max && (
              <p className={styles['sub']}>
                You&apos;re at the top of what your path has taught. Learn new material to raise the ceiling.
              </p>
            )}
            <div className={styles['actions']}>
              <Button variant="primary" size="l" onClick={() => setStage('running')}>
                Start
              </Button>
              <Button variant="ghost" onClick={exit}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'done' && outcome) {
    const deltaClass =
      outcome.verdict === 'up'
        ? styles['deltaUp']
        : outcome.verdict === 'down'
          ? styles['deltaDown']
          : styles['deltaHold'];
    const headline =
      outcome.verdict === 'up' ? 'Level up' : outcome.verdict === 'down' ? 'Down a step' : 'Holding steady';
    return (
      <div className={styles['player']}>
        <div className={styles['center']}>
          <div className={styles['card']}>
            <div className={styles['dialWrap']}>
              <RatingDial level={outcome.after} label={STRAND_LABEL[strand]} size={132} />
            </div>
            <h1>{headline}</h1>
            <p className={deltaClass}>
              {outcome.delta > 0 ? '+' : ''}
              {outcome.delta === 0 ? `${levelDisplay(outcome.after)}` : `${levelDisplay(outcome.delta)}`}
            </p>
            <p>
              {outcome.passedCount} of {outcome.total} clean.{' '}
              {outcome.verdict === 'up'
                ? 'That material is yours now.'
                : outcome.verdict === 'down'
                  ? 'It slipped a little — the reviews will bring it back.'
                  : 'Solid ground. Another run will move it.'}
            </p>
            <div className={styles['actions']}>
              <Button variant="primary" onClick={() => void navigate('/progress')}>
                See progress
              </Button>
              <Button variant="ghost" onClick={() => void navigate('/practice')}>
                Back to today
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;
  const perTarget = instance?.prompt.perTarget?.[targetIndex];

  return (
    <div className={styles['player']}>
      <header className={styles['topbar']}>
        <button className={styles['close']} onClick={exit} aria-label="Exit challenge">
          <Icon name="close" />
        </button>
        <span className={styles['title']}>{STRAND_LABEL[strand]} challenge</span>
        <span className={styles['levelBadge']}>{levelDisplay(level)}</span>
        <div className={styles['pips']} role="img" aria-label={`Item ${itemIdx + 1} of ${items.length}`}>
          {items.map((_, i) => {
            const cls =
              i < results.length
                ? results[i]
                  ? styles['pipPass']
                  : styles['pipMiss']
                : i === itemIdx
                  ? styles['pipCurrent']
                  : '';
            return <span key={i} className={`${styles['pip']} ${cls}`} />;
          })}
        </div>
      </header>
      <div className={styles['promptZone']}>
        <div className={styles['prompt']}>
          <p className={styles['sub']}>
            {itemIdx + 1}/{items.length} · {item.label}
          </p>
          {instance?.def.generator === 'read-snippet' && instance.prompt.key ? (
            <StaffSnippet
              midis={snippetNotes(instance)}
              keyContext={instance.prompt.key}
              clef={instance.def.params['clef'] === 'bass' ? 'bass' : 'treble'}
              highlightIndex={targetIndex}
            />
          ) : (
            <h2 className={styles['promptMain']}>
              {perTarget?.label ?? instance?.prompt.detail ?? instance?.prompt.title ?? ''}
            </h2>
          )}
          {phase === 'done' && <p className={styles['nextUp']}>Next…</p>}
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
