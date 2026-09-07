import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSettingsStore, type ThemeSetting } from '@/store/settingsStore';
import { exportAll, importAll, db } from '@/progress/db';
import { syncReadStrand } from '@/progress/service';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { toast } from '@/ui/Toast';
import { APP_NAME, APP_TAGLINE } from '@/app/brand';
import { CalibrationPanel } from './CalibrationPanel';
import styles from './SettingsScreen.module.css';

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

const GOALS = [10, 15, 20, 30];

export function SettingsScreen() {
  const navigate = useNavigate();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const dailyMinutes = useSettingsStore((s) => s.dailyMinutes);
  const largePractice = useSettingsStore((s) => s.largePractice);
  const creativeFocus = useSettingsStore((s) => s.creativeFocus);
  const audioEnabled = useSettingsStore((s) => s.audioEnabled);
  const setAudioEnabled = useSettingsStore((s) => s.setAudioEnabled);
  const readStrandEnabled = useSettingsStore((s) => s.readStrandEnabled);
  const setReadStrandEnabled = useSettingsStore((s) => s.setReadStrandEnabled);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);
  const tourist = useSettingsStore((s) => s.tourist);
  const setTourist = useSettingsStore((s) => s.setTourist);
  const fileRef = useRef<HTMLInputElement>(null);
  const [wipeArmed, setWipeArmed] = useState(false);

  const setDailyMinutes = (m: number) => useSettingsStore.setState({ dailyMinutes: m });

  const doExport = async () => {
    const json = await exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keysense-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Progress exported', 'ok');
  };

  const doImport = async (file: File) => {
    try {
      await importAll(await file.text());
      const preferences = JSON.parse(localStorage.getItem('ks.settings.v1') ?? '{}');
      useSettingsStore.setState(preferences);
      toast('Progress and preferences imported. Welcome back', 'ok');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed', 'err');
    }
  };

  const doWipe = async () => {
    if (!wipeArmed) {
      setWipeArmed(true);
      setTimeout(() => setWipeArmed(false), 4000);
      return;
    }
    await Promise.all(db.tables.map((t) => t.clear()));
    toast('All progress wiped', 'warn');
    setWipeArmed(false);
  };

  return (
    <div className={styles['wrap']}>
      <h1>Settings</h1>

      <Card>
        <h3>Practice</h3>
        <label>
          <input
            type="checkbox"
            checked={largePractice}
            onChange={(e) => useSettingsStore.setState({ largePractice: e.target.checked })}
          />{' '}
          Larger practice display
        </label>
        <label>
          Creative focus{' '}
          <select
            value={creativeFocus}
            onChange={(e) =>
              useSettingsStore.setState({ creativeFocus: e.target.value as 'melody' | 'rhythm' | 'harmony' })
            }
          >
            <option value="melody">Melody</option>
            <option value="rhythm">Rhythm</option>
            <option value="harmony">Harmony</option>
          </select>
        </label>
        <div className={styles['row']}>
          <span>Daily goal</span>
          <div className={styles['segmented']} role="radiogroup" aria-label="Daily goal">
            {GOALS.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={dailyMinutes === g}
                data-selected={dailyMinutes === g}
                onClick={() => setDailyMinutes(g)}
              >
                {g} min
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h3>Sound</h3>
        <div className={styles['row']}>
          <span>App piano sound</span>
          <div className={styles['segmented']} role="radiogroup" aria-label="App piano sound">
            <button
              role="radio"
              aria-checked={audioEnabled}
              data-selected={audioEnabled}
              onClick={() => setAudioEnabled(true)}
            >
              On
            </button>
            <button
              role="radio"
              aria-checked={!audioEnabled}
              data-selected={!audioEnabled}
              onClick={() => setAudioEnabled(false)}
            >
              My piano's own
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>Timing calibration</h3>
        <CalibrationPanel />
      </Card>

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
        <div className={styles['row']}>
          <span>Reduce motion</span>
          <div className={styles['segmented']} role="radiogroup" aria-label="Reduce motion">
            <button
              role="radio"
              aria-checked={reducedMotion}
              data-selected={reducedMotion}
              onClick={() => setReducedMotion(true)}
            >
              On
            </button>
            <button
              role="radio"
              aria-checked={!reducedMotion}
              data-selected={!reducedMotion}
              onClick={() => setReducedMotion(false)}
            >
              Follow system
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>Reading music</h3>
        <p className={styles['note']}>
          {APP_NAME} teaches the keyboard by ear and by symbol, not from the page. The reading strand is a
          separate, optional track: short generated phrases on a staff, plus its own rating. Turn it on
          whenever you want it, and nothing else changes.
        </p>
        <div className={styles['row']}>
          <span>Reading strand</span>
          <div className={styles['segmented']} role="radiogroup" aria-label="Reading strand">
            <button
              role="radio"
              aria-checked={readStrandEnabled}
              data-selected={readStrandEnabled}
              onClick={() => {
                setReadStrandEnabled(true);
                void syncReadStrand(true).then(() => toast('Reading strand on', 'ok'));
              }}
            >
              On
            </button>
            <button
              role="radio"
              aria-checked={!readStrandEnabled}
              data-selected={!readStrandEnabled}
              onClick={() => {
                setReadStrandEnabled(false);
                void syncReadStrand(false);
              }}
            >
              Off
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>Tourist mode</h3>
        <p className={styles['note']}>
          Tourist mode opens the whole path. Every unit is unlocked, and you can skip a step or jump to any
          step of a lesson. In exchange, the visit does not count: no unit is passed, no take is saved, no
          review is scheduled, and no practice minutes are added. Turn it off to go back to your real path,
          which stands exactly where you left it.
        </p>
        <div className={styles['row']}>
          <span>Tourist mode</span>
          <div className={styles['segmented']} role="radiogroup" aria-label="Tourist mode">
            <button
              role="radio"
              aria-checked={tourist}
              data-selected={tourist}
              onClick={() => {
                setTourist(true);
                toast('Tourist mode on. Nothing you do now is recorded.', 'warn');
              }}
            >
              On
            </button>
            <button
              role="radio"
              aria-checked={!tourist}
              data-selected={!tourist}
              onClick={() => {
                setTourist(false);
                toast('Tourist mode off. Your progress is being recorded again.', 'ok');
              }}
            >
              Off
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>Data</h3>
        <p className={styles['note']}>
          Everything you do in {APP_NAME} lives on this device. Export a backup before switching machines.
        </p>
        <div className={styles['dataRow']}>
          <Button onClick={() => void doExport()}>Export progress</Button>
          <Button onClick={() => fileRef.current?.click()}>Import…</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = '';
            }}
          />
          <Button variant="ghost" onClick={() => void doWipe()}>
            {wipeArmed ? 'Really wipe everything?' : 'Wipe all progress'}
          </Button>
        </div>
      </Card>

      <Card>
        <h3>About</h3>
        <p className={styles['note']}>
          {APP_NAME}. {APP_TAGLINE} Works offline once loaded; nothing you play leaves this device.
        </p>
        <div className={styles['dataRow']}>
          <Button onClick={() => void navigate('/licenses')}>Licenses &amp; credits</Button>
        </div>
      </Card>
    </div>
  );
}
