import styles from './Placeholder.module.css';

export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className={styles['wrap']}>
      <h1>{title}</h1>
      <p className={styles['note']}>{note}</p>
    </div>
  );
}
