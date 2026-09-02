import { test, expect } from '@playwright/test';
import { driveLesson, seedOnboarded } from './drive';

/**
 * The full-path marathon (08 accept): a scripted "perfect student" walks
 * s0.u1 through s7.cp with no seeding, and the epilogue must appear at the end.
 *
 * This is the only test that proves the curriculum is actually traversable as
 * a whole — every prerequisite, every gate, every generator, in order.
 */
test.describe.configure({ mode: 'serial', timeout: 3_600_000 });

test('a perfect student completes the whole path', async ({ page }) => {
  test.slow();
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await expect(page.getByRole('heading', { name: 'The Path' })).toBeVisible();

  // Walk whatever the path says is next until there is nothing left.
  const visited: string[] = [];
  for (let guard = 0; guard < 100; guard++) {
    const nextId = await page.evaluate(async () => {
      const dbMod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
        getUnitProgressMap(): Promise<Map<string, unknown>>;
      };
      const pathMod = (await import(/* @vite-ignore */ String('/src/curriculum/path.ts'))) as {
        nextUnit(progress: Map<string, unknown>): { id: string } | undefined;
      };
      return pathMod.nextUnit(await dbMod.getUnitProgressMap())?.id ?? null;
    });
    if (nextId === null) break;

    visited.push(nextId);
    await page.goto(`/lesson/${nextId}?midi=fake`);
    await driveLesson(page);
    // The final checkpoint lands on the epilogue instead of the path.
    if (nextId === 's7.cp') break;
    await expect(page, `after ${nextId}`).toHaveURL(/\/(path|practice)/);
    await page.goto('/path?midi=fake');
  }

  // Every unit in the curriculum was played, in a valid order.
  const total = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/curriculum/content/index.ts'))) as {
      CURRICULUM: { units: unknown[] };
    };
    return mod.CURRICULUM.units.length;
  });
  expect(visited.length, `visited ${visited.length} of ${total}`).toBe(total);
  expect(visited[0]).toBe('s0.u1');
  expect(visited.at(-1)).toBe('s7.cp');

  // The epilogue is the reward for finishing.
  await expect(page).toHaveURL(/\/epilogue/);
  await expect(page.getByRole('heading', { name: 'The path is yours' })).toBeVisible();

  // Every gate really passed — nothing was skipped or left flagged.
  const state = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: {
        unitProgress: { toArray(): Promise<{ unitId: string; status: string; flagged?: boolean }[]> };
        atomProgress: { count(): Promise<number> };
      };
    };
    const units = await mod.db.unitProgress.toArray();
    return {
      passed: units.filter((u) => u.status === 'passed').length,
      flagged: units.filter((u) => u.flagged).map((u) => u.unitId),
      atoms: await mod.db.atomProgress.count(),
    };
  });
  expect(state.passed).toBe(total);
  expect(state.flagged, 'a perfect student should never need the escape hatch').toEqual([]);
  expect(state.atoms).toBeGreaterThan(60);
});
