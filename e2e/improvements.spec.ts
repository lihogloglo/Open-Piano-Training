import { test, expect } from '@playwright/test';
import { seedOnboarded, waitForApp, snap, scheduleTempoRun, playChord } from './drive';

async function seedFailedStep(page: import('@playwright/test').Page, unitId: string) {
  await page.evaluate(async (id) => {
    const { getUnit } = await import(/* @vite-ignore */ String('/src/curriculum/content/index.ts'));
    const { saveResume } = await import(/* @vite-ignore */ String('/src/progress/lessonResume.ts'));
    const step = getUnit(id).steps.find((s: { kind: string }) => s.kind === 'graded');
    await saveResume(id, {
      stepId: step.id,
      scores: [],
      flagged: false,
      ladders: {},
      assessments: {
        [step.id]: {
          exercise: { ...step.exercise, assessment: true },
          seed: 12,
          failCount: 3,
          practiceOnly: false,
          result: {
            pitchAccuracy: 0.4,
            timingAccuracy: 0.4,
            score: 0.4,
            passed: false,
            stars: 0,
            judgments: [{ targetIndex: 3, midi: 63, verdict: 'wrong', deltaMs: null }],
          },
        },
      },
    });
  }, unitId);
  await page.goto(`/lesson/${unitId}?midi=fake`);
  await waitForApp(page);
}

test('focused practice cannot pass the full assessment and survives reload', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await seedFailedStep(page, 's0.u1');
  await expect(page.getByRole('button', { name: 'Mark for extra review & move on' })).toBeVisible();
  await page.getByRole('button', { name: 'Practice the trouble spot' }).click();
  await expect.poll(async () => (await snap(page)).targetCount).toBe(3);
  for (let i = 0; i < 3; i++) {
    await playChord(page, (await snap(page)).currentTargetMidis);
    await page.waitForTimeout(120);
  }
  await expect(page.getByRole('heading', { name: 'Practice complete' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Practice complete' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect.poll(async () => (await snap(page)).targetCount).toBeGreaterThan(3);
});

test('a perfect slower practice does not satisfy the target tempo', async ({ page }) => {
  test.setTimeout(90000);
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await seedFailedStep(page, 's0.u4');
  await page.getByRole('button', { name: 'Practice slower' }).click();
  await expect.poll(async () => (await snap(page)).phase).toBe('count-in');
  const slow = await snap(page);
  await scheduleTempoRun(page, slow);
  await expect(page.getByRole('heading', { name: 'Practice complete' })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect.poll(async () => (await snap(page)).bpm).toBeGreaterThan(slow.bpm!);
});

test('focus loss releases computer keys and abort cancels a pending audio start', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/studio/morning-steps?midi=fake');
  await waitForApp(page);
  await page.keyboard.down('a');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { useMidiStore } = await import(/* @vite-ignore */ String('/src/store/midiStore.ts'));
        return useMidiStore.getState().activeNotes.size;
      }),
    )
    .toBe(0);
  await page.keyboard.up('a');
  await page.evaluate(async () => {
    const { useRunStore } = await import(/* @vite-ignore */ String('/src/store/runStore.ts'));
    const { generate } = await import(/* @vite-ignore */ String('/src/engine/generators/index.ts'));
    const store = useRunStore.getState();
    const pending = store.startRun(
      generate(
        {
          generator: 'note-find',
          params: { notes: ['C'], count: 2 },
          mode: 'tempo',
          bpm: 100,
          hand: 'rh',
          rung: 'note-names',
          seedPolicy: 'fixed',
        },
        1,
      ),
    );
    store.abortRun();
    await pending;
  });
  expect((await snap(page)).phase).toBe('idle');
});

test('pointer checks, guided input, and reload resume share one input path', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lesson/s0.u1?midi=fake');
  await waitForApp(page);
  const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continueButton).toBeDisabled();
  await page.getByRole('button', { name: 'C4', exact: true }).click();
  for (const name of ['C3', 'C4', 'C5']) await page.getByRole('button', { name, exact: true }).click();
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  await expect(page.getByText('Play any C', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'C4', exact: true }).click();
  await expect.poll(async () => (await snap(page)).targetIndex).toBe(1);
  await page.keyboard.press('a');
  await expect.poll(async () => (await snap(page)).targetIndex).toBe(2);
  await page.reload();
  await expect(page.getByText('Play any C', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Step 2 of 6')).toBeVisible();
});

test('a learner can browse explanations and low left-hand notes remain visible', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lesson/s0.u1?midi=fake');
  await page.getByRole('checkbox', { name: 'Browse the explanation' }).check();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
  await page.evaluate(async () => {
    const { saveResume } = await import(/* @vite-ignore */ String('/src/progress/lessonResume.ts'));
    await saveResume('s1.u5', { stepId: 's1.u5.g4', scores: [], flagged: false, ladders: {} });
  });
  await page.goto('/lesson/s1.u5?midi=fake');
  await expect(page.getByRole('button', { name: 'C2', exact: true })).toBeVisible();
});

test('piece practice supports phrases, hands, unaided performance, and saved takes', async ({ page }) => {
  test.setTimeout(60000);
  await seedOnboarded(page);
  await page.goto('/studio/morning-steps?midi=fake');
  await waitForApp(page);
  await page.getByLabel('Hands', { exact: true }).selectOption('lh');
  await expect(
    page.getByText('This arrangement has no notes for that hand.', { exact: false }),
  ).toBeVisible();
  await page.getByLabel('Arrangement').selectOption('bass');
  await page.getByLabel('Phrase', { exact: true }).selectOption('0');
  await page.getByLabel('Practice tempo').fill('160');
  await page.getByRole('button', { name: 'Perform without hints' }).click();
  await expect(page.getByLabel('Phrase notes and durations')).toHaveCount(0);
  await expect.poll(async () => (await snap(page)).phase).toBe('count-in');
  await scheduleTempoRun(page, await snap(page));
  await expect(page.getByText(/100%.*Performance at 160 BPM/)).toBeVisible({ timeout: 20000 });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { db } = await import(/* @vite-ignore */ String('/src/progress/db.ts'));
        return db.takes.count();
      }),
    )
    .toBe(1);
  await page.getByText('Listen and check your playing', { exact: true }).click();
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await page.getByRole('button', { name: 'Save my self-check' }).click();
  await expect(page.getByText(/Completed. Independent and retained/)).toBeVisible();
  await page.goto('/progress');
  await expect(page.getByText(/Morning Steps.*Independent/)).toBeVisible();
});

test('ear practice hides its answer and requires a listening pass before assessment', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/studio/melody-echo?midi=fake');
  await expect(page.getByLabel('Phrase notes and durations')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Perform without hints' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reveal for practice' }).click();
  await expect(page.getByLabel('Phrase notes and durations')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Perform without hints' })).toBeDisabled();
});
