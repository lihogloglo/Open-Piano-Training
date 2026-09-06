import { test, expect, chromium, type Browser, type BrowserContext } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * Phase 7 accept: "offline reload works with sound after first visit".
 *
 * The dev server has no service worker (registerSW is production-only), so
 * this runs against a real `vite preview` of the built app. It is skipped with
 * a clear message when `dist/` has not been built.
 */
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

let server: ChildProcess | null = null;
let context: BrowserContext | null = null;
let browser: Browser | null = null;

test.describe('offline (production build)', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test.beforeAll(async () => {
    if (!existsSync('dist/sw.js')) return;
    server = spawn(
      process.execPath,
      ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'],
      {
        windowsHide: true,
        stdio: 'ignore',
      },
    );
    // Wait for the preview server to answer.
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(BASE);
        if (res.ok) break;
      } catch {
        /* not up yet */
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  });

  test.afterAll(async () => {
    await context?.close();
    await browser?.close();
    server?.kill();
  });

  test('a second visit works offline, with the app shell and sounds cached', async () => {
    test.skip(!existsSync('dist/sw.js'), 'Run `npm run build` first — this test needs dist/.');

    browser = await chromium.launch();
    context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    // Land inside the app shell rather than the welcome wizard, which renders
    // without it (and so without the offline banner).
    await page.addInitScript(() => {
      const key = 'ks.settings.v1';
      const raw = localStorage.getItem(key);
      const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem(key, JSON.stringify({ ...current, onboarded: true }));
    });

    // First visit: let the service worker install and precache.
    await page.goto(`${BASE}/practice?midi=fake`);
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 60_000,
    });
    // Give workbox a moment to finish writing the precache.
    await page.waitForTimeout(3000);

    const precached = await page.evaluate(async () => {
      const names = await caches.keys();
      let total = 0;
      for (const name of names) {
        total += (await (await caches.open(name)).keys()).length;
      }
      return { names, total };
    });
    expect(precached.total, 'the service worker should have precached the shell').toBeGreaterThan(10);

    // Load through the controlling worker so the complete local piano is cached.
    await page.goto(`${BASE}/studio/morning-steps?midi=fake`);
    await page.getByLabel('Practice tempo').fill('160');
    await page.getByRole('button', { name: 'Hear this phrase' }).click();
    await expect(page.getByRole('heading', { name: 'Listen to the phrase' })).toBeVisible();
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const cache = await caches.open('keysense-samples');
            return (await cache.keys()).filter((r) => r.url.includes('/samples/')).length;
          }),
        { timeout: 60_000 },
      )
      .toBeGreaterThanOrEqual(226);
    await page.goto(`${BASE}/practice?midi=fake`);

    // Now pull the plug and reload.
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#root')).not.toBeEmpty();
    // The app is genuinely running, not a browser error page.
    await page.waitForFunction(
      () => (window as unknown as { __runTest?: unknown }).__runTest !== undefined,
      undefined,
      { timeout: 30_000 },
    );
    // The real app is running from cache, not a browser error page.
    // (The offline *banner* keys off `navigator.onLine`, which Playwright's
    // offline emulation does not flip — edge-states.spec covers that.)
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Path' })).toBeVisible();

    // Navigating between screens still works with no network at all.
    await page.goto(`${BASE}/settings?midi=fake`);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.goto(`${BASE}/studio/morning-steps?midi=fake`);
    await page.getByLabel('Practice tempo').fill('160');
    await page.getByRole('button', { name: 'Hear this phrase' }).click();
    await expect(page.getByRole('heading', { name: 'Listen to the phrase' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Practice this phrase' })).toBeEnabled({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Retry audio' })).toHaveCount(0);

    // The demonstration completed with cached samples. Audible quality remains a human check.

    await browser.close();
    context = null;
  });
});
