import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { SONGS } from '@/curriculum/content/songs';
import { STAGES, getUnit } from '@/curriculum/content';
import { nodeStatuses } from '@/curriculum/path';
import { getUnitProgressMap } from '@/progress/db';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import styles from './SongsScreen.module.css';

/** A stage is "reached" once its first unit is available or beyond. */
function highestReachedStage(statuses: Map<string, string>): number {
  let highest = 0;
  for (const stage of STAGES) {
    const first = stage.unitIds[0];
    const status = first ? statuses.get(first) : undefined;
    if (status && status !== 'locked') highest = Math.max(highest, stage.ordinal);
  }
  return highest;
}

export function SongsScreen() {
  const navigate = useNavigate();
  const progress = useLiveQuery(getUnitProgressMap, [], null);
  if (progress === null) return null;
  const statuses = nodeStatuses(progress) as Map<string, string>;
  const reached = highestReachedStage(statuses);

  return (
    <div className={styles['wrap']}>
      <h1>Songs</h1>
      <p className={styles['sub']}>
        Original charts that use exactly what the path has taught. Every song works in every key.
      </p>
      <div className={styles['grid']}>
        {SONGS.map((song) => {
          const locked = song.stage > reached;
          const bars = song.romanized.length;
          return (
            <Card key={song.id} className={styles['card'] ?? ''}>
              {/* Locked cards stay focusable (aria-disabled, not disabled) so a
                  keyboard user can reach them, read why, and scroll the list. */}
              <button
                className={styles['cardButton']}
                aria-disabled={locked}
                onClick={() => {
                  if (!locked) void navigate(`/songs/${song.id}`);
                }}
              >
                <span className={styles['cardTop']}>
                  <span className={styles['title']}>{song.title}</span>
                  {locked && <Icon name="locked" size={15} />}
                </span>
                <span className={styles['style']}>{song.styleRef}</span>
                <span className={styles['meta']}>
                  <span>
                    {song.key.tonic} {song.key.mode}
                  </span>
                  <span className="tabular">{song.bpm} BPM</span>
                  <span className="tabular">{bars} bars</span>
                  {locked && <span className={styles['lockNote']}>unlocks in Stage {song.stage}</span>}
                </span>
                <span className={styles['romans']}>
                  {[...new Set(song.romanized)].slice(0, 6).map((r) => (
                    <span key={r} className={styles['roman']}>
                      {r}
                    </span>
                  ))}
                </span>
              </button>
            </Card>
          );
        })}
      </div>
      {getUnit('s1.u7') && reached < 1 && (
        <p className={styles['sub']}>Your first song opens with Stage 1, a few units away.</p>
      )}
    </div>
  );
}
