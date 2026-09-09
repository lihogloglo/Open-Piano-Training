import { LanguageSelect } from '@/ui/LanguageSelect';
import { tr } from '@/i18n';
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
  { value: 'dark', label: tr('Dark') },
  { value: 'light', label: tr('Light') },
  { value: 'system', label: tr('System') },
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
    toast(tr('Progress exported'), 'ok');
  };

  const doImport = async (file: File) => {
    try {
      await importAll(await file.text());
      const preferences = JSON.parse(localStorage.getItem('ks.settings.v1') ?? '{}');
      const previousLanguage = useSettingsStore.getState().language;
      useSettingsStore.setState(preferences);
      if (previousLanguage !== useSettingsStore.getState().language) window.location.reload();
      toast(tr('Progress and preferences imported. Welcome back'), 'ok');
    } catch (err) {
      toast(err instanceof Error ? err.message : tr('Import failed'), 'err');
    }
  };

  const doWipe = async () => {
    if (!wipeArmed) {
      setWipeArmed(true);
      setTimeout(() => setWipeArmed(false), 4000);
      return;
    }
    await Promise.all(db.tables.map((t) => t.clear()));
    toast(tr('All progress wiped'), 'warn');
    setWipeArmed(false);
  };

  return (
    <div className={styles['wrap']}>
      <h1>{tr('Settings')}</h1>
      <Card>
        <LanguageSelect />
        <p className={styles['note']}>{tr('Changing language reloads the app. Your progress is saved.')}</p>
      </Card>

      <Card>
        <h3>{tr('Practice')}</h3>
        <label className={styles['settingLabel']}>
          <input
            type="checkbox"
            checked={largePractice}
            onChange={(e) => useSettingsStore.setState({ largePractice: e.target.checked })}
          />{' '}
          {tr('Larger practice display')}
        </label>
        <label className={styles['settingLabel']}>
          {tr('Creative focus')}{' '}
          <select
            value={creativeFocus}
            onChange={(e) =>
              useSettingsStore.setState({ creativeFocus: e.target.value as 'melody' | 'rhythm' | 'harmony' })
            }
          >
            <option value="melody">{tr('Melody')}</option>
            <option value="rhythm">{tr('Rhythm')}</option>
            <option value="harmony">{tr('Harmony')}</option>
          </select>
        </label>
        <div className={styles['row']}>
          <span>{tr('Daily goal')}</span>
          <div className={styles['segmented']} role="radiogroup" aria-label={tr('Daily goal')}>
            {GOALS.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={dailyMinutes === g}
                data-selected={dailyMinutes === g}
                onClick={() => setDailyMinutes(g)}
              >
                {g}
                {tr(' min')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h3>{tr('Sound')}</h3>
        <div className={styles['row']}>
          <span>{tr('App piano sound')}</span>
          <div className={styles['segmented']} role="radiogroup" aria-label={tr('App piano sound')}>
            <button
              role="radio"
              aria-checked={audioEnabled}
              data-selected={audioEnabled}
              onClick={() => setAudioEnabled(true)}
            >
              {tr('On')}
            </button>
            <button
              role="radio"
              aria-checked={!audioEnabled}
              data-selected={!audioEnabled}
              onClick={() => setAudioEnabled(false)}
            >
              {tr("My piano's own")}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>{tr('Timing calibration')}</h3>
        <CalibrationPanel />
      </Card>

      <Card>
        <h3>{tr('Appearance')}</h3>
        <div className={styles['row']}>
          <span>{tr('Theme')}</span>
          <div className={styles['segmented']} role="radiogroup" aria-label={tr('Theme')}>
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
          <span>{tr('Reduce motion')}</span>
          <div className={styles['segmented']} role="radiogroup" aria-label={tr('Reduce motion')}>
            <button
              role="radio"
              aria-checked={reducedMotion}
              data-selected={reducedMotion}
              onClick={() => setReducedMotion(true)}
            >
              {tr('On')}
            </button>
            <button
              role="radio"
              aria-checked={!reducedMotion}
              data-selected={!reducedMotion}
              onClick={() => setReducedMotion(false)}
            >
              {tr('Follow system')}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>{tr('Reading music')}</h3>
        <p className={styles['note']}>
          {APP_NAME}
          {tr(
            ' teaches the keyboard by ear and by symbol, not from the page. The reading strand is a separate, optional track: short generated phrases on a staff, plus its own rating. Turn it on whenever you want it, and nothing else changes.',
          )}
        </p>
        <div className={styles['row']}>
          <span>{tr('Reading strand')}</span>
          <div className={styles['segmented']} role="radiogroup" aria-label={tr('Reading strand')}>
            <button
              role="radio"
              aria-checked={readStrandEnabled}
              data-selected={readStrandEnabled}
              onClick={() => {
                setReadStrandEnabled(true);
                void syncReadStrand(true).then(() => toast(tr('Reading strand on'), 'ok'));
              }}
            >
              {tr('On')}
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
              {tr('Off')}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>{tr('Tourist mode')}</h3>
        <p className={styles['note']}>
          {tr(
            'Tourist mode opens the whole path. Every unit is unlocked, and you can skip a step or jump to any step of a lesson. In exchange, the visit does not count: no unit is passed, no take is saved, no review is scheduled, and no practice minutes are added. Turn it off to go back to your real path, which stands exactly where you left it.',
          )}
        </p>
        <div className={styles['row']}>
          <span>{tr('Tourist mode')}</span>
          <div className={styles['segmented']} role="radiogroup" aria-label={tr('Tourist mode')}>
            <button
              role="radio"
              aria-checked={tourist}
              data-selected={tourist}
              onClick={() => {
                setTourist(true);
                toast(tr('Tourist mode on. Nothing you do now is recorded.'), 'warn');
              }}
            >
              {tr('On')}
            </button>
            <button
              role="radio"
              aria-checked={!tourist}
              data-selected={!tourist}
              onClick={() => {
                setTourist(false);
                toast(tr('Tourist mode off. Your progress is being recorded again.'), 'ok');
              }}
            >
              {tr('Off')}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3>{tr('Data')}</h3>
        <p className={styles['note']}>
          {tr('Everything you do in ')}
          {APP_NAME}
          {tr(' lives on this device. Export a backup before switching machines.')}
        </p>
        <div className={styles['dataRow']}>
          <Button onClick={() => void doExport()}>{tr('Export progress')}</Button>
          <Button onClick={() => fileRef.current?.click()}>{tr('Import…')}</Button>
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
            {wipeArmed ? tr('Really wipe everything?') : tr('Wipe all progress')}
          </Button>
        </div>
      </Card>

      <Card>
        <h3>{tr('About')}</h3>
        <p className={styles['note']}>
          {APP_NAME}. {APP_TAGLINE}
          {tr(' Works offline once loaded; nothing you play leaves this device.')}
        </p>
        <div className={styles['dataRow']}>
          <Button onClick={() => void navigate('/licenses')}>{tr('Licenses & credits')}</Button>
        </div>
      </Card>
    </div>
  );
}
