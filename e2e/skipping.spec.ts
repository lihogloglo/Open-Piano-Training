import { test, expect, type Page } from '@playwright/test';
import { seedOnboarded, waitForApp, snap, scheduleTempoRun } from './drive';

async function resumeAt(page: Page, unitId: string, kind: 'ladder' | 'graded') {
  return page.evaluate(
    async ({ unitId, kind }) => {
      const { getUnit } = await import(/* @vite-ignore */ String('/src/curriculum/content/index.ts'));
      const { saveResume } = await import(/* @vite-ignore */ String('/src/progress/lessonResume.ts'));
      const unit = getUnit(unitId);
      const index = unit.steps.findIndex((s: { kind: string }) => s.kind === kind);
      await saveResume(unitId, {
        seed: 12,
        stepId: unit.steps[index].id,
        scores: [],
        flagged: false,
        ladders: {},
      });
      return { index, count: unit.steps.length, stepId: unit.steps[index].id };
    },
    { unitId, kind },
  );
}

test('normal lessons can skip every step, resume, and retain skipped assessments for review', async ({
  page,
}) => {
  await seedOnboarded(page);
  await page.goto('/lesson/s0.u1?midi=fake');
  await waitForApp(page);
  await expect(page.getByTestId('tourist-notice')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await expect(page.getByLabel('Step 2 of 6')).toBeVisible();
  await expect.poll(async () => (await snap(page)).phase).toBe('running');
  await page.reload();
  await expect(page.getByLabel('Step 2 of 6')).toBeVisible();
  for (let i = 2; i <= 6; i++) {
    await expect(page.getByLabel(`Step ${i} of 6`)).toBeVisible();
    await page.getByRole('button', { name: 'Skip this step' }).click();
    if (i === 5) {
      await expect(page.getByLabel('Step 6 of 6')).toBeVisible();
      await page.reload();
    }
  }
  await expect(page).toHaveURL(/\/path/);
  const saved = await page.evaluate(async () => {
    const { db } = await import(/* @vite-ignore */ String('/src/progress/db.ts'));
    return {
      unit: await db.unitProgress.get('s0.u1'),
      retests: await db.meta.where('key').startsWith('retest:s0.u1:').count(),
      resume: await db.meta.get('lessonResume:s0.u1'),
      takes: await db.takes.count(),
      atoms: await db.atomProgress.toArray(),
    };
  });
  expect(saved.unit).toMatchObject({ status: 'passed', bestScore: 0, flagged: true });
  expect(saved.retests).toBe(1);
  expect(saved.resume).toBeUndefined();
  expect(saved.takes).toBe(0);
  expect(saved.atoms.every((a: { bestScore: number }) => a.bestScore === 0)).toBe(true);
  expect((await snap(page)).phase).toBe('idle');
});

test('a full-tempo pass completes a ladder without the slower repetitions, including after reload', async ({
  page,
}) => {
  test.setTimeout(90000);
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  const step = await resumeAt(page, 's0.u4', 'ladder');
  await page.goto('/lesson/s0.u4?midi=fake');
  await waitForApp(page);
  const pips = page.getByLabel('Tempo ladder');
  await expect(pips.getByRole('button', { name: '100%', exact: true })).toBeVisible();
  await pips.getByRole('button', { name: '100%', exact: true }).click();
  await page.getByRole('button', { name: /^Start at/ }).click();
  await expect.poll(async () => (await snap(page)).phase, { timeout: 45000 }).toBe('count-in');
  await scheduleTempoRun(page, await snap(page));
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible({ timeout: 45000 });
  await expect(pips.locator('[data-lit="true"]')).toHaveCount(1);
  await page.reload();
  await expect(pips.getByRole('button', { name: '100%', exact: true })).toHaveAttribute(
    'data-current',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
  await expect(pips.locator('[data-lit="true"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel(`Step ${step.index + 2} of ${step.count}`)).toBeVisible();
});

test('review skips preserve skill scores and pending retests while advancing the session', async ({
  page,
}) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  const before = await page.evaluate(async () => {
    const { db } = await import(/* @vite-ignore */ String('/src/progress/db.ts'));
    const { completeUnit } = await import(/* @vite-ignore */ String('/src/progress/service.ts'));
    const { getUnit } = await import(/* @vite-ignore */ String('/src/curriculum/content/index.ts'));
    const { queueRetest } = await import(/* @vite-ignore */ String('/src/progress/lessonResume.ts'));
    const unit = getUnit('s0.u1');
    await completeUnit(unit, 0.9, true);
    const step = unit.steps.find((s: { kind: string }) => s.kind === 'graded');
    await queueRetest(unit.id, step.id, step.exercise);
    const key = `retest:${unit.id}:${step.id}`;
    await db.sessions.put({
      id: 'skip-review',
      date: '2026-09-09',
      state: 'fresh',
      plan: {
        id: 'skip-review',
        date: '2026-09-09',
        catchUp: false,
        completedBlocks: [],
        blocks: [
          {
            kind: 'review',
            minutes: 5,
            atomIds: [],
            retests: [
              { key, unitId: unit.id, stepId: step.id, exercise: step.exercise },
              {
                key,
                unitId: unit.id,
                stepId: step.id,
                exercise: { ...step.exercise, mode: 'tempo', bpm: 80 },
              },
            ],
          },
        ],
      },
    });
    return db.atomProgress.toArray();
  });
  await page.goto('/drill/skip-review/0?midi=fake');
  await waitForApp(page);
  await expect.poll(async () => (await snap(page)).phase).toBe('running');
  await page.getByRole('button', { name: 'Skip this exercise' }).click();
  await expect(page.getByText(/^2\/2 ·/)).toBeVisible();
  expect((await snap(page)).phase).toBe('idle');
  await page.getByRole('button', { name: 'Skip this exercise' }).click();
  await expect(page).toHaveURL(/\/practice/);
  const after = await page.evaluate(async () => {
    const { db } = await import(/* @vite-ignore */ String('/src/progress/db.ts'));
    return {
      atoms: await db.atomProgress.toArray(),
      retests: await db.meta.where('key').startsWith('retest:').count(),
      takes: await db.takes.count(),
      session: await db.sessions.get('skip-review'),
      practiceDays: await db.meta.get('practiceDays'),
    };
  });
  expect(after.atoms).toEqual(before);
  expect(after.retests).toBe(1);
  expect(after.takes).toBe(0);
  expect(after.session).toMatchObject({ state: 'done', plan: { completedBlocks: [0] } });
  expect(after.practiceDays).toBeUndefined();
});

test('checkpoint assessments still require a pass and French skip controls are available in lessons', async ({
  page,
}) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await resumeAt(page, 's0.cp', 'graded');
  await page.goto('/lesson/s0.cp?midi=fake');
  await expect(page.getByRole('button', { name: 'Exit lesson' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip this step' })).toHaveCount(0);
  await page.goto('/settings?midi=fake');
  await page.getByRole('combobox', { name: /Language/ }).selectOption('fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.goto('/lesson/s0.u1?midi=fake');
  await page.getByRole('button', { name: 'Passer cette étape' }).click();
  await expect(page.getByLabel('Étape 2 sur 6')).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.screenshot({ path: 'test-results/french-skip.png' });
});

test('a failed assessment can be marked for review after the first attempt', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  const current = await resumeAt(page, 's0.u1', 'graded');
  await page.evaluate(async (stepId) => {
    const { db } = await import(/* @vite-ignore */ String('/src/progress/db.ts'));
    const { getUnit } = await import(/* @vite-ignore */ String('/src/curriculum/content/index.ts'));
    const step = getUnit('s0.u1').steps.find((s: { id: string }) => s.id === stepId);
    const row = await db.meta.get('lessonResume:s0.u1');
    await db.meta.put({
      ...row,
      value: {
        ...row.value,
        assessments: {
          [stepId]: {
            exercise: { ...step.exercise, assessment: true },
            seed: 12,
            failCount: 1,
            practiceOnly: false,
            result: {
              pitchAccuracy: 0.4,
              timingAccuracy: 0.4,
              score: 0.4,
              passed: false,
              stars: 0,
              judgments: [],
            },
          },
        },
      },
    });
  }, current.stepId);
  await page.goto('/lesson/s0.u1?midi=fake');
  await page.getByRole('button', { name: 'Mark for extra review & move on' }).click();
  await expect(page.getByLabel('Step 6 of 6')).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page).toHaveURL(/\/path/);
  const unit = await page.evaluate(async () => {
    const { db } = await import(/* @vite-ignore */ String('/src/progress/db.ts'));
    return db.unitProgress.get('s0.u1');
  });
  expect(unit).toMatchObject({ status: 'passed', bestScore: 0.4, flagged: true });
});
