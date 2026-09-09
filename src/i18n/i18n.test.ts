import { afterEach, describe, expect, it, vi } from 'vitest';
import en from './locales/en.json';
import fr from './locales/fr.json';
import { loadLanguage, plural, resolveLocale, sourceText, tr } from './index';
import { preferencesSchema } from '@/progress/preferences';

afterEach(async () => {
  await loadLanguage('en');
});
describe('translations', () => {
  it('covers every English message and preserves placeholders', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(fr)) {
      expect(value.trim(), key).not.toBe('');
      expect(value.match(/\{\w+\}/g)?.sort() ?? [], key).toEqual(key.match(/\{\w+\}/g)?.sort() ?? []);
    }
  });
  it('resolves saved choices, regional locales and unsupported languages', () => {
    expect(resolveLocale('en', ['fr-FR'])).toBe('en');
    expect(resolveLocale('system', ['fr-CA', 'en-US'])).toBe('fr');
    expect(resolveLocale(undefined, ['de-DE', 'fr-BE'])).toBe('fr');
    expect(resolveLocale('xx', ['fr'])).toBe('en');
    expect(resolveLocale('FR_fr')).toBe('fr');
  });
  it('falls back to English and interpolates text without interpreting HTML', async () => {
    await loadLanguage('fr');
    expect(tr('Settings')).toBe('Paramètres');
    expect(tr('constructor')).toBe('constructor');
    expect(sourceText(tr('Morning Steps'))).toBe('Morning Steps');
    expect(tr('Step {v0} of {v1}', { v0: 1.5, v1: 4 })).toBe('Étape 1,5 sur 4');
    expect(plural({ one: '{count} day streak', other: '{count} days streak' }, 0)).toBe('Série de 0 jour');
    expect(plural({ one: '{count} day streak', other: '{count} days streak' }, 2)).toBe('Série de 2 jours');
    expect(tr('Unknown message {name}', { name: '<b>test</b>' })).toBe('Unknown message <b>test</b>');
    expect(tr('Step {v0} of {v1}', { v0: 2, v1: 4 })).toBe('Étape 2 sur 4');
    await loadLanguage('en');
    expect(tr('Settings')).toBe('Settings');
  });
  it('accepts old preferences and backs up the language setting', () => {
    expect(preferencesSchema.parse({ theme: 'light' })).toEqual({ theme: 'light' });
    expect(preferencesSchema.parse({ language: 'fr' })).toEqual({ language: 'fr' });
  });
  it('loads every French lesson and generates its exercises with valid musical data', async () => {
    vi.resetModules();
    const englishContent = await import('@/curriculum/content');
    const englishEngine = await import('@/engine/generators');
    const mechanics = (instance: unknown) =>
      JSON.parse(
        JSON.stringify(instance, (key, value: unknown) =>
          ['prompt', 'title', 'label', 'songTitle', 'songCredit'].includes(key) ? undefined : value,
        ),
      );
    const expected = englishContent.CURRICULUM.units.flatMap((unit) =>
      unit.steps.flatMap((step) =>
        'exercise' in step && step.exercise ? [mechanics(englishEngine.generate(step.exercise, 42))] : [],
      ),
    );
    vi.resetModules();
    const i18n = await import('./index');
    await i18n.loadLanguage('fr');
    const { CURRICULUM } = await import('@/curriculum/content');
    const { generate } = await import('@/engine/generators');
    const { MUSIC_LESSONS, PIECES } = await import('@/curriculum/content/musicianship');
    expect(CURRICULUM.stages).toHaveLength(8);
    expect(CURRICULUM.units[0]?.title).toBe('Découvrez le clavier');
    for (const unit of CURRICULUM.units)
      for (const step of unit.steps) {
        if ('exercise' in step && step.exercise)
          expect(() => generate(step.exercise!, 42), unit.id).not.toThrow();
      }
    const actual = CURRICULUM.units.flatMap((unit) =>
      unit.steps.flatMap((step) =>
        'exercise' in step && step.exercise ? [mechanics(generate(step.exercise, 42))] : [],
      ),
    );
    expect(actual).toEqual(expected);
    const { buildSession } = await import('@/progress/sessionBuilder');
    const plan = buildSession({
      date: '2026-09-06',
      now: new Date('2026-09-06'),
      dailyMinutes: 20,
      next: null,
      stageOrdinal: 0,
      atomStates: [],
      learnedUnitIds: ['s0.u1'],
    });
    const creative = plan.blocks.find((block) => block.kind === 'create');
    expect(creative?.title).toBe('Meet the keyboard');
    expect(creative?.basePrompt).toContain('Press Play backing');
    expect(MUSIC_LESSONS.length).toBeGreaterThan(0);
    expect(PIECES.length).toBeGreaterThan(0);
    await i18n.loadLanguage('en');
    vi.resetModules();
  });
});
