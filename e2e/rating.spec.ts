import { expect, test } from '@playwright/test';
import { driveChallenge, readRatingLevel, seedOnboarded, seedTrackedAtoms } from './drive';

/** Stage 0-2 keys material: enough tracked atoms to build a real challenge. */
const KEYS_ATOMS = [
  'note:find:c',
  'note:find:d',
  'note:find:e',
  'note:find:f',
  'note:find:g',
  'fivefinger:c:maj:rh',
  'fivefinger:c:maj:lh',
  'fivefinger:g:maj:rh',
  'chord:c:maj:inv0',
  'chord:f:maj:inv0',
  'chord:g:maj:inv0',
  'chord:a:min:inv0',
];

test.describe('rating challenge', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboarded(page);
  });

  test('a perfect run promotes, and the new level persists', async ({ page }) => {
    await page.goto('/progress?midi=fake');
    await seedTrackedAtoms(page, KEYS_ATOMS);
    await page.goto('/rating/keys?midi=fake');

    await expect(page.getByRole('heading', { name: 'Keys challenge' })).toBeVisible();
    expect(await readRatingLevel(page, 'keys')).toBeNull();

    await page.getByRole('button', { name: 'Start' }).click();
    await driveChallenge(page);

    await expect(page.getByRole('heading', { name: 'Level up' })).toBeVisible();
    const level = await readRatingLevel(page, 'keys');
    expect(level).not.toBeNull();
    expect(level!).toBeGreaterThan(0);

    // The dial on Progress reflects the same level (x10 display).
    await page.goto('/progress?midi=fake');
    await expect(page.getByLabel(`Keys rating ${level! * 10}`)).toBeVisible();
  });

  test('a strand with nothing taught refuses to invent a score', async ({ page }) => {
    await page.goto('/rating/ear?midi=fake');
    await expect(page.getByRole('heading', { name: 'Not yet' })).toBeVisible();
    await expect(page.getByText(/only on what your path has already taught/)).toBeVisible();
    expect(await readRatingLevel(page, 'ear')).toBeNull();
  });

  test('exiting a challenge early records nothing', async ({ page }) => {
    await page.goto('/progress?midi=fake');
    await seedTrackedAtoms(page, KEYS_ATOMS);
    await page.goto('/rating/keys?midi=fake');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page).toHaveURL(/\/progress/);
    expect(await readRatingLevel(page, 'keys')).toBeNull();
  });
});

test.describe('progress screen', () => {
  test('empty state before anything is played', async ({ page }) => {
    await seedOnboarded(page);
    await page.goto('/progress?midi=fake');
    await expect(page.getByText('Nothing to show yet. This page fills in as you play.')).toBeVisible();
  });

  test('the heatmap lights only what has been tracked', async ({ page }) => {
    await seedOnboarded(page);
    await page.goto('/progress?midi=fake');
    await seedTrackedAtoms(page, ['chord:c:maj:inv0']);
    await page.reload();

    // C/Triads is started; G/Triads is untouched and stays disabled.
    await expect(page.getByLabel(/Triads in C, 0 of 1 fluent/)).toBeEnabled();
    await expect(page.getByLabel(/Triads in G, not started/)).toBeDisabled();
  });

  test('badges start unearned and are all listed as goals', async ({ page }) => {
    await seedOnboarded(page);
    await page.goto('/progress?midi=fake');
    await seedTrackedAtoms(page, ['chord:c:maj:inv0']);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Badges' })).toBeVisible();
    await expect(page.getByText('Practise 100 sessions')).toBeVisible();
    await expect(page.getByText('Pass any song chart')).toBeVisible();
  });
});
