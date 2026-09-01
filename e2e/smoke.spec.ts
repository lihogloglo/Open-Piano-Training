import { test, expect, type Page } from '@playwright/test';

test.use({ permissions: ['midi'] });

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

async function seedOnboarded(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Init scripts run on every navigation — never clobber what the app saved.
    const key = 'ks.settings.v1';
    const raw = localStorage.getItem(key);
    const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(key, JSON.stringify({ ...current, onboarded: true }));
  });
}

test('first run walks the onboarding wizard to Today', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?midi=fake');
  await expect(page).toHaveURL(/\/welcome/);
  await expect(page.getByRole('heading', { name: 'Keysense' })).toBeVisible();

  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Connect your keyboard' })).toBeVisible();
  await expect(page.getByText('Fake MIDI (test)')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Hear yourself' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Where do we begin?' })).toBeVisible();
  await page.getByRole('button', { name: 'Start from zero' }).click();

  await expect(page).toHaveURL(/\/practice/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('onboarded users land on Today directly', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/practice$/);
});

test('fake MIDI input lights the setup keyboard and is heard', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/setup?midi=fake');
  await expect(page.getByText('Fake MIDI (test)')).toBeVisible();
  await expect(page.getByText('Play any key')).toBeVisible();
  await page.evaluate(() => window.__fakeMidi?.pressNow(60));
  await expect(page.getByText('✓ We hear you!')).toBeVisible();
  await page.evaluate(() => window.__fakeMidi?.releaseAll());
});

test('MIDI status dot reflects the fake device', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/practice?midi=fake');
  await expect(page.getByText('Keyboard connected')).toBeVisible();
});

const screens: { path: string; heading: string }[] = [
  { path: '/practice', heading: 'Today' },
  { path: '/path', heading: 'Path' },
  { path: '/songs', heading: 'Songs' },
  { path: '/sandbox', heading: 'Sandbox' },
  { path: '/progress', heading: 'Progress' },
  { path: '/settings', heading: 'Settings' },
  { path: '/setup', heading: 'Setup' },
  { path: '/lesson/s0.u1', heading: 'Lesson player' },
];

for (const { path, heading } of screens) {
  test(`renders ${path} without console errors`, async ({ page }) => {
    const errors = collectErrors(page);
    await seedOnboarded(page);
    await page.goto(`${path}?midi=fake`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('theme toggle switches and persists', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/settings?midi=fake');
  // Wait for React to mount (the data-theme attribute is set pre-mount).
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');
});
