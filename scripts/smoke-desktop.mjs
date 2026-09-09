import { _electron as electron, expect } from '@playwright/test';
import { basename, dirname, join, resolve } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

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
  const result = await page.evaluate(async () => {
    const response = await fetch('/samples/splendid-grand-piano/FF%20A0.ogg');
    return {
      secure: window.isSecureContext,
      midi: typeof navigator.requestMIDIAccess,
      status: response.status,
      bytes: (await response.arrayBuffer()).byteLength,
      type: response.headers.get('content-type'),
    };
  });
  expect(result.secure).toBe(true);
  expect(result.status).toBe(200);
  expect(result.bytes).toBeGreaterThan(1000);
  expect(result.type).toContain('audio/');
  expect(result.midi).toBe('function');
  expect(errors).toEqual([]);
} finally {
  await app?.close();
  if (dirname(resolve(userData)) !== resolve(tmpdir()) || !basename(userData).startsWith('keysense-smoke-')) {
    throw new Error('Refusing to remove a profile outside the temporary smoke-test directory');
  }
  await rm(userData, { recursive: true, force: true });
}
