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
export async function driveLesson(page: Page, until?: (url: string) => boolean): Promise<void> {
  const scheduledAnchors = new Set<number>();
  for (let guard = 0; guard < 900; guard++) {
    if (!page.url().includes('/lesson/')) return;
    if (until?.(page.url())) return;

    // Structural buttons first: explain-Continue, create-Done, results-Continue, ladder-Continue.
    const structural = page.getByRole('button', { name: /^(Continue|Done)$/ }).first();
    if (await structural.isVisible().catch(() => false)) {
      if (await structural.isEnabled()) {
        await structural.click();
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
          await startBtn.click();
          await page.waitForTimeout(150);
          continue;
        }
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error('driveLesson did not finish within the guard limit');
}

export async function completeLesson(page: Page, unitId: string): Promise<void> {
  await page.goto(`/lesson/${unitId}?midi=fake`);
  await expect(page).toHaveURL(new RegExp(`/lesson/${unitId.replace('.', '\\.')}`));
  await driveLesson(page);
  await expect(page).toHaveURL(/\/(path|practice)/);
}
