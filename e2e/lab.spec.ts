import { test, expect, type Page } from '@playwright/test';

async function seedOnboarded(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const key = 'ks.settings.v1';
    const raw = localStorage.getItem(key);
    const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(key, JSON.stringify({ ...current, onboarded: true }));
  });
}

test('lab: D major scale RH in wait mode, played perfectly via fake MIDI', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lab?midi=fake');
  await page.getByLabel('Tonic/root').selectOption('D');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByText('phase:')).toContainText('running');
  await page.getByRole('button', { name: 'Play perfectly (fake)' }).click();
  await expect(page.getByRole('heading', { name: /Result: score 100%/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: /passed/ })).toBeVisible();
});

test('lab: D major scale RH @80 BPM tempo mode, standard tier, perfect judgments', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lab?midi=fake');
  await page.getByLabel('Tonic/root').selectOption('D');
  await page.getByLabel('Mode').selectOption('tempo');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Play perfectly (fake)' }).click();
  // 4-beat count-in + 8 notes @80 BPM = ~9s
  await expect(page.getByRole('heading', { name: /Result: score 100%/ })).toBeVisible({ timeout: 25000 });
  const dump = await page.locator('pre').textContent();
  const parsed = JSON.parse(dump ?? '{}') as { judgments: { verdict: string }[] };
  expect(parsed.judgments).toHaveLength(8);
  for (const j of parsed.judgments) expect(j.verdict).toBe('perfect');
});

test('lab: wrong notes are judged wrong and do not advance wait mode', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lab?midi=fake');
  await page.getByLabel('Tonic/root').selectOption('C');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.evaluate(() => {
    window.__fakeMidi?.pressNow(61); // wrong: C major starts on 60
  });
  await expect(page.getByText('target:')).toContainText('1/8');
  await page.evaluate(() => {
    window.__fakeMidi?.release(61);
    window.__fakeMidi?.pressNow(60);
  });
  await expect(page.getByText('target:')).toContainText('2/8');
});
