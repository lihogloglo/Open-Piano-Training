import { NavLink, Outlet, Link } from 'react-router';
import { APP_NAME } from './brand';
import { Icon, type IconName } from '@/ui/Icon';
import { useSettingsStore } from '@/store/settingsStore';
import { useMidiStore, type MidiStatus } from '@/store/midiStore';
import { ConnectionBanner } from './ConnectionBanner';
import { ViewportNotice } from './ViewportNotice';
import styles from './AppShell.module.css';

const DOT_STATUS: Partial<Record<MidiStatus, { dot: string; label: string }>> = {
  connected: { dot: 'connected', label: 'Keyboard connected' },
  'no-device': { dot: 'none', label: 'No keyboard' },
  unsupported: { dot: 'unsupported', label: 'MIDI unsupported' },
  denied: { dot: 'unsupported', label: 'MIDI blocked' },
};

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/practice', label: 'Today', icon: 'today' },
  { to: '/path', label: 'Path', icon: 'path' },
  { to: '/songs', label: 'Songs', icon: 'songs' },
  { to: '/sandbox', label: 'Sandbox', icon: 'sandbox' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
];

export function AppShell() {
  const expanded = useSettingsStore((s) => s.sidebarExpanded);
  const setExpanded = useSettingsStore((s) => s.setSidebarExpanded);
  const midiStatus = useMidiStore((s) => s.status);

  const dot = DOT_STATUS[midiStatus] ?? { dot: 'none', label: 'No keyboard' };

  return (
    <div className={styles['shell']}>
      <nav className={styles['sidebar']} data-expanded={expanded} aria-label="Main">
        <div className={styles['logo']}>
          <span className={styles['logoMark']}>
            <Icon name="keys" size={22} weight="fill" />
          </span>
          {expanded && <span className={styles['logoText']}>{APP_NAME}</span>}
        </div>
        <div className={styles['navList']}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles['navItem']} ${isActive ? styles['active'] : ''}`}
              title={expanded ? undefined : item.label}
            >
              <Icon name={item.icon} />
              {expanded && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
        <div className={styles['bottom']}>
          <NavLink
            to="/settings"
            className={({ isActive }) => `${styles['navItem']} ${isActive ? styles['active'] : ''}`}
            title={expanded ? undefined : 'Settings'}
          >
            <Icon name="settings" />
            {expanded && <span>Settings</span>}
          </NavLink>
          <Link to="/setup" className={styles['midiStatus']} title="MIDI setup">
            <span className={styles['dot']} data-status={dot.dot} />
            {expanded && <span className={styles['midiLabel']}>{dot.label}</span>}
          </Link>
          <button
            className={styles['collapse']}
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Icon name={expanded ? 'chevronLeft' : 'chevronRight'} />
          </button>
        </div>
      </nav>
      <main className={styles['main']}>
        <ViewportNotice />
        <ConnectionBanner />
        <Outlet />
      </main>
    </div>
  );
}
