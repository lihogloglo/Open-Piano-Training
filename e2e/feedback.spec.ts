import { test, expect } from '@playwright/test';
import { seedOnboarded, waitForApp, snap, playChord, scheduleTempoRun } from './drive';

test('tourist mode opens every chart, challenge, and review without progress writes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/songs?midi=fake&tourist=1');
  await expect(page.getByRole('heading', { name: 'Chord charts', exact: true })).toBeVisible();
  await expect(page.locator('button[aria-disabled="true"]')).toHaveCount(0);
  await page.goto('/progress?midi=fake');
  await expect(page.getByRole('heading', { name: 'Ratings', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Take a challenge' })).toHaveCount(4);
  await page.goto('/rating/read?midi=fake');
  await expect(page).toHaveURL(/rating\/read/);
  await expect(page.getByRole('heading', { name: 'Not yet', exact: true })).toHaveCount(0);
  await page.goto('/path?midi=fake');
  await page
    .getByRole('button', { name: /Review.*5 min/ })
    .first()
    .click();
  await expect(page).toHaveURL(/drill/);
  await page.goto('/practice?midi=fake');
  await expect(page.getByRole('heading', { name: /Good morning|Good afternoon|Good evening/ })).toBeVisible();
  const counts = await page.evaluate(async () => {
    const { db } = await import(/* @vite-ignore */ String('/src/progress/db.ts'));
    return Promise.all(
      db.tables.map(async (t: { name: string; count: () => Promise<number> }) => [t.name, await t.count()]),
    );
  });
  expect(counts.every(([, count]) => count === 0)).toBe(true);
});

test('a song displays its chart before Start and accepts inversions in another octave', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/songs/first-light?midi=fake&tourist=1');
  await waitForApp(page);
  await expect(page.getByText('Any octave and inversion work.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play the chart' })).toBeEnabled({ timeout: 20000 });
  await page.getByRole('button', { name: 'Play the chart' }).click();
  const initial = await snap(page);
  for (const notes of initial.allTargets) {
    const sorted = [...notes].sort((a, b) => a - b);
    const inverted = [...sorted.slice(1), sorted[0]! + 12].map((m) => m + 12);
    await playChord(page, inverted);
    await page.waitForTimeout(120);
  }
  await expect.poll(async () => (await snap(page)).phase).toBe('done');
  const passed = await page.evaluate(async () => {
    const { useRunStore } = await import(/* @vite-ignore */ String('/src/store/runStore.ts'));
    return useRunStore.getState().result.passed;
  });
  expect(passed).toBe(true);
});

test('tempo lessons show and demonstrate the sequence, accept another octave, and keep it across tempos', async ({
  page,
}) => {
  test.setTimeout(90000);
  await seedOnboarded(page);
  await page.goto('/lesson/s0.u4?midi=fake&tourist=1');
  await waitForApp(page);
  await page.getByLabel('Jump to step').selectOption('2');
  const sequence = page.getByRole('region', { name: 'Sequence to play' });
  await expect(sequence).toBeVisible();
  const before = await sequence.getByRole('listitem').allTextContents();
  expect(before).toHaveLength(9);
  await page.getByRole('button', { name: 'Start at 48 BPM' }).click();
  await expect.poll(async () => (await snap(page)).phase).toBe('preview');
  await playChord(page, [61]);
  await page.screenshot({ path: 'screenshots/feedback-tempo-preview.png', fullPage: true });
  await expect.poll(async () => (await snap(page)).phase, { timeout: 20000 }).toBe('count-in');
  const s = await snap(page);
  await scheduleTempoRun(page, { ...s, allTargets: s.allTargets.map((notes) => notes.map((m) => m - 12)) });
  await expect.poll(async () => (await snap(page)).phase, { timeout: 22000 }).toBe('done');
  await expect(page.getByText('60', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '75%', exact: true }).click();
  expect(await sequence.getByRole('listitem').allTextContents()).toEqual(before);
  await page.getByRole('button', { name: 'Start at 60 BPM' }).click();
  await expect.poll(async () => (await snap(page)).phase).toBe('preview');
  expect((await snap(page)).allTargets).toEqual(s.allTargets);
  await page.getByRole('button', { name: 'Stop demonstration' }).click();
  await expect.poll(async () => (await snap(page)).phase).toBe('idle');
});

test('sharp-note piano samples are served as audio and decode', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/songs/first-light?midi=fake');
  const sample = await page.request.get('/samples/splendid-grand-piano/PP%20D%230.ogg');
  expect((await sample.body()).subarray(0, 4).toString()).toBe('OggS');
  const decoded = await page.evaluate(async () => {
    const res = await fetch('/samples/splendid-grand-piano/PP%20D%230.ogg');
    const ctx = new AudioContext();
    try {
      return (await ctx.decodeAudioData(await res.arrayBuffer())).duration > 0;
    } finally {
      await ctx.close();
    }
  });
  expect(decoded).toBe(true);
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const { getSamplerStatus } = await import(/* @vite-ignore */ String('/src/audio/sampler.ts'));
          return getSamplerStatus().state;
        }),
      { timeout: 20000 },
    )
    .toBe('ready');
});
