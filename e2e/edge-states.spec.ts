import { test, expect } from '@playwright/test';
import { seedOnboarded, seedPassedUnits } from './drive';

/**
 * The designed states for when things are missing or not ready
 * (05 §Empty/edge states), plus the keyboard-navigation pass from 08.
 */

test('players warn when no keyboard is connected and offer the computer keys', async ({ page }) => {
  await seedOnboarded(page);
  // No `?midi=fake`, so the app finds no device.
  await page.goto('/lesson/s0.u1');
  await expect(page.getByText(/No keyboard connected|can't talk to MIDI|access is blocked/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Set up' })).toBeVisible();
});

test('a narrow window says so instead of squashing the keyboard', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/practice?midi=fake');
  await expect(page.getByTestId('viewport-notice')).toBeHidden();

  await page.setViewportSize({ width: 800, height: 800 });
  await expect(page.getByTestId('viewport-notice')).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByTestId('viewport-notice')).toBeHidden();
});

test('going offline is reported as information, not an error', async ({ page, context }) => {
  await seedOnboarded(page);
  await page.goto('/practice?midi=fake');
  await expect(page.getByTestId('offline-banner')).toBeHidden();

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  const banner = page.getByTestId('offline-banner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(/everything still works/i);

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(banner).toBeHidden();
});

test('Today shows the caught-up state rather than an empty card', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  // Pass everything: nothing new is left to schedule.
  const allUnits = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/curriculum/content/index.ts'))) as {
      CURRICULUM: { units: { id: string }[] };
    };
    return mod.CURRICULUM.units.map((u) => u.id);
  });
  await seedPassedUnits(page, allUnits);
  await page.goto('/practice?midi=fake');
  await expect(page.getByText(/All caught up/)).toBeVisible();
});

test('every screen is reachable and operable by keyboard alone', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/practice?midi=fake');

  // Tab into the sidebar and confirm focus lands on something meaningful.
  const reached: string[] = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      return `${el.tagName.toLowerCase()}:${(el.textContent ?? '').trim().slice(0, 24)}`;
    });
    if (info) reached.push(info);
  }
  expect(reached.length, 'Tab should move focus through real controls').toBeGreaterThan(4);
  // The nav links must be among them.
  expect(reached.join(' | ')).toMatch(/Today|Path|Songs|Sandbox|Progress/);
});

test('locked songs stay focusable so the list can be read and scrolled', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/songs?midi=fake');
  const locked = page.getByRole('button', { name: /unlocks in Stage/ }).first();
  await expect(locked).toBeVisible();
  await locked.focus();
  await expect(locked).toBeFocused();
  // Activating a locked card must not navigate.
  await locked.press('Enter');
  await expect(page).toHaveURL(/\/songs(\?|$)/);
});

test('the exit control in a lesson is keyboard reachable', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lesson/s0.u1?midi=fake');
  const exit = page.getByRole('button', { name: 'Exit lesson' });
  await exit.focus();
  await expect(exit).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/(path|practice)/);
});
