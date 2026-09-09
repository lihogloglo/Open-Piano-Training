import { tr } from '@/i18n';
import { getUnit } from '@/curriculum/content';
import { performanceMilestones } from '@/progress/performance';
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
import { Icon } from '@/ui/Icon';
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
  const takes = useLiveQuery(() => db.takes.orderBy('startedAt').reverse().toArray(), [], null);
  const studies = useLiveQuery(() => db.meta.where('key').startsWith('study:').toArray(), [], []);
  const units = useLiveQuery(() => db.unitProgress.where('status').equals('passed').toArray(), [], []);
  const badges = useLiveQuery(() => loadBadges(), [], null);
  const tourist = useSettingsStore((s) => s.tourist);
  const readStrandEnabled = useSettingsStore((s) => s.readStrandEnabled);
  const [openPair, setOpenPair] = useState<ReplayPair | null>(null);

  if (atomRows === null || ratingRows === null || takes === null || badges === null) return null;

  const tracked = new Set(tourist ? ATOMS.keys() : atomRows.map((r) => r.atomId));
  const ratingByStrand = new Map(ratingRows.map((r) => [r.strand, r]));
  const cells = buildHeatmap(atomRows);
  const pairs = findThenVsNowPairs(takes);
  const starred = takes.filter((t) => t.result.stars === 3).slice(0, 6);

  if (!tourist && atomRows.length === 0 && takes.length === 0 && studies.length === 0 && units.length === 0) {
    return (
      <div className={styles['wrap']}>
        <h1>{tr('Progress')}</h1>
        <div className={styles['empty']}>
          <p>{tr('Nothing to show yet. This page fills in as you play.')}</p>
          <p className={styles['muted']}>
            {tr('Ratings, a recall map of all 12 keys, your best takes, and badges all live here.')}
          </p>
          <Button variant="primary" onClick={() => void navigate('/practice')}>
            {tr("Start today's session")}
          </Button>
        </div>
      </div>
    );
  }

  const drillCell = (cell: HeatCell): void => {
    const drillable = cell.atomIds.filter((id) => tracked.has(id) && ATOMS.get(id)?.drill);
    if (drillable.length === 0) {
      toast(tr('Nothing learned here yet. The path will get you there.'));
      return;
    }
    void startWorkout().then((plan) => {
      if (plan.blocks.length === 0) toast(tr('Nothing due right now. Nice!'));
      else void navigate(`/drill/${plan.id}/0`);
    });
  };

  return (
    <div className={styles['wrap']}>
      <h1>{tr('Progress')}</h1>

      <section className={styles['section']}>
        <h2>{tr('Musical achievements')}</h2>
        <p>
          {tr(
            'Completed means explored. Independent means passed without hints. Retained means repeated under the same conditions on another day.',
          )}
        </p>
        <details>
          <summary>
            {tr('Completed lessons and self-checks (')}
            {units.length + studies.length})
          </summary>
          {units.map((u) => (
            <p key={u.unitId}>
              {getUnit(u.unitId)?.title ?? u.unitId}
              {tr(' - Completed')}
              {u.flagged ? tr(' (extra review due)') : ''}
            </p>
          ))}
          {studies.map((s) => (
            <p key={s.key}>
              {tr(String((s.value as { title?: string }).title ?? s.key))}
              {tr(' - Completed (self-check)')}
            </p>
          ))}
        </details>
        {performanceMilestones(takes)
          .slice(0, 12)
          .map((m, i) => (
            <p key={i}>
              {getUnit(m.title)?.title ?? tr(m.title)} - {tr(m.level)} -{' '}
              {m.hand === 'both' ? tr('Both hands') : m.hand === 'lh' ? tr('Left hand') : tr('Right hand')}
              {m.bpm ? tr(' - {v0} BPM', { v0: m.bpm }) : tr(' - Untimed')} - {m.conditions}
            </p>
          ))}
      </section>
      <section className={styles['section']}>
        <div className={styles['sectionHead']}>
          <h2>{tr('Ratings')}</h2>
          <p className={styles['muted']}>
            {tr("Always optional. A challenge only tests what you've been taught.")}
          </p>
        </div>
        <div className={styles['dials']}>
          {ratedStrands(readStrandEnabled || tourist).map((strand: RatingStrand) => {
            const row = ratingByStrand.get(strand);
            const challengeable = supportedLevelRange(strand, tracked) !== null;
            const level = row ? clampLevel(row.level, strand, tracked) : initialLevel(strand, tracked);
            const history = (row?.history ?? []).slice(-8).map((h) => h.level);
            return (
              <div key={strand} className={styles['dialCard']} data-locked={!challengeable}>
                <RatingDial level={level} label={STRAND_LABEL[strand]} pending={!row} />
                <Sparkline values={history} label={tr('{v0} trend', { v0: STRAND_LABEL[strand] })} />
                <Button
                  variant={challengeable ? 'secondary' : 'ghost'}
                  disabled={!challengeable}
                  onClick={() => void navigate(`/rating/${strand}`)}
                >
                  {challengeable ? (row ? tr('Challenge again') : tr('Take a challenge')) : tr('Locked')}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles['section']}>
        <div className={styles['sectionHead']}>
          <h2>{tr('Recall map')}</h2>
          <p>{tr('Review memory strength. Use performances above to track playing without hints.')}</p>
          <div className={styles['legend']}>
            <span>{tr('Not started')}</span>
            <span className={styles['legendSwatch']} style={{ background: heatColor(0) }} />
            <span className={styles['legendSwatch']} style={{ background: heatColor(0.4) }} />
            <span className={styles['legendSwatch']} style={{ background: heatColor(1) }} />
            <span>{tr('Strong recall')}</span>
          </div>
        </div>
        <div className={styles['heatScroll']}>
          <table className={styles['heatGrid']}>
            <caption className="sr-only">{tr('Recall by key and skill family')}</caption>
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
                        ? tr('not started')
                        : tr('{v0} of {v1} with strong recall', { v0: cell.fluent, v1: cell.tracked });
                    return (
                      <td key={key}>
                        <button
                          className={styles['cell']}
                          style={{ background: heatColor(cell.value) }}
                          disabled={cell.tracked === 0}
                          onClick={() => drillCell(cell)}
                          title={tr('{v0} in {v1}: {v2}', { v0: family.label, v1: key, v2: state })}
                          aria-label={tr('{v0} in {v1}, {v2}', { v0: family.label, v1: key, v2: state })}
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
          <h2>{tr('Then vs now')}</h2>
          {openPair ? (
            <div className={styles['pairWrap']}>
              <div className={styles['pairHead']}>
                <div>
                  <strong>{openPair.label}</strong>
                  <p className={styles['muted']}>
                    {openPair.daysApart}
                    {tr(' days apart')}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setOpenPair(null)}>
                  {tr('Close')}
                </Button>
              </div>
              <div className={styles['pairGrid']}>
                <ReplayPlayer take={openPair.then} title={tr('Then')} compact />
                <ReplayPlayer take={openPair.now} title={tr('Now')} compact />
              </div>
            </div>
          ) : (
            <div className={styles['replayList']}>
              {pairs.slice(0, 3).map((pair) => (
                <div key={pair.atomId} className={styles['replay']}>
                  <div className={styles['replayHead']}>
                    <div>
                      <p className={styles['replayTitle']}>{pair.label}</p>
                      <p className={styles['muted']}>
                        {pair.daysApart}
                        {tr(' days apart')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOpenPair(pair);
                      void markThenVsNowViewed();
                    }}
                  >
                    {tr('Compare')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className={styles['section']}>
        <h2>{tr('Best takes')}</h2>
        {starred.length === 0 ? (
          <p className={styles['muted']}>
            {tr('Three-star takes get saved here so you can hear them again.')}
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
        <h2>{tr('Badges')}</h2>
        <div className={styles['badgeWall']}>
          {BADGES.map((badge) => {
            const earned = badges.has(badge.id);
            return (
              <div key={badge.id} className={styles['badge']} data-earned={earned}>
                <span className={styles['badgeMark']}>
                  {earned ? (
                    <Icon name="badge" size={20} weight="fill" />
                  ) : (
                    <Icon name="badgeEmpty" size={20} />
                  )}
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
