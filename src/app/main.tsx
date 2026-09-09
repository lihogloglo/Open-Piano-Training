import { loadLanguage, resolveLocale } from '@/i18n';
import { readPreferences } from '@/progress/preferences';

// Configure translations before evaluating modules with static curriculum text.
const locale = resolveLocale(readPreferences().language, navigator.languages);
await loadLanguage(locale);
document.documentElement.lang = locale;
await import('./bootstrap');
