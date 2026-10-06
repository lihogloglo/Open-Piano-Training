import { tr } from '@/i18n';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { TRACKS, getUnit } from '@/curriculum/content';
import type { Track } from '@/curriculum/schema';
import { MUSIC_LESSONS, PIECES, TUNE_PIECES, type MusicStudy } from '@/curriculum/content/musicianship';
import { getUnitProgressMap } from '@/progress/db';
import { Button } from '@/ui/Button';
import { Icon, type IconName } from '@/ui/Icon';
import styles from './StudioCatalog.module.css';

const TRACK_ICON: Record<string, IconName> = { rd: 'note', rt: 'metronome' };

/**
 * The studio: short courses beside the path, then complete pieces, then the
 * practical lessons. Every course lesson is open from the start; the next one
 * is simply the first not yet done.
 */
export function StudioCatalog() {
  const progress = useLiveQuery(getUnitProgressMap, [], null);
  const passed = new Set(
    progress ? [...progress.values()].filter((p) => p.status === 'passed').map((p) => p.unitId) : [],
  );
  return (
    <main className={styles['page']}>
      <header className={styles['intro']}>
        <h1>{tr('Studio')}</h1>
        <p>
          {tr('Short courses, complete pieces and practice beside the path. Open anything, in any order.')}
        </p>
      </header>

      <section aria-labelledby="courses">
        <h2 id="courses" className={styles['sectionTitle']}>
          {tr('Courses')}
        </h2>
        <div className={styles['courses']}>
          {TRACKS.map((track) => (
            <CourseCard key={track.id} track={track} passed={passed} />
          ))}
        </div>
      </section>

      <section aria-labelledby="pieces">
        <h2 id="pieces" className={styles['sectionTitle']}>
          {tr('Pieces')}
        </h2>
        <StudyGrid studies={[...TUNE_PIECES, ...PIECES]} />
      </section>

      <section aria-labelledby="practice">
        <h2 id="practice" className={styles['sectionTitle']}>
          {tr('Practical lessons')}
        </h2>
        <StudyGrid studies={MUSIC_LESSONS} />
      </section>
    </main>
  );
}

function CourseCard({ track, passed }: { track: Track; passed: ReadonlySet<string> }) {
  const navigate = useNavigate();
  const done = track.unitIds.filter((id) => passed.has(id)).length;
  const next = track.unitIds.find((id) => !passed.has(id));
  const nextUnit = next ? getUnit(next) : undefined;
  const finished = !next;
  return (
    <article className={styles['course']} data-finished={finished || undefined}>
      <div className={styles['courseHead']}>
        <span className={styles['courseIcon']} aria-hidden>
          <Icon name={TRACK_ICON[track.id] ?? 'studio'} size={22} />
        </span>
        <div>
          <h3>{track.title}</h3>
          <p>{track.summary}</p>
        </div>
        <span className={`${styles['count']} tabular`}>
          {tr('{v0}/{v1}', { v0: done, v1: track.unitIds.length })}
        </span>
      </div>
      <ol className={styles['dots']} aria-label={tr('Lessons in {v0}', { v0: track.title })}>
        {track.unitIds.map((id, i) => {
          const unit = getUnit(id);
          const state = passed.has(id) ? 'done' : id === next ? 'next' : 'open';
          return (
            <li key={id}>
              <Link
                to={`/lesson/${id}`}
                className={styles['dot']}
                data-state={state}
                title={unit?.title}
                aria-label={tr('Lesson {v0}: {v1}', { v0: i + 1, v1: unit?.title ?? id })}
              >
                {state === 'done' ? <Icon name="check" size={14} /> : i + 1}
              </Link>
              <span className={styles['dotLabel']}>{unit?.title}</span>
            </li>
          );
        })}
      </ol>
      <div className={styles['courseFoot']}>
        <span className={styles['nextTitle']}>
          {finished
            ? tr('Course complete. Replay any lesson.')
            : tr('Next: {v0} · {v1} min', { v0: nextUnit?.title ?? '', v1: nextUnit?.minutes ?? 4 })}
        </span>
        {next && (
          <Button variant="primary" onClick={() => void navigate(`/lesson/${next}`)}>
            {done === 0 ? tr('Start') : tr('Continue')}
            <Icon name="chevronRight" size={16} />
          </Button>
        )}
      </div>
    </article>
  );
}

function StudyGrid({ studies }: { studies: MusicStudy[] }) {
  return (
    <div className={styles['grid']}>
      {studies.map((s) => (
        <Link className={styles['study']} key={s.id} to={`/studio/${s.id}`}>
          <h3>{s.title}</h3>
          <p>{s.selfChecks[0]}</p>
          <small>{tr('From Stage {v0}', { v0: s.stage })}</small>
        </Link>
      ))}
    </div>
  );
}
