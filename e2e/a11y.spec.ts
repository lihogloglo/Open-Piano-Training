import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedOnboarded, seedPassedUnits, seedTrackedAtoms } from './drive';

/**
 * Accessibility gate (08 accept): no serious or critical violations on any
 * screen a learner can reach. Colour-contrast is included — the palette has to
 * hold up, not just the markup.
 */
const SCREENS: [path: string, ready: string][] = [
  ['/practice', 'heading'],
  ['/path', 'The Path'],
  ['/songs', 'Songs'],
  ['/sandbox', 'Chord explorer'],
  ['/progress', 'Progress'],
  ['/settings', 'Settings'],
  ['/setup', ''],
  ['/licenses', 'Licenses & credits'],
  ['/epilogue', 'The path is yours'],
];

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
}

for (const [path] of SCREENS) {
  test(`no serious a11y violations on ${path}`, async ({ page }) => {
    await seedOnboarded(page);
    await page.goto(`${path}?midi=fake`);
    // Give the screen a beat to settle (live queries, lazy panels).
    await page.waitForTimeout(600);

    const results = await scan(page);
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    const summary = serious.map((v) => `${v.id} (${v.impact}) × ${v.nodes.length}: ${v.help}`);
    expect(summary, `${path}\n${summary.join('\n')}`).toEqual([]);
  });
}

test('no serious a11y violations in the lesson player', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lesson/s0.u1?midi=fake');
  await page.waitForTimeout(600);
  const results = await scan(page);
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('no serious a11y violations in a rating challenge', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/progress?midi=fake');
  await seedTrackedAtoms(page, [
    'note:find:c',
    'note:find:d',
    'note:find:e',
    'fivefinger:c:maj:rh',
    'chord:c:maj:inv0',
    'chord:f:maj:inv0',
  ]);
  await page.goto('/rating/keys?midi=fake');
  await page.waitForTimeout(400);
  const results = await scan(page);
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('the path screen stays accessible with progress on it', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await seedPassedUnits(page, ['s0.u1', 's0.u2', 's0.u3']);
  await page.reload();
  await page.waitForTimeout(600);
  const results = await scan(page);
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
