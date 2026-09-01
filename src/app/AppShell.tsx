import { NavLink, Outlet, Link } from 'react-router';
import { APP_NAME } from './brand';
import { Icon, type IconName } from '@/ui/Icon';
import { useSettingsStore } from '@/store/settingsStore';
import styles from './AppShell.module.css';

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

  return (
    <div className={styles['shell']}>
      <nav className={styles['sidebar']} data-expanded={expanded} aria-label="Main">
        <div className={styles['logo']}>
          <span className={styles['logoMark']} aria-hidden>
            ◆
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
            <span className={styles['dot']} data-status="none" />
            {expanded && <span className={styles['midiLabel']}>No keyboard</span>}
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
        <Outlet />
      </main>
    </div>
  );
}
