/** Register a language here, then provide its catalog in locales/. */
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
] as const;
export type Locale = (typeof languages)[number]['code'];
export type LanguageSetting = Locale | 'system';
export type Catalog = Readonly<Record<string, string>>;
const loaders: Record<Locale, () => Promise<Catalog>> = {
  en: async () => ({}),
  fr: async () => (await import('./locales/fr.json')).default,
};
let locale: Locale = 'en';
let catalog: Catalog = {};
let sourceMessages = new Map<string, string>();

export function resolveLocale(
  preference: string | undefined,
  browserLanguages: readonly string[] = [],
): Locale {
  const candidates = preference && preference !== 'system' ? [preference] : browserLanguages;
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().replace(/_/g, '-').split('-')[0];
    const language = languages.find((entry) => entry.code === base);
    if (language) return language.code;
  }
  return 'en';
}

/** Call before importing curriculum and UI modules, which contain static labels. */
export async function loadLanguage(next: Locale): Promise<void> {
  catalog = await loaders[next]();
  sourceMessages = new Map(Object.entries(catalog).map(([source, translated]) => [translated, source]));
  locale = next;
}
export function getLocale(): Locale {
  return locale;
}

function lookup(message: string): string {
  return Object.hasOwn(catalog, message) && catalog[message] ? catalog[message]! : message;
}

/** English source messages are keys and fallbacks. Values are text, never HTML. */
export function tr(message: string, values: Record<string, string | number | undefined> = {}): string {
  const translated = lookup(message);
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined
      ? match
      : typeof value === 'number'
        ? new Intl.NumberFormat(locale).format(value)
        : lookup(value);
  });
}

/** Store source text so language changes do not split performance records. */
export function sourceText(text: string): string {
  return sourceMessages.get(text) ?? text;
}

/** Whole-sentence plural forms, selected with the active locale's rules. */
export function plural(
  forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string },
  count: number,
  values: Record<string, string | number> = {},
): string {
  const category = new Intl.PluralRules(locale).select(count);
  return tr(forms[category] ?? forms.other, { ...values, count });
}
