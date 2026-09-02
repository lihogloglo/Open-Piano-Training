import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/progress/db';
import { loadBadges, markThenVsNowViewed, startWorkout } from '@/progress/service';
import {
  STRAND_LABEL,
  clampLevel,
  initialLevel,
  ratedStrands,
  supportedLevelRange,
  type RatingStrand,
} from '@/progress/ratings';
import { useSettingsStore } from '@/store/settingsStore';
import { BADGES, findThenVsNowPairs, type ReplayPair } from '@/progress/badges';
import { FAMILIES, HEATMAP_KEYS, buildHeatmap, type HeatCell } from '@/progress/heatmap';
import { ATOMS } from '@/progress/atoms';
import { Button } from '@/ui/Button';
import { RatingDial } from '@/ui/RatingDial';
import { Sparkline } from '@/ui/Sparkline';
import { toast } from '@/ui/Toast';
import { ReplayPlayer } from './ReplayPlayer';
import styles from './ProgressScreen.module.css';

/** Fluency 0..1 mapped to an accent tint. 0 stays gray: untouched is untouched. */
function heatColor(value: number): string {
  if (value <= 0) return 'var(--surface-2)';
  const pct = Math.round(12 + value * 68);
  return `color-mix(in srgb, var(--accent) ${pct}%, var(--surface))`;
}

function prettyKey(key: string): string {
  return key.replace('#', '♯').replace(/(?<=.)b/, '♭');
}

export function ProgressScreen() {
  const navigate = useNavigate();
  const atomRows = useLiveQuery(() => db.atomProgress.toArray(), [], null);
  const ratingRows = useLiveQuery(() => db.ratings.toArray(), [], null);
  const takes = useLiveQuery(
    () => db.takes.orderBy('startedAt').reverse().limit(120).toArray(),
    [],
    null,
  );
  const badges = useLiveQuery(() => loadBadges(), [], null);
  const readStrandEnabled = useSettingsStore((s) => s.readStrandEnabled);
  const [openPair, setOpenPair] = useState<ReplayPair | null>(null);

  if (atomRows === null || ratingRows === null || takes === null || badges === null) return null;

  const tracked = new Set(atomRows.map((r) => r.atomId));
  const ratingByStrand = new Map(ratingRows.map((r) => [r.strand, r]));
  const cells = buildHeatmap(atomRows);
  const pairs = findThenVsNowPairs(takes);
  const starred = takes.filter((t) => t.result.stars === 3).slice(0, 6);

  if (atomRows.length === 0 && takes.length === 0) {
    return (
      <div className={styles['wrap']}>
        <h1>Progress</h1>
        <div className={styles['empty']}>
          <p>Nothing to show yet. This page fills in as you play.</p>
          <p className={styles['muted']}>
            Ratings, a fluency map of all 12 keys, your best takes, and badges all live here.
          </p>
          <Button variant="primary" onClick={() => void navigate('/practice')}>
            Start today&apos;s session
          </Button>
        </div>
      </div>
    );
  }

  const drillCell = (cell: HeatCell): void => {
    const drillable = cell.atomIds.filter((id) => tracked.has(id) && ATOMS.get(id)?.drill);
    if (drillable.length === 0) {
      toast('Nothing learned here yet. The path will get you there.');
      return;
    }
    void startWorkout().then((plan) => {
      if (plan.blocks.length === 0) toast('Nothing due right now. Nice!');
      else void navigate(`/drill/${plan.id}/0`);
    });
  };

  return (
    <div className={styles['wrap']}>
      <h1>Progress</h1>

      <section className={styles['section']}>
        <div className={styles['sectionHead']}>
          <h2>Ratings</h2>
          <p className={styles['muted']}>
            Always optional. A challenge only tests what you&apos;ve been taught.
          </p>
        </div>
        <div className={styles['dials']}>
          {ratedStrands(readStrandEnabled).map((strand: RatingStrand) => {
            const row = ratingByStrand.get(strand);
            const challengeable = supportedLevelRange(strand, tracked) !== null;
            const level = row ? clampLevel(row.level, strand, tracked) : initialLevel(strand, tracked);
            const history = (row?.history ?? []).slice(-8).map((h) => h.level);
            return (
              <div key={strand} className={styles['dialCard']} data-locked={!challengeable}>
                <RatingDial level={level} label={STRAND_LABEL[strand]} pending={!row} />
                <Sparkline values={history} label={`${STRAND_LABEL[strand]} trend`} />
                <Button
                  variant={challengeable ? 'secondary' : 'ghost'}
                  disabled={!challengeable}
                  onClick={() => void navigate(`/rating/${strand}`)}
                >
                  {challengeable ? (row ? 'Challenge again' : 'Take a challenge') : 'Locked'}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles['section']}>
        <div className={styles['sectionHead']}>
          <h2>The map</h2>
          <div className={styles['legend']}>
            <span>Not started</span>
            <span className={styles['legendSwatch']} style={{ background: heatColor(0) }} />
            <span className={styles['legendSwatch']} style={{ background: heatColor(0.4) }} />
            <span className={styles['legendSwatch']} style={{ background: heatColor(1) }} />
            <span>Fluent</span>
          </div>
        </div>
        <div className={styles['heatScroll']}>
          <table className={styles['heatGrid']}>
            <caption className="sr-only">Fluency by key and skill family</caption>
            <thead>
              <tr>
                <th />
                {HEATMAP_KEYS.map((key) => (
                  <th key={key} scope="col">
                    {prettyKey(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAMILIES.map((family) => (
                <tr key={family.id}>
                  <th scope="row">{family.label}</th>
                  {HEATMAP_KEYS.map((key) => {
                    const cell = cells.find((c) => c.key === key && c.family === family.id)!;
                    const state =
                      cell.tracked === 0
                        ? 'not started'
                        : `${cell.fluent} of ${cell.tracked} fluent`;
                    return (
                      <td key={key}>
                        <button
                          className={styles['cell']}
                          style={{ background: heatColor(cell.value) }}
                          disabled={cell.tracked === 0}
                          onClick={() => drillCell(cell)}
                          title={`${family.label} in ${key}: ${state}`}
                          aria-label={`${family.label} in ${key}, ${state}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pairs.length > 0 && (
        <section className={styles['section']}>
          <h2>Then vs now</h2>
          {openPair ? (
            <div className={styles['pairWrap']}>
              <div className={styles['pairHead']}>
                <div>
                  <strong>{openPair.label}</strong>
                  <p className={styles['muted']}>{openPair.daysApart} days apart</p>
                </div>
                <Button variant="ghost" onClick={() => setOpenPair(null)}>
                  Close
                </Button>
              </div>
              <div className={styles['pairGrid']}>
                <ReplayPlayer take={openPair.then} title="Then" compact />
                <ReplayPlayer take={openPair.now} title="Now" compact />
              </div>
            </div>
          ) : (
            <div className={styles['replayList']}>
              {pairs.slice(0, 3).map((pair) => (
                <div key={pair.atomId} className={styles['replay']}>
                  <div className={styles['replayHead']}>
                    <div>
                      <p className={styles['replayTitle']}>{pair.label}</p>
                      <p className={styles['muted']}>{pair.daysApart} days apart</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOpenPair(pair);
                      void markThenVsNowViewed();
                    }}
                  >
                    Compare
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className={styles['section']}>
        <h2>Best takes</h2>
        {starred.length === 0 ? (
          <p className={styles['muted']}>
            Three-star takes get saved here so you can hear them again.
          </p>
        ) : (
          <div className={styles['replayList']}>
            {starred.map((take) => (
              <ReplayPlayer
                key={take.id}
                take={take}
                compact
                title={ATOMS.get(take.atomIds[0] ?? '')?.label ?? take.exercise.generator}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles['section']}>
        <h2>Badges</h2>
        <div className={styles['badgeWall']}>
          {BADGES.map((badge) => {
            const earned = badges.has(badge.id);
            return (
              <div key={badge.id} className={styles['badge']} data-earned={earned}>
                <span className={styles['badgeMark']} aria-hidden>
                  {earned ? '\u{1F3C5}' : '○'}
                </span>
                <span className={styles['badgeTitle']}>{badge.title}</span>
                <span className={styles['muted']}>{badge.criterion}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
