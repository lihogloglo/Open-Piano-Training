import { test } from '@playwright/test';
import { seedOnboarded, seedPassedUnits, seedTrackedAtoms } from './drive';

/**
 * Not an assertion suite — a way to actually look at the screens.
 * `npx playwright test e2e/screenshots.spec.ts` writes to `screenshots/`.
 */
test.describe.configure({ mode: 'serial' });

const THROUGH_STAGE5 = [
  ...['s0.u1', 's0.u2', 's0.u3', 's0.u4', 's0.u5', 's0.u6', 's0.cp'],
  ...['s1.u1', 's1.u2', 's1.u3', 's1.u4', 's1.u5', 's1.u6', 's1.u7', 's1.cp'],
  ...['s2.u1', 's2.u2', 's2.u3', 's2.u4', 's2.u5', 's2.u6', 's2.u7', 's2.cp'],
  ...['s3.u1', 's3.u2', 's3.u3', 's3.u4', 's3.u5', 's3.u6', 's3.u7', 's3.u8', 's3.cp'],
];

test('capture the main screens', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedOnboarded(page);

  await page.goto('/progress?midi=fake');
  await seedPassedUnits(page, THROUGH_STAGE5);
  await seedTrackedAtoms(page, [
    'chord:c:maj:inv0',
    'chord:f:maj:inv0',
    'chord:g:maj:inv0',
    'chord:c:maj:inv1',
    'scale:c:major:rh:1oct',
    'scale:g:major:rh:1oct',
    'fivefinger:c:maj:rh',
    'prog:i-v-vi-iv:c',
    'prog:i-iv-v:g',
    'spell:triad:maj',
    'spell:triad:min',
    'ear:degree:135',
    'ear:quality:majmin',
    'note:find:c',
    'note:find:d',
  ]);
  await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: {
        atomProgress: { toArray(): Promise<unknown[]>; bulkPut(r: unknown[]): Promise<unknown> };
        ratings: { bulkPut(r: unknown[]): Promise<unknown> };
      };
    };
    // A few fluent atoms so the heatmap has range.
    const rows = (await mod.db.atomProgress.toArray()) as { atomId: string; fluent: boolean }[];
    for (const r of rows) {
      if (['chord:c:maj:inv0', 'scale:c:major:rh:1oct', 'prog:i-v-vi-iv:c'].includes(r.atomId)) {
        r.fluent = true;
      }
    }
    await mod.db.atomProgress.bulkPut(rows);
    await mod.db.ratings.bulkPut([
      {
        strand: 'keys',
        level: 22,
        history: [
          { date: '2026-07-05', level: 14 },
          { date: '2026-07-19', level: 16 },
          { date: '2026-08-02', level: 18 },
          { date: '2026-08-23', level: 20 },
          { date: '2026-08-30', level: 22 },
        ],
      },
      {
        strand: 'theory',
        level: 15,
        history: [
          { date: '2026-08-02', level: 12 },
          { date: '2026-08-23', level: 15 },
        ],
      },
    ]);
  });
  await page.reload();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'screenshots/progress.png', fullPage: true });

  await page.goto('/practice?midi=fake');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'screenshots/today.png', fullPage: true });

  await page.goto('/rating/keys?midi=fake');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'screenshots/rating-intro.png' });

  await page.goto('/epilogue?midi=fake');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'screenshots/epilogue.png', fullPage: true });

  await page.goto('/songs?midi=fake');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'screenshots/songs.png', fullPage: true });

  await page.goto('/licenses?midi=fake');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'screenshots/licenses.png', fullPage: true });
});
