import { test, expect } from '@playwright/test';
import { driveLesson, seedOnboarded } from './drive';

test.describe.configure({ mode: 'serial', timeout: 600_000 });

test('a fresh profile completes all of Stage 0 with fake MIDI', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('heading', { name: 'The Path' })).toBeVisible();

  const unitIds = ['s0.u1', 's0.u2', 's0.u3', 's0.u4', 's0.u5', 's0.u6', 's0.cp'];
  for (const unitId of unitIds) {
    // The next unit's node should be clickable; open its intro card and start.
    await page.goto(`/lesson/${unitId}?midi=fake`);
    await expect(page).toHaveURL(new RegExp(`/lesson/${unitId.replace('.', '\\.')}`));
    await driveLesson(page);
    await expect(page).toHaveURL(/\/path/);
  }

  // Assert persisted progress in Dexie.
  const rows = await page.evaluate(async () => {
    // Vite dev-serves source modules by URL; keep the specifier opaque to tsc.
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { unitProgress: { toArray(): Promise<{ unitId: string; status: string; bestScore: number }[]> } };
    };
    return mod.db.unitProgress.toArray();
  });
  for (const unitId of unitIds) {
    const row = rows.find((r) => r.unitId === unitId);
    expect(row?.status, unitId).toBe('passed');
    expect(row?.bestScore ?? 0, unitId).toBeGreaterThanOrEqual(0.8);
  }

  // The path shows Stage 0 complete and review nodes exist.
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('button', { name: /Checkpoint: Bearings/ })).toBeVisible();
  const reviewNodes = page.getByRole('button', { name: /^Review/ });
  await expect(reviewNodes.first()).toBeVisible();
});
