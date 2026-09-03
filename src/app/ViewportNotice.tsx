import { useEffect, useState } from 'react';
import styles from './AppShell.module.css';

/** Below this the keyboard can't show a usable range (05 §Empty/edge states). */
const MIN_WIDTH = 1024;

/**
 * A narrow window isn't a broken app, it's a window that needs widening — say
 * so, rather than letting the keyboard squash into something unplayable.
 */
export function ViewportNotice() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MIN_WIDTH - 1}px)`);
    const apply = (): void => setNarrow(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  if (!narrow) return null;
  return (
    <div className={styles['viewportNotice']} role="status" data-testid="viewport-notice">
      This window is too narrow for a full keyboard. Widen it to at least {MIN_WIDTH}px, a landscape tablet or
      a laptop screen is the smallest comfortable size.
    </div>
  );
}
