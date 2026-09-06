import { test, expect, type Page } from '@playwright/test';

async function seedOnboarded(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const key = 'ks.settings.v1';
    const raw = localStorage.getItem(key);
    const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(key, JSON.stringify({ ...current, onboarded: true }));
  });
}

/** Seed two due, drillable atoms straight into Dexie. */
async function seedDueAtoms(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { atomProgress: { bulkPut(rows: unknown[]): Promise<unknown> } };
    };
    const past = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const card = {
      due: past,
      stability: 1,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 1,
      lapses: 0,
      state: 2,
      last_review: past,
    };
    await mod.db.atomProgress.bulkPut([
      {
        atomId: 'note:find:c',
        fsrs: card,
        introducedAt: 0,
        lastSeenAt: 0,
        bestScore: 0.85,
        attempts: 1,
        fluent: false,
      },
      {
        atomId: 'note:find:f',
        fsrs: card,
        introducedAt: 0,
        lastSeenAt: 0,
        bestScore: 0.85,
        attempts: 1,
        fluent: false,
      },
    ]);
  });
}

test('workout reviews due atoms, grades them, and counts practice', async ({ page }) => {
  test.setTimeout(120_000);
  await seedOnboarded(page);
  await page.goto('/practice?midi=fake');
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
  await seedDueAtoms(page);

  await page.getByRole('button', { name: 'Start', exact: true }).click(); // 5-minute workout card
  await expect(page).toHaveURL(/\/drill\//);
  await expect(page.getByText('Review')).toBeVisible();

  // Drive wait-mode note-find drills via the run bridge.
  for (let guard = 0; guard < 120; guard++) {
    if (!page.url().includes('/drill/')) break;
    const s = await page.evaluate(() =>
      (
        window as unknown as { __runTest: { snapshot(): { phase: string; currentTargetMidis: number[] } } }
      ).__runTest.snapshot(),
    );
    if (s.phase === 'running' && s.currentTargetMidis.length > 0) {
      await page.evaluate((midis: number[]) => {
        for (const m of midis) window.__fakeMidi?.pressNow(m);
        setTimeout(() => {
          for (const m of midis) window.__fakeMidi?.release(m);
        }, 80);
      }, s.currentTargetMidis);
    }
    await page.waitForTimeout(150);
  }
  await expect(page).toHaveURL(/\/practice/, { timeout: 15000 });

  // Both atoms rescheduled into the future; practice minutes recorded.
  const state = await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: {
        atomProgress: { toArray(): Promise<{ atomId: string; fsrs: { due: string }; attempts: number }[]> };
        meta: { get(key: string): Promise<{ value: Record<string, number> } | undefined> };
      };
    };
    return {
      atoms: await mod.db.atomProgress.toArray(),
      practice: (await mod.db.meta.get('practiceDays'))?.value ?? {},
    };
  });
  for (const atom of state.atoms) {
    expect(new Date(atom.fsrs.due).getTime(), atom.atomId).toBeGreaterThan(Date.now());
    expect(atom.attempts).toBeGreaterThan(1);
  }
  expect(Object.values(state.practice).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(5);

  // Streak lights up after today's practice.
  await expect(page.getByLabel('1 day streak')).toBeVisible();
});

test("today's session lists new unit + review + a real song for a fresh-ish profile", async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/practice?midi=fake');
  await seedDueAtoms(page);
  // Rebuild tomorrow's view by clearing today's cached plan.
  await page.evaluate(async () => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { sessions: { clear(): Promise<void> } };
    };
    await mod.db.sessions.clear();
  });
  await page.reload();
  await expect(page.getByText('Continue: Meet the keyboard')).toBeVisible();
  await expect(page.getByText(/Review: 2 skills due/)).toBeVisible();
  await expect(page.getByText('Play: Hot Cross Buns')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start session' })).toBeVisible();
});
