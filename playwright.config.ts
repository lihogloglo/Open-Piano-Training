import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Sandboxed dev environments pre-install a pinned Chromium outside Playwright's
// version scheme; use it directly there. CI installs the matching browser itself.
const pinnedChromium = '/opt/pw-browsers/chromium';
const executablePath = !process.env['CI'] && existsSync(pinnedChromium) ? pinnedChromium : undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
