import { useEffect, useState } from 'react';
import styles from './AppShell.module.css';

/**
 * Offline notice (05 §Empty/edge states). Keysense works offline once its
 * assets are cached, so this is information, not an error — the copy says so.
 */
export function ConnectionBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = (): void => setOnline(true);
    const goOffline = (): void => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;
  return (
    <div className={styles['offlineBanner']} role="status" data-testid="offline-banner">
      Offline — everything still works. New piano samples will wait for the network.
    </div>
  );
}
