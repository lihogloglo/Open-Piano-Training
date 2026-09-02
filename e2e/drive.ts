import { expect, type Page } from '@playwright/test';

export async function seedOnboarded(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const key = 'ks.settings.v1';
    const raw = localStorage.getItem(key);
    const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(key, JSON.stringify({ ...current, onboarded: true }));
  });
}

/** Mark the given units passed directly in Dexie (test setup shortcut). */
export async function seedPassedUnits(page: Page, unitIds: string[]): Promise<void> {
  await page.evaluate(async (ids: string[]) => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { unitProgress: { bulkPut(rows: unknown[]): Promise<unknown> } };
    };
    await mod.db.unitProgress.bulkPut(
      ids.map((unitId) => ({ unitId, status: 'passed', bestScore: 1, completedAt: Date.now() })),
    );
  }, unitIds);
}

/** Give the given atoms FSRS cards, as if their units had been passed. */
export async function seedTrackedAtoms(page: Page, atomIds: string[]): Promise<void> {
  await page.evaluate(async (ids: string[]) => {
    const dbMod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { atomProgress: { bulkPut(rows: unknown[]): Promise<unknown> } };
    };
    const fsrsMod = (await import(/* @vite-ignore */ String('/src/progress/fsrs.ts'))) as {
      newCard(now: Date): unknown;
    };
    const now = Date.now();
    await dbMod.db.atomProgress.bulkPut(
      ids.map((atomId) => ({
        atomId,
        fsrs: fsrsMod.newCard(new Date(now)),
        introducedAt: now,
        lastSeenAt: now,
        bestScore: 0.9,
        attempts: 1,
        fluent: false,
      })),
    );
  }, atomIds);
}

/** Read a strand's stored rating level (null when never challenged). */
export async function readRatingLevel(page: Page, strand: string): Promise<number | null> {
  return page.evaluate(async (s: string) => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { ratings: { get(key: string): Promise<{ level: number } | undefined> } };
    };
    return (await mod.db.ratings.get(s))?.level ?? null;
  }, strand);
}

export interface Snap {
  phase: string;
  mode: 'wait' | 'tempo' | null;
  targetIndex: number;
  targetCount: number;
  currentTargetMidis: number[];
  allTargets: number[][];
  atBeats: number[];
  anchorT0Perf: number | null;
  bpm: number | null;
  spacing: number;
}

/** Wait for the app to boot and install its test bridge. */
export async function waitForApp(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (window as unknown as { __runTest?: unknown }).__runTest !== undefined,
    undefined,
    { timeout: 20_000 },
  );
}

export const snap = (page: Page): Promise<Snap> =>
  page.evaluate(
    () => (window as unknown as { __runTest: { snapshot(): unknown } }).__runTest.snapshot() as never,
  );

/** Press-and-release the given midis simultaneously through the fake adapter. */
export async function playChord(page: Page, midis: number[]): Promise<void> {
  await page.evaluate((ms: number[]) => {
    for (const m of ms) window.__fakeMidi?.pressNow(m);
    setTimeout(() => {
      for (const m of ms) window.__fakeMidi?.release(m);
    }, 90);
  }, midis);
}

/** Schedule a perfect tempo-mode take against the live anchor. */
export async function scheduleTempoRun(page: Page, s: Snap): Promise<void> {
  await page.evaluate(
    (args: { all: number[][]; atBeats: number[]; anchor: number; bpm: number }) => {
      const beatMs = 60_000 / args.bpm;
      const lead = args.anchor - performance.now();
      const script: { midi: number; at: number; dur: number }[] = [];
      args.all.forEach((midis, i) => {
        const at = lead + (args.atBeats[i] ?? i) * beatMs;
        for (const midi of midis) script.push({ midi, at, dur: beatMs * 0.5 });
      });
      window.__fakeMidi?.play(script);
    },
    { all: s.allTargets, atBeats: s.atBeats, anchor: s.anchorT0Perf ?? 0, bpm: s.bpm ?? 80 },
  );
}

/** Drive whatever lesson is open until we are back on /path or /practice
 *  (or, when given, until `until(url)` — e.g. a placement chain boundary). */
/**
 * Guard by wall clock, not iterations: a 12-bar chart at a 60% ladder rung is
 * a 70-second take on its own, so an iteration count says nothing useful about
 * whether the lesson is stuck.
 */
const LESSON_BUDGET_MS = 15 * 60_000;

export async function driveLesson(page: Page, until?: (url: string) => boolean): Promise<void> {
  await waitForApp(page);
  const scheduledAnchors = new Set<number>();
  const deadline = Date.now() + LESSON_BUDGET_MS;
  for (let guard = 0; Date.now() < deadline; guard++) {
    if (!page.url().includes('/lesson/')) return;
    if (until?.(page.url())) return;

    // Structural buttons first: explain-Continue, create-Done, results-Continue, ladder-Continue.
    const structural = page.getByRole('button', { name: /^(Continue|Done)$/ }).first();
    if (await structural.isVisible().catch(() => false)) {
      if (await structural.isEnabled()) {
        // The last Continue navigates away, so the button can vanish mid-click;
        // a lost click just means the step already advanced.
        await structural.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(120);
        continue;
      }
    }

    const s = await snap(page);
    if (s.mode === 'wait' && s.phase === 'running') {
      // Ear previews gate input; pressing during them is harmlessly ignored.
      if (s.currentTargetMidis.length > 0) await playChord(page, s.currentTargetMidis);
      await page.waitForTimeout(160);
      continue;
    }
    if (s.mode === 'tempo' && (s.phase === 'count-in' || s.phase === 'running')) {
      if (s.anchorT0Perf !== null && !scheduledAnchors.has(s.anchorT0Perf)) {
        scheduledAnchors.add(s.anchorT0Perf);
        await scheduleTempoRun(page, s);
      }
      await page.waitForTimeout(250);
      continue;
    }
    if (s.phase === 'idle' || s.phase === 'done') {
      const startBtn = page.getByRole('button', { name: /^(Start|Try again|Restart)$/ }).first();
      if (await startBtn.isVisible().catch(() => false)) {
        if (await startBtn.isEnabled()) {
          await startBtn.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(150);
          continue;
        }
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error(
    `driveLesson did not finish within ${LESSON_BUDGET_MS / 60_000} minutes (at ${page.url()})`,
  );
}

/**
 * Drive a rating challenge to the end screen. Same run machinery as a lesson,
 * different chrome — and no retries, so every item is one pass.
 */
export async function driveChallenge(page: Page): Promise<void> {
  await waitForApp(page);
  const scheduledAnchors = new Set<number>();
  for (let guard = 0; guard < 900; guard++) {
    const heading = await page
      .getByRole('heading', { name: /Level up|Holding steady|Down a step/ })
      .isVisible()
      .catch(() => false);
    if (heading) return;

    const s = await snap(page);
    if (s.mode === 'wait' && s.phase === 'running') {
      if (s.currentTargetMidis.length > 0) await playChord(page, s.currentTargetMidis);
      await page.waitForTimeout(160);
      continue;
    }
    if (s.mode === 'tempo' && (s.phase === 'count-in' || s.phase === 'running')) {
      if (s.anchorT0Perf !== null && !scheduledAnchors.has(s.anchorT0Perf)) {
        scheduledAnchors.add(s.anchorT0Perf);
        await scheduleTempoRun(page, s);
      }
      await page.waitForTimeout(250);
      continue;
    }
    // Tempo items need an explicit Start; wait items auto-start, and their
    // transport Start stays disabled — never click through a disabled one.
    const startBtn = page.getByRole('button', { name: /^Start$/ }).first();
    if ((await startBtn.isVisible().catch(() => false)) && (await startBtn.isEnabled())) {
      await startBtn.click();
      await page.waitForTimeout(150);
      continue;
    }
    await page.waitForTimeout(200);
  }
  throw new Error('driveChallenge did not finish within the guard limit');
}

export async function completeLesson(page: Page, unitId: string): Promise<void> {
  await page.goto(`/lesson/${unitId}?midi=fake`);
  await expect(page).toHaveURL(new RegExp(`/lesson/${unitId.replace('.', '\\.')}`));
  await driveLesson(page);
  await expect(page).toHaveURL(/\/(path|practice)/);
}
