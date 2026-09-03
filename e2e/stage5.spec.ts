import { test, expect } from '@playwright/test';
import { completeLesson, seedOnboarded, seedPassedUnits } from './drive';

// 15 min, not 10: the rehearsal lint pass gave s5.u4-u8 a guided rep and a
// ladder each, so driving one of these units now takes ~6 min locally and more
// on slower CI hardware.
test.describe.configure({ mode: 'serial', timeout: 900_000 });

const THROUGH_STAGE4 = [
  ...['s0.u1', 's0.u2', 's0.u3', 's0.u4', 's0.u5', 's0.u6', 's0.cp'],
  ...['s1.u1', 's1.u2', 's1.u3', 's1.u4', 's1.u5', 's1.u6', 's1.u7', 's1.cp'],
  ...['s2.u1', 's2.u2', 's2.u3', 's2.u4', 's2.u5', 's2.u6', 's2.u7', 's2.cp'],
  ...['s3.u1', 's3.u2', 's3.u3', 's3.u4', 's3.u5', 's3.u6', 's3.u7', 's3.u8', 's3.cp'],
  ...['s4.u1', 's4.u2', 's4.u3', 's4.u4', 's4.u5', 's4.u6', 's4.u7', 's4.cp'],
];

async function unitRow(page: import('@playwright/test').Page, unitId: string) {
  return page.evaluate(async (id: string) => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: {
        unitProgress: { get(id: string): Promise<{ status: string; bestScore: number } | undefined> };
      };
    };
    return mod.db.unitProgress.get(id);
  }, unitId);
}

test('sevenths unit (s5.u1) drives through spelling and ear steps', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('heading', { name: 'The Path' })).toBeVisible();
  await seedPassedUnits(page, THROUGH_STAGE4);

  await completeLesson(page, 's5.u1');

  const row = await unitRow(page, 's5.u1');
  expect(row?.status).toBe('passed');
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.75);

  // Passing the unit starts tracking its atoms, which is what ratings draw on.
  const tracked = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { atomProgress: { toArray(): Promise<{ atomId: string }[]> } };
    };
    return (await mod.db.atomProgress.toArray()).map((r) => r.atomId);
  });
  expect(tracked).toContain('spell:maj7');
  expect(tracked).toContain('ear:quality:7');
});

test('minor progressions unit (s5.u5) plays the Ember chart', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('heading', { name: 'The Path' })).toBeVisible();
  await seedPassedUnits(page, [...THROUGH_STAGE4, 's5.u1', 's5.u2', 's5.u3', 's5.u4']);

  await completeLesson(page, 's5.u5');

  const row = await unitRow(page, 's5.u5');
  expect(row?.status).toBe('passed');
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.8);
});

test('the checkpoint marks the whole of Stage 5 passed', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('heading', { name: 'The Path' })).toBeVisible();
  await seedPassedUnits(page, [
    ...THROUGH_STAGE4,
    ...['s5.u1', 's5.u2', 's5.u3', 's5.u4', 's5.u5', 's5.u6', 's5.u7', 's5.u8', 's5.u9'],
  ]);

  await completeLesson(page, 's5.cp');

  expect((await unitRow(page, 's5.cp'))?.status).toBe('passed');

  // Passing a checkpoint guarantees the whole stage's atoms are on the
  // schedule, whichever route marked its units passed.
  const tracked = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { atomProgress: { toArray(): Promise<{ atomId: string }[]> } };
    };
    return (await mod.db.atomProgress.toArray()).map((r) => r.atomId);
  });
  // All nine of Stage 5's key signatures, spread over u6-u8.
  for (const key of ['c', 'a', 'e', 'b', 'bb', 'eb', 'ab', 'db', 'gb']) {
    expect(tracked, `keysig:${key}:major`).toContain(`keysig:${key}:major`);
  }
  expect(tracked).toContain('prog:ii-v-i:all');
  expect(tracked).toContain('scale:a:harmminor:rh');
});
