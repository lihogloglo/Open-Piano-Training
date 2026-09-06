import { MUSIC_LESSONS } from '@/curriculum/content/musicianship';
import { Link } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { buildPath, nodeStatuses, type NodeStatus, type PathNode } from '@/curriculum/path';
import { getUnitProgressMap } from '@/progress/db';
import { startWorkout } from '@/progress/service';
import { ProgressRing } from '@/ui/ProgressRing';
import { StarRating } from '@/ui/StarRating';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { toast } from '@/ui/Toast';
import styles from './PathScreen.module.css';

const STRAND_LABEL: Record<string, string> = {
  ear: 'Hear',
  theory: 'Name',
  keys: 'Play',
  read: 'Read',
  create: 'Make',
};

function starsFor(score: number): 0 | 1 | 2 | 3 {
  return score >= 0.97 ? 3 : score >= 0.9 ? 2 : score >= 0.8 ? 1 : 0;
}

export function PathScreen() {
  const navigate = useNavigate();
  const progress = useLiveQuery(getUnitProgressMap, [], null);
  const [selected, setSelected] = useState<PathNode | null>(null);
  const hereRef = useRef<HTMLButtonElement | null>(null);
  const loaded = progress !== null;

  useEffect(() => {
    hereRef.current?.scrollIntoView({ block: 'center' });
  }, [loaded]);

  if (progress === null) return null;
  const statuses = nodeStatuses(progress);
  const sections = buildPath();
  const hereId = sections
    .flatMap((s) => s.nodes)
    .find((n) => {
      const st = statuses.get(n.id);
      return n.unit && (st === 'available' || st === 'in-progress');
    })?.id;

  return (
    <div className={styles['wrap']}>
      <h1 className={styles['title']}>The Path</h1>
      <p>
        <Link to="/studio">At the piano: rhythm, technique, ear practice, and complete pieces</Link>
      </p>
      {sections.map(({ stage, nodes }) => {
        const real = nodes.filter((n) => n.unit);
        const passed = real.filter((n) => statuses.get(n.id) === 'passed').length;
        return (
          <section key={stage.id} className={styles['stage']}>
            <div className={styles['stageHeader']}>
              <div className={styles['stageText']}>
                <h2>
                  <span className={styles['stageNo']}>Stage {stage.ordinal}</span>
                  {stage.title}
                </h2>
                <p className={styles['tagline']}>{stage.tagline}</p>
                <p className={styles['summary']}>{stage.summary}</p>
                <ul>
                  {MUSIC_LESSONS.filter((s) => s.stage === stage.ordinal).map((s) => (
                    <li key={s.id}>
                      <Link to={`/studio/${s.id}`}>{s.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles['stageRing']}>
                <ProgressRing fraction={real.length ? passed / real.length : 0} />
                <span className={styles['stageCount']}>
                  {passed}/{real.length} units
                </span>
              </div>
            </div>
            <div className={styles['spine']}>
              {nodes.map((node, i) => {
                const status: NodeStatus = statuses.get(node.id) ?? 'locked';
                const row = progress.get(node.id);
                const isHere = node.id === hereId;
                return (
                  <button
                    key={node.id}
                    ref={isHere ? hereRef : undefined}
                    className={styles['node']}
                    // One node per row, alternating sides: the spine runs
                    // between the two columns and each node ties into it.
                    style={{ gridRow: i + 1 }}
                    data-side={i % 2 === 0 ? 'left' : 'right'}
                    data-status={status}
                    data-kind={node.kind}
                    data-flagged={row?.flagged ? 'true' : undefined}
                    disabled={status === 'locked'}
                    onClick={() => {
                      if (node.kind === 'review') {
                        void startWorkout().then((plan) => {
                          if (plan.blocks.length === 0) {
                            toast('Nothing due to review. Keep walking the path!');
                            return;
                          }
                          void navigate(`/drill/${plan.id}/0`);
                        });
                        return;
                      }
                      setSelected(node);
                    }}
                  >
                    <span className={styles['dot']}>
                      {status === 'passed' && <Icon name="check" size={15} weight="fill" />}
                      {status === 'locked' && <Icon name="locked" size={13} />}
                    </span>
                    <span className={styles['nodeBody']}>
                      <span className={styles['nodeTitle']}>
                        {node.title}
                        {row?.flagged && (
                          <span className={styles['flag']} title="Marked for extra review">
                            {' '}
                            *
                          </span>
                        )}
                      </span>
                      <span className={styles['nodeMeta']}>
                        {node.kind === 'checkpoint'
                          ? 'Checkpoint · '
                          : node.kind === 'review'
                            ? 'Review · '
                            : ''}
                        {node.minutes} min
                        {row && row.bestScore > 0 && status === 'passed' && (
                          <StarRating stars={starsFor(row.bestScore)} size={12} />
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className={styles['moreSoon']}>
        “The whole map”, Stage 5, is being written. The path grows from here.
      </p>

      {selected?.unit && (
        <Modal onClose={() => setSelected(null)}>
          <h2>{selected.title}</h2>
          <div className={styles['chips']}>
            {Object.keys(selected.unit.strandWeights).map((s) => (
              <span key={s} className={styles['strandChip']}>
                {STRAND_LABEL[s] ?? s}
              </span>
            ))}
            <span className={styles['strandChip']}>{selected.minutes} min</span>
          </div>
          {progress.get(selected.id)?.status === 'passed' && (
            <p>
              Best score: {Math.round((progress.get(selected.id)?.bestScore ?? 0) * 100)}%. Replay any time,
              your best stands.
            </p>
          )}
          <div className={styles['modalActions']}>
            <Button variant="primary" size="l" onClick={() => void navigate(`/lesson/${selected.id}`)}>
              {progress.get(selected.id)?.status === 'passed' ? 'Redo' : 'Start'}
            </Button>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Not now
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
