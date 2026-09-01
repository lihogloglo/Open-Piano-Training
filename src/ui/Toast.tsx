import { createStore, useStore } from 'zustand';
import styles from './Toast.module.css';

export type ToastKind = 'info' | 'ok' | 'warn' | 'err';
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  item: ToastItem | null;
  leaving: boolean;
}

const toastStore = createStore<ToastState>(() => ({ item: null, leaving: false }));
let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let removeTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string, kind: ToastKind = 'info'): void {
  clearTimeout(hideTimer);
  clearTimeout(removeTimer);
  toastStore.setState({ item: { id: nextId++, message, kind }, leaving: false });
  hideTimer = setTimeout(() => {
    toastStore.setState({ leaving: true });
    removeTimer = setTimeout(() => toastStore.setState({ item: null, leaving: false }), 220);
  }, 3000);
}

export function ToastViewport() {
  const { item, leaving } = useStore(toastStore);

  if (!item) return null;
  return (
    <div className={styles['viewport']} role="status" aria-live="polite">
      <div
        className={`${styles['toast']} ${leaving ? styles['out'] : styles['in']}`}
        data-kind={item.kind}
        aria-hidden={leaving ? true : undefined}
      >
        {item.message}
      </div>
    </div>
  );
}
