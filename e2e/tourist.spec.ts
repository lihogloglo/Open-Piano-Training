import { test, expect, type Page } from '@playwright/test';
import { seedOnboarded } from './drive';

/**
 * Tourist mode (docs/decisions.md, 2026-09-07): every unit opens, every step
 * skips, and the visit is not recorded. The second half is the part worth a
 * test — a tourist must be able to walk a whole locked unit and leave the
 * progress database exactly as they found it.
 */

async function seedTourist(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const key = 'ks.settings.v1';
    const raw = localStorage.getItem(key);
    const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(key, JSON.stringify({ ...current, tourist: true }));
  });
}

/** Row counts for the three tables a lesson normally writes. */
async function progressCounts(page: Page): Promise<{ units: number; takes: number; resumes: number }> {
  return page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: {
        unitProgress: { count(): Promise<number> };
        takes: { count(): Promise<number> };
        meta: { where(k: string): { startsWith(p: string): { count(): Promise<number> } } };
      };
    };
    return {
      units: await mod.db.unitProgress.count(),
      takes: await mod.db.takes.count(),
      resumes: await mod.db.meta.where('key').startsWith('lessonResume:').count(),
    };
  });
}

test('a tourist opens a locked unit, skips every step, and records nothing', async ({ page }) => {
  await seedOnboarded(page);
  await seedTourist(page);
  await page.goto('/path?midi=fake');

  await expect(page.getByTestId('tourist-banner')).toBeVisible();

  // s3.u1 needs the Stage 2 checkpoint. Nothing is passed here, so it is locked.
  const locked = page.getByRole('button', { name: /Seven chords hiding in every scale/ });
  await locked.click();
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page).toHaveURL(/\/lesson\/s3\.u1/);
  await expect(page.getByTestId('tourist-notice')).toBeVisible();

  // Jump to the last step, then skip out of it: the unit ends and the path
  // takes the tourist back with nothing marked.
  const jump = page.getByLabel('Jump to step');
  const stepCount = await jump.locator('option').count();
  expect(stepCount).toBeGreaterThan(1);
  await jump.selectOption({ index: stepCount - 1 });
  await expect(page.getByText(`${stepCount}/${stepCount}`)).toBeVisible();

  await page.getByRole('button', { name: 'Skip this step' }).click();
  await expect(page).toHaveURL(/\/path/);

  expect(await progressCounts(page)).toEqual({ units: 0, takes: 0, resumes: 0 });
});

test('the Settings switch opens the locks and puts them back', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/settings?midi=fake');
  const group = page.getByRole('radiogroup', { name: 'Tourist mode' });
  const locked = page.getByRole('button', { name: /Seven chords hiding in every scale/ });

  await group.getByRole('radio', { name: 'On' }).click();
  await expect(page.getByTestId('tourist-banner')).toBeVisible();
  await page.goto('/path?midi=fake');
  await expect(locked).toBeEnabled();

  await page.goto('/settings?midi=fake');
  await group.getByRole('radio', { name: 'Off' }).click();
  await expect(page.getByTestId('tourist-banner')).toBeHidden();
  await page.goto('/path?midi=fake');
  await expect(locked).toBeDisabled();
});
