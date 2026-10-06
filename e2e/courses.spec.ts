import { test, expect, type Page } from '@playwright/test';
import { seedOnboarded } from './drive';

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "F♯4" → 66: the staff's accessible label spells every note it draws. */
function midiOf(name: string): number {
  const m = /^([A-G])(♯|♭|#|b)?(-?\d)/.exec(name);
  if (!m) throw new Error(`Bad note label: ${name}`);
  const acc = m[2] === '♯' || m[2] === '#' ? 1 : m[2] === '♭' || m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + PC[m[1]!]! + acc;
}

async function press(page: Page, midi: number): Promise<void> {
  await page.evaluate((m) => window.__fakeMidi?.pressNow(m), midi);
  await page.waitForTimeout(120);
  await page.evaluate((m) => window.__fakeMidi?.release(m), midi);
  await page.waitForTimeout(80);
}

/** Read a staff's label ("Notation: C4, D4, E4") and play it. */
async function playStaff(page: Page, label: string): Promise<void> {
  const names = label
    .replace(/^[^:]*:\s*/, '')
    .split(', ')
    .filter(Boolean);
  for (const name of names) await press(page, midiOf(name.split('+')[0]!));
}

test('the studio lists the reading course with every lesson open', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/studio?midi=fake');
  await expect(page.getByRole('heading', { name: 'Read music' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Lesson 9:/ })).toHaveAttribute('href', '/lesson/rd.u9');
  await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible();
});

test('a reading lesson: name a wrong key, read the staff, and return to the studio', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lesson/rd.u1?midi=fake');

  // The staff card names a wrong key back instead of buzzing.
  const pending = page
    .locator('[class*="playCheck"]:not([data-done]):not([data-waiting]) [role=img]')
    .first();
  await expect(pending).toBeVisible();
  await press(page, 62);
  await expect(page.getByText('That’s D4. Look again.')).toBeVisible();

  // Answer each staff card from its own notation.
  for (let i = 0; i < 2; i++) {
    await expect(pending).toBeVisible();
    await playStaff(page, (await pending.getAttribute('aria-label')) ?? '');
  }
  await expect(page.locator('[class*="playCheck"][data-done]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Try it')).toBeVisible();

  // Practice: the staff is the only prompt; no list of note names gives it away.
  const practice = page.getByRole('img', { name: /^Notation:/ });
  await expect(practice).toBeVisible();
  await expect(page.getByRole('region', { name: 'Sequence to play' })).toHaveCount(0);
  await playStaff(page, (await practice.getAttribute('aria-label')) ?? '');

  // Check: wait mode needs no sound, so Start never waits for the download.
  await expect(page.getByText('Show it')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Start' }).click();
  const check = page.getByRole('img', { name: /^Notation:/ });
  await playStaff(page, (await check.getAttribute('aria-label')) ?? '');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.getByText('1/9')).toBeVisible();
  await expect(page.getByRole('button', { name: /Continue/ })).toBeVisible();
});
