import { Link } from 'react-router';
import { useSettingsStore } from '@/store/settingsStore';
import styles from './AppShell.module.css';

/**
 * Tourist mode is easy to forget you turned on, and an hour of practice that
 * counts for nothing is a bad surprise. Every screen in the shell says so.
 */
export function TouristBanner() {
  const tourist = useSettingsStore((s) => s.tourist);
  if (!tourist) return null;
  return (
    <div className={styles['offlineBanner']} role="status" data-testid="tourist-banner">
      Tourist mode. Every unit is open, and nothing you do is recorded.{' '}
      <Link to="/settings">Turn it off in Settings</Link>
    </div>
  );
}
