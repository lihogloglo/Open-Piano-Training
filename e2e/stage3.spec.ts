import { test, expect } from '@playwright/test';
import { completeLesson, seedOnboarded, seedPassedUnits } from './drive';

test.describe.configure({ mode: 'serial', timeout: 600_000 });

const THROUGH_STAGE2 = [
  ...['s0.u1', 's0.u2', 's0.u3', 's0.u4', 's0.u5', 's0.u6', 's0.cp'],
  ...['s1.u1', 's1.u2', 's1.u3', 's1.u4', 's1.u5', 's1.u6', 's1.u7', 's1.cp'],
  ...['s2.u1', 's2.u2', 's2.u3', 's2.u4', 's2.u5', 's2.u6', 's2.u7', 's2.cp'],
];

test('harmonization unit (s3.u6) accepts alternative chords end-to-end', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('heading', { name: 'The Path' })).toBeVisible();
  await seedPassedUnits(page, [...THROUGH_STAGE2, 's3.u1', 's3.u2', 's3.u3', 's3.u4', 's3.u5']);

  await completeLesson(page, 's3.u6');

  const row = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { unitProgress: { get(id: string): Promise<{ status: string; bestScore: number } | undefined> } };
    };
    return mod.db.unitProgress.get('s3.u6');
  });
  expect(row?.status).toBe('passed');
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.8);
});

test('smooth voice-led progression (s4.u3) scores a clean vl take', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('heading', { name: 'The Path' })).toBeVisible();
  await seedPassedUnits(page, [
    ...THROUGH_STAGE2,
    's3.u1',
    's3.u2',
    's3.u3',
    's3.u4',
    's3.u5',
    's3.u6',
    's3.u7',
    's3.u8',
    's3.cp',
    's4.u1',
    's4.u2',
  ]);

  await completeLesson(page, 's4.u3');

  const row = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { unitProgress: { get(id: string): Promise<{ status: string; bestScore: number } | undefined> } };
    };
    return mod.db.unitProgress.get('s4.u3');
  });
  expect(row?.status).toBe('passed');
  // The driver plays the reference voicings exactly — vl-blended score stays high.
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.9);
});

test('sandbox chord explorer names chords and inversions live', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/sandbox?midi=fake');
  await expect(page.getByRole('tab', { name: 'Chord explorer' })).toBeVisible();

  await page.evaluate(() => {
    for (const m of [60, 64, 67]) window.__fakeMidi?.pressNow(m);
  });
  await expect(page.getByText('root position')).toBeVisible();

  await page.evaluate(() => {
    for (const m of [60, 64, 67]) window.__fakeMidi?.release(m);
    setTimeout(() => {
      for (const m of [64, 67, 72]) window.__fakeMidi?.pressNow(m);
    }, 150);
  });
  await expect(page.getByText('1st inversion')).toBeVisible();

  // Both voicings are parked in the history strip.
  const chips = page.getByRole('button', { name: /^C( ·\d)?$/ });
  await expect(chips.first()).toBeVisible();

  // The other two tabs render their controls.
  await page.getByRole('tab', { name: 'Drone improv' }).click();
  await expect(page.getByRole('button', { name: /Start drone/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Progression looper' }).click();
  await expect(page.getByRole('button', { name: /Loop it/ })).toBeVisible();
});
