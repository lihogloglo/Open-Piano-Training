import { test, expect } from '@playwright/test';

for (const language of ['en', 'fr']) {
  test(`full license notices are reachable in ${language}`, async ({ page }) => {
    await page.addInitScript((language) => {
      localStorage.setItem('ks.settings.v1', JSON.stringify({ onboarded: true, language }));
    }, language);
    await page.goto('/licenses?midi=fake');
    await page.getByRole('link', { name: /Read full license|Lire les licences/ }).click();
    await expect(page).toHaveURL(/\/THIRD-PARTY-NOTICES\.html$/);
    await expect(
      page.getByRole('heading', { name: 'Open Piano Training', exact: true }),
    ).toBeVisible();
    const notices = await page.locator('body').innerText();
    for (const text of [
      'SIL OPEN FONT LICENSE',
      'Apache License',
      'idb 7.1.1 (ISC)',
      'dexie 4.4.5 (Apache-2.0) / NOTICE',
      'Steinberg Media Technologies',
      'Simon Tatham',
      'Public domain, according to the upstream distributors',
    ])
      expect(notices).toContain(text);
    await page.getByRole('link', { name: /Back to credits/ }).click();
    await expect(page).toHaveURL(/\/licenses$/);
    await expect(page.getByRole('link', { name: /Read full license|Lire les licences/ })).toBeVisible();
  });
}
