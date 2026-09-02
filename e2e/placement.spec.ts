import { test, expect } from '@playwright/test';
import { driveLesson } from './drive';

test.describe.configure({ timeout: 240_000 });

/**
 * Placement acceptance (08 Phase 6): a learner who knows C major basics takes
 * the checkpoint chain from onboarding, aces Stage 0 and Stage 1, stops at the
 * Stage 2 checkpoint — and lands at the start of Stage 2 with everything
 * before it marked passed.
 */
test('placement lands a "knows C major basics" profile at Stage 2 start', async ({ page }) => {
  await page.goto('/welcome?midi=fake');

  // Onboarding: value prop → MIDI (fake adapter connects) → sound → start point.
  await page.getByRole('button', { name: 'Get started' }).click();
  await page
    .getByRole('button', { name: /Continue|computer keys/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /place me/ }).click();

  // Checkpoint chain: s0.cp passes → s1.cp passes → arrives at s2.cp.
  await expect(page).toHaveURL(/\/lesson\/s0\.cp\?placement=1/);
  await driveLesson(page, (url) => url.includes('s1.cp'));
  await expect(page).toHaveURL(/\/lesson\/s1\.cp\?placement=1/);
  await driveLesson(page, (url) => url.includes('s2.cp'));
  await expect(page).toHaveURL(/\/lesson\/s2\.cp\?placement=1/);

  // The spelling engine is beyond this profile: bail out of the chain here.
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/path/);

  // Stages 0-1 fully passed via checkpoint gates; Stage 2 is the frontier.
  const statuses = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      getUnitProgressMap(): Promise<Map<string, { status: string }>>;
    };
    const map = await mod.getUnitProgressMap();
    return Object.fromEntries([...map.entries()].map(([id, row]) => [id, row.status]));
  });
  for (const id of ['s0.u1', 's0.u6', 's0.cp', 's1.u1', 's1.u7', 's1.cp']) {
    expect(statuses[id], id).toBe('passed');
  }
  expect(statuses['s2.u1'] ?? 'none').not.toBe('passed');

  // The path's "you are here" continuation is the first Stage 2 unit.
  const next = await page.evaluate(async () => {
    const [pathMod, dbMod] = await Promise.all([
      import(/* @vite-ignore */ String('/src/curriculum/path.ts')),
      import(/* @vite-ignore */ String('/src/progress/db.ts')),
    ]);
    const progress = await (
      dbMod as { getUnitProgressMap(): Promise<Map<string, never>> }
    ).getUnitProgressMap();
    return (pathMod as { nextUnit(p: Map<string, never>): { id: string } | null }).nextUnit(progress)?.id;
  });
  expect(next).toBe('s2.u1');
});
