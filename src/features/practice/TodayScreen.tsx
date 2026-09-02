import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  dismissRecap,
  getPracticedDates,
  getRecap,
  getTodaySession,
  readRecap,
  readTodaySession,
  startWorkout,
} from '@/progress/service';
import { computeStreak, weekDots } from '@/progress/stats';
import { db } from '@/progress/db';
import { STRAND_LABEL, levelDisplay, suggestedStrands } from '@/progress/ratings';
import { ATOMS } from '@/progress/atoms';
import { localDateString, type SessionBlock, type SessionPlan } from '@/progress/sessionBuilder';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { toast } from '@/ui/Toast';
import styles from './TodayScreen.module.css';

const BLOCK_ICON: Record<SessionBlock['kind'], string> = {
  warmup: '🔥',
  new: '📍',
  review: '🔁',
  create: '✨',
};

function blockLabel(block: SessionBlock): string {
  if (block.kind === 'warmup') return 'Warmup';
  if (block.kind === 'new') return `Continue: ${block.title}`;
  if (block.kind === 'review')
    return `Review: ${block.atomIds.length} skill${block.atomIds.length > 1 ? 's' : ''} due`;
  return 'Make something';
}

function blockRoute(plan: SessionPlan, idx: number): string {
  const block = plan.blocks[idx];
  if (block?.kind === 'new') return `/lesson/${block.unitId}?session=${plan.id}&block=${idx}`;
  return `/drill/${plan.id}/${idx}`;
}

export function TodayScreen() {
  const navigate = useNavigate();
  const today = localDateString(new Date());
  // Build today's plan and this week's recap once (liveQuery must stay
  // read-only), then observe them.
  useEffect(() => {
    void getTodaySession();
    void getRecap();
  }, []);
  const plan = useLiveQuery(() => readTodaySession(), [], null);
  const practiced = useLiveQuery(() => getPracticedDates(), [], null);
  const recap = useLiveQuery(() => readRecap(), [], null);
  const ratingRows = useLiveQuery(() => db.ratings.toArray(), [], null);
  const atomRows = useLiveQuery(() => db.atomProgress.toArray(), [], null);
  const [recapHidden, setRecapHidden] = useState(false);

  if (plan === null || practiced === null) return null;
  const streak = computeStreak(practiced, today);
  const dots = weekDots(practiced, today);
  const nextIdx = plan.blocks.findIndex((_, i) => !plan.completedBlocks.includes(i));
  const allDone = plan.blocks.length > 0 && nextIdx === -1;
  const started = plan.completedBlocks.length > 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // A recap is worth showing only once the week actually contains something.
  const showRecap =
    recap !== null && !recap.dismissed && !recapHidden && (recap.minutes > 0 || recap.sessions > 0);
  const tracked = new Set((atomRows ?? []).map((r) => r.atomId));
  const trackedByStrand = (strand: string): Set<string> =>
    new Set([...tracked].filter((id) => ATOMS.get(id)?.strand === strand));
  const suggestions =
    ratingRows === null || atomRows === null
      ? []
      : suggestedStrands(new Map(ratingRows.map((r) => [r.strand, r])), today, (s) => trackedByStrand(s));

  return (
    <div className={styles['wrap']}>
      <header className={styles['header']}>
        <div>
          <h1>{greeting}</h1>
          <p className={styles['sub']}>Small daily steps beat weekend marathons.</p>
        </div>
        <div className={styles['streakBox']}>
          <span className={styles['flame']} data-active={streak.streak > 0}>
            🔥 <span className="tabular">{streak.streak}</span>
          </span>
          {streak.freezes > 0 && (
            <span className={styles['freeze']} title={`${streak.freezes} rest-day freeze banked`}>
              🛡 {streak.freezes}
            </span>
          )}
          <div className={styles['week']}>
            {dots.map((d) => (
              <span
                key={d.date}
                className={styles['dayDot']}
                data-done={d.done}
                data-today={d.date === today}
              />
            ))}
          </div>
        </div>
      </header>

      {plan.catchUp && (
        <div className={styles['banner']}>
          Big review day — lots of skills are due. Want a catch-up workout instead?{' '}
          <Button
            variant="ghost"
            onClick={() => {
              void startWorkout().then((w) => {
                if (w.blocks.length === 0) toast('Nothing due right now — nice!');
                else void navigate(`/drill/${w.id}/0`);
              });
            }}
          >
            Start catch-up
          </Button>
        </div>
      )}

      <Card className={styles['sessionCard'] ?? ''}>
        <div className={styles['sessionHead']}>
          <h2>Today's session</h2>
          <span className={styles['minutes']}>~{plan.blocks.reduce((m, b) => m + b.minutes, 0)} min</span>
        </div>
        {plan.blocks.length === 0 ? (
          <p className={styles['sub']}>All caught up — nothing scheduled. Try a workout or the sandbox.</p>
        ) : (
          <ul className={styles['blocks']}>
            {plan.blocks.map((block, i) => (
              <li key={i} className={styles['block']} data-done={plan.completedBlocks.includes(i)}>
                <span className={styles['blockIcon']} aria-hidden>
                  {plan.completedBlocks.includes(i) ? '✓' : BLOCK_ICON[block.kind]}
                </span>
                <span className={styles['blockLabel']}>{blockLabel(block)}</span>
                <span className={styles['blockMin']}>{block.minutes} min</span>
              </li>
            ))}
          </ul>
        )}
        {allDone ? (
          <p className={styles['doneLine']}>
            Session complete — {plan.blocks.length} blocks, {plan.blocks.reduce((m, b) => m + b.minutes, 0)}{' '}
            minutes of real practice. See you tomorrow. 🌙
          </p>
        ) : (
          plan.blocks.length > 0 && (
            <Button variant="primary" size="l" onClick={() => void navigate(blockRoute(plan, nextIdx))}>
              {started ? 'Continue session' : 'Start session'}
            </Button>
          )
        )}
      </Card>

      {showRecap && recap && (
        <Card className={styles['recapCard'] ?? ''}>
          <div className={styles['recapHead']}>
            <h2>Your week</h2>
            <Button
              variant="ghost"
              onClick={() => {
                setRecapHidden(true);
                void dismissRecap();
              }}
            >
              Dismiss
            </Button>
          </div>
          <div className={styles['recapStats']}>
            <div className={styles['stat']}>
              <span className={styles['statValue']}>{recap.minutes}</span>
              <span className={styles['statLabel']}>minutes</span>
            </div>
            <div className={styles['stat']}>
              <span className={styles['statValue']}>{recap.sessions}</span>
              <span className={styles['statLabel']}>sessions</span>
            </div>
            <div className={styles['stat']}>
              <span className={styles['statValue']}>{recap.newAtoms.length}</span>
              <span className={styles['statLabel']}>new skills</span>
            </div>
            <div className={styles['stat']}>
              <span className={styles['statValue']}>{recap.wentFluent.length}</span>
              <span className={styles['statLabel']}>gone fluent</span>
            </div>
          </div>
          {recap.ratingDeltas.length > 0 && (
            <p className={styles['sub']}>
              {recap.ratingDeltas
                .map(
                  (d) =>
                    `${STRAND_LABEL[d.strand as 'keys'] ?? d.strand} ${levelDisplay(d.from)} → ${levelDisplay(d.to)}`,
                )
                .join(' · ')}
            </p>
          )}
          {recap.highlight && (
            <p className={styles['sub']}>
              {recap.highlight.label} — you first played this {recap.highlight.daysApart} days ago.{' '}
              <Button variant="ghost" onClick={() => void navigate('/progress')}>
                Hear then vs now
              </Button>
            </p>
          )}
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card className={styles['smallCard'] ?? ''}>
          <h3>Rating challenge</h3>
          <p className={styles['sub']}>
            Optional, never required. Ten items at your level in {STRAND_LABEL[suggestions[0]!].toLowerCase()}
            .
          </p>
          <Button onClick={() => void navigate(`/rating/${suggestions[0]}`)}>Take the challenge</Button>
        </Card>
      )}

      <div className={styles['secondary']}>
        <Card className={styles['smallCard'] ?? ''}>
          <h3>5-minute workout</h3>
          <p className={styles['sub']}>Just the reviews that are due.</p>
          <Button
            onClick={() => {
              void startWorkout().then((w) => {
                if (w.blocks.length === 0) toast('Nothing due right now — nice!');
                else void navigate(`/drill/${w.id}/0`);
              });
            }}
          >
            Start
          </Button>
        </Card>
        <Card className={styles['smallCard'] ?? ''}>
          <h3>Sandbox</h3>
          <p className={styles['sub']}>Free play, no scores.</p>
          <Button onClick={() => void navigate('/sandbox')}>Open</Button>
        </Card>
      </div>
    </div>
  );
}
