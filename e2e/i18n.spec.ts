import { test, expect } from '@playwright/test';

test('uses French browser locale for first launch and saves an explicit choice', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'fr-CA' });
  const page = await context.newPage();
  await page.goto('/welcome?midi=fake');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible();
  await page.getByRole('combobox').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await context.close();
});

test('changes language without losing preferences or lesson progress', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('ks.settings.v1'))
      localStorage.setItem(
        'ks.settings.v1',
        JSON.stringify({
          onboarded: true,
          language: 'en',
          dailyMinutes: 30,
          theme: 'light',
          tourist: true,
        }),
      );
  });
  await page.goto('/lesson/s0.u1?midi=fake');
  await expect(page.getByText('Meet the keyboard', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('keysense');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('unitProgress', 'readwrite');
        transaction.objectStore('unitProgress').put({ unitId: 's0.u1', status: 'passed', bestScore: 0.95 });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error);
        };
      };
    });
  });
  await page.goto('/settings?midi=fake');
  await page.getByRole('combobox', { name: /Language/ }).selectOption('fr');
  await expect(page.getByRole('heading', { name: 'Paramètres', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ks.settings.v1')!))).toMatchObject({
    language: 'fr',
    dailyMinutes: 30,
    onboarded: true,
    tourist: true,
  });
  const progress = await page.evaluate(
    async () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open('keysense');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('unitProgress');
          const row = transaction.objectStore('unitProgress').get('s0.u1');
          row.onsuccess = () => resolve(row.result);
          row.onerror = () => reject(row.error);
          transaction.oncomplete = () => database.close();
        };
      }),
  );
  expect(progress).toMatchObject({ unitId: 's0.u1', status: 'passed', bestScore: 0.95 });
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.screenshot({ path: 'test-results/french-settings.png', fullPage: true });
  await page.goto('/lesson/s0.u1?midi=fake');
  await expect(page.getByText('Découvrez le clavier', { exact: true })).toBeVisible();
  await expect(page.getByText(/Quatre-vingt-huit touches/)).toBeVisible();
  await page.screenshot({ path: 'test-results/french-lesson.png', fullPage: true });
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
  await expect(page.getByText('Trouvez les notes', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jouez un C', exact: true })).toBeVisible();
  await page.goto('/settings?midi=fake');
  await page.getByRole('combobox', { name: /Langue/ }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
});

test('French routes render without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      'ks.settings.v1',
      JSON.stringify({ onboarded: true, language: 'fr', tourist: true }),
    );
  });
  for (const route of [
    '/practice',
    '/path',
    '/songs',
    '/sandbox',
    '/progress',
    '/studio',
    '/setup',
    '/settings',
    '/licenses',
  ]) {
    await page.goto(route + '?midi=fake');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading').first()).toBeVisible();
    expect(errors, route).toEqual([]);
  }
});
