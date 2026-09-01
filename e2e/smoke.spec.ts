import { test, expect, type Page } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

test('first run redirects to welcome and onboarding lands on Today', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { name: 'Keysense' })).toBeVisible();
  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('onboarded users land on Today directly', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.goto('/');
  await expect(page).toHaveURL(/\/practice$/);
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
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('theme toggle switches and persists', async ({ page }) => {
  await page.goto('/settings');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');
});
