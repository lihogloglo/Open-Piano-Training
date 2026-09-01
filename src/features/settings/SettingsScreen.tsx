import { useSettingsStore, type ThemeSetting } from '@/store/settingsStore';
import { Card } from '@/ui/Card';
import styles from './SettingsScreen.module.css';

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export function SettingsScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div className={styles['wrap']}>
      <h1>Settings</h1>
      <Card>
        <h3>Appearance</h3>
        <div className={styles['row']}>
          <span>Theme</span>
          <div className={styles['segmented']} role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.value}
                role="radio"
                aria-checked={theme === t.value}
                data-selected={theme === t.value}
                onClick={() => setTheme(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
