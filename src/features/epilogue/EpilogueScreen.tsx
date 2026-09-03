import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/progress/db';
import { getPracticedDates } from '@/progress/service';
import { Button } from '@/ui/Button';
import { APP_NAME } from '@/app/brand';
import styles from './EpilogueScreen.module.css';

/**
 * "The path is yours" (06 s7.cp). The end of the curriculum is not the end of
 * playing, so this screen hands over rather than congratulating: here is what
 * you did, and here is what the app is for now.
 */
export function EpilogueScreen() {
  const navigate = useNavigate();
  const practiced = useLiveQuery(() => getPracticedDates(), [], null);
  const atomCount = useLiveQuery(() => db.atomProgress.count(), [], null);
  const fluentCount = useLiveQuery(() => db.atomProgress.filter((a) => a.fluent).count(), [], null);
  const takeCount = useLiveQuery(() => db.takes.count(), [], null);

  return (
    <div className={styles['wrap']}>
      <div className={styles['card']}>
        <p className={styles['eyebrow']}>Stage 7 complete</p>
        <h1>The path is yours</h1>
        <p className={styles['lede']}>
          You started by finding C. You can now read a chart you have never seen, play it in a key nobody
          warned you about, hear a progression and name it, and make something up over the top. That is not a
          beginner&apos;s skill set.
        </p>

        <div className={styles['stats']}>
          <Stat value={practiced?.size ?? 0} label="days practised" />
          <Stat value={atomCount ?? 0} label="skills learned" />
          <Stat value={fluentCount ?? 0} label="gone fluent" />
          <Stat value={takeCount ?? 0} label="takes recorded" />
        </div>

        <h2>What happens now</h2>
        <ul className={styles['list']}>
          <li>
            <strong>Reviews keep running.</strong> The daily session no longer has new units to teach, so it
            becomes maintenance, and the schedule keeps what you have earned.
          </li>
          <li>
            <strong>Ratings are the new ladder.</strong> Keys, theory and ear challenges are always open, and
            they are the honest measure from here.
          </li>
          <li>
            <strong>The sandbox and songs have no ceiling.</strong> Transpose anything, loop anything,
            improvise over anything.
          </li>
          <li>
            <strong>Your replays are worth revisiting.</strong> Compare a take from today with one from your
            first month. That is what all of this was for.
          </li>
        </ul>

        <p className={styles['sendoff']}>{APP_NAME} taught you the system. The playing was always yours.</p>

        <div className={styles['actions']}>
          <Button variant="primary" size="l" onClick={() => void navigate('/progress')}>
            See how far you came
          </Button>
          <Button onClick={() => void navigate('/sandbox')}>Go play</Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles['stat']}>
      <span className={styles['statValue']}>{value}</span>
      <span className={styles['statLabel']}>{label}</span>
    </div>
  );
}
