import { test, expect } from '@playwright/test';
import { completeLesson, seedOnboarded, seedPassedUnits } from './drive';

test.describe.configure({ mode: 'serial', timeout: 600_000 });

const STAGE0 = ['s0.u1', 's0.u2', 's0.u3', 's0.u4', 's0.u5', 's0.u6', 's0.cp'];

test('Stage 1 through s1.u5 plays end-to-end, ear exercises answered on the keyboard', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('heading', { name: 'The Path' })).toBeVisible();
  await seedPassedUnits(page, STAGE0);

  for (const unitId of ['s1.u1', 's1.u2', 's1.u3', 's1.u4', 's1.u5']) {
    await completeLesson(page, unitId);
  }

  const rows = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { unitProgress: { toArray(): Promise<{ unitId: string; status: string; bestScore: number }[]> } };
    };
    return mod.db.unitProgress.toArray();
  });
  for (const unitId of ['s1.u1', 's1.u2', 's1.u3', 's1.u4', 's1.u5']) {
    const row = rows.find((r) => r.unitId === unitId);
    expect(row?.status, unitId).toBe('passed');
    expect(row?.bestScore ?? 0, unitId).toBeGreaterThanOrEqual(0.8);
  }

  // s1.u3 introduced ear atoms; the atom store should now track them.
  const atoms = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { atomProgress: { toArray(): Promise<{ atomId: string }[]> } };
    };
    return (await mod.db.atomProgress.toArray()).map((a) => a.atomId);
  });
  expect(atoms).toContain('ear:degree:135');
  expect(atoms).toContain('scale:c:major:rh:1oct');
});

test('song library unlocks First Light after Stage 1 opens, and it plays in G', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/songs?midi=fake');
  await seedPassedUnits(page, STAGE0);
  await page.reload();
  const card = page.getByRole('button', { name: /First Light/ });
  await expect(card).toBeEnabled();
  await card.click();
  await expect(page).toHaveURL(/\/songs\/first-light/);

  await page.getByLabel('Key').selectOption('G');
  await page.getByRole('button', { name: 'Play the chart' }).click();
  await expect(page.getByText('Em').first()).toBeVisible(); // transposed chart rendered

  // Practice mode waits for each chord: play G major with G in the bass.
  await page.evaluate(() => {
    for (const m of [43, 55, 59, 62]) window.__fakeMidi?.pressNow(m);
  });
  await expect(page.locator('[data-state="done"]').first()).toBeVisible({ timeout: 5000 });
});
