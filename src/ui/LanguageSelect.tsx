import styles from './LanguageSelect.module.css';
import { getLocale, languages, tr, type LanguageSetting } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';

/** Changing language reloads the app so static lesson and exercise data agree. */
export function LanguageSelect() {
  const language = useSettingsStore((s) => s.language);
  return (
    <label className={styles['field']}>
      {tr('Language')}{' '}
      <select
        value={language}
        onChange={(e) => {
          useSettingsStore.getState().setLanguage(e.target.value as LanguageSetting);
          window.location.reload();
        }}
      >
        <option value="system">
          {tr('System language')} ({languages.find((l) => l.code === getLocale())?.name})
        </option>
        {languages.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
