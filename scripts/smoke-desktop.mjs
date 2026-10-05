import { _electron as electron, expect } from '@playwright/test';
import { basename, dirname, join, resolve } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { audioFixture } from './audio-fixture.mjs';

const executablePath = resolve(process.argv[2]);
const userData = await mkdtemp(join(tmpdir(), 'keysense-smoke-'));
let app;
try {
  app = await electron.launch({
    executablePath,
    args: [...(process.argv[3] ? [resolve(process.argv[3])] : []), `--user-data-dir=${userData}`],
    timeout: 45_000,
  });
  expect(await app.evaluate(({ app }) => app.getPath('userData'))).toBe(userData);
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await expect(page.getByRole('heading', { name: 'Keysense' })).toBeVisible();
  await page.getByRole('combobox').selectOption('fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible();
  const result = await page.evaluate(() => {
    return {
      secure: window.isSecureContext,
      midi: typeof navigator.requestMIDIAccess,
    };
  });
  expect(result.secure).toBe(true);
  expect(result.midi).toBe('function');
  await page.getByRole('combobox').selectOption('en');
  const provider = 'https://smpldsnds.github.io/**';
  let downloads = 0;
  await page.route(provider, async (route) => {
    downloads++;
    await route.fulfill({ contentType: 'audio/wav', body: audioFixture() });
  });
  await page.goto('keysense://app/setup');
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sound is on' })).toBeVisible({ timeout: 30_000 });
  expect(downloads).toBeGreaterThan(200);
  const cached = await page.evaluate(
    async () => (await (await caches.open('keysense-samples')).keys()).length,
  );
  expect(cached).toBeGreaterThan(200);
  await page.unroute(provider);
  await page.route(provider, (route) => route.abort());
  await page.reload();
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sound is on' })).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
} finally {
  await app?.close();
  if (dirname(resolve(userData)) !== resolve(tmpdir()) || !basename(userData).startsWith('keysense-smoke-')) {
    throw new Error('Refusing to remove a profile outside the temporary smoke-test directory');
  }
  await rm(userData, { recursive: true, force: true });
}
