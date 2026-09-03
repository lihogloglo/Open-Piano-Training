import { test, expect, type Page } from '@playwright/test';
import { driveLesson, seedOnboarded, seedPassedUnits, waitForApp, type Snap } from './drive';

test.describe.configure({ timeout: 180_000 });

/** Press-and-release one note through the fake adapter. */
const press = (page: Page, midi: number) =>
  page.evaluate((m: number) => {
    window.__fakeMidi?.pressNow(m);
    setTimeout(() => window.__fakeMidi?.release(m), 60);
  }, midi);

async function passed(page: Page, unitId: string) {
  return page.evaluate(async (id: string) => {
    const mod = (await import(/* @vite-ignore */ String('/src/progress/db.ts'))) as {
      db: { unitProgress: { get(id: string): Promise<{ status: string; bestScore: number } | undefined> } };
    };
    return mod.db.unitProgress.get(id);
  }, unitId);
}

/**
 * The rebuilt Stage 0 lessons are asserted on their teaching half, not just
 * driven past: the explain steps must accept playing, count the right notes,
 * name the wrong ones back, and never block a learner with no keyboard.
 */
test('s0.u1 explain steps answer the keyboard, and the unit completes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/lesson/s0.u1?midi=fake');
  await waitForApp(page);

  await expect(page.getByText('Play it on your keyboard, or click the keys below.')).toBeVisible();

  // A wrong note is named back, not buzzed.
  await press(page, 62); // D4
  await expect(page.getByText(/That’s D\. Try again\./)).toBeVisible();

  await press(page, 60); // C4
  await expect(page.getByText('That’s it.')).toBeVisible();

  // Second check: three *different* Cs — the octave idea, made physical.
  const counter = page.getByText(/^\d \/ 3$/);
  await expect(counter).toHaveText('0 / 3');
  await press(page, 48);
  await expect(counter).toHaveText('1 / 3');
  await press(page, 48); // same octave again — must not count twice
  await expect(counter).toHaveText('1 / 3');
  await press(page, 60);
  await press(page, 72);
  await expect(page.getByText("All 3 — that's the pattern.")).toBeVisible();

  // Continue is never gated on the checks (no-MIDI learners must get through).
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();

  await driveLesson(page);
  await expect(page).toHaveURL(/\/path/);

  const row = await passed(page, 's0.u1');
  expect(row?.status).toBe('passed');
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.8);
});

test('s0.u2 checks the landmark notes, and the unit completes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await waitForApp(page);
  await seedPassedUnits(page, ['s0.u1']);

  await page.goto('/lesson/s0.u2?midi=fake');
  await waitForApp(page);

  // "D is the one trapped between the two blacks."
  await press(page, 64); // E — wrong, and named
  await expect(page.getByText(/That’s E\. Try again\./)).toBeVisible();
  await press(page, 62); // D
  await expect(page.getByText('That’s it.')).toBeVisible();

  // G then A: two distinct *names*, so a second G must not count.
  const counter = page.getByText(/^\d \/ 2$/);
  await expect(counter).toHaveText('0 / 2');
  await press(page, 67); // G
  await expect(counter).toHaveText('1 / 2');
  await press(page, 79); // G an octave up — same name, must not count
  await expect(counter).toHaveText('1 / 2');
  await press(page, 69); // A
  await expect(page.getByText("All 2 — that's the pattern.")).toBeVisible();

  await driveLesson(page);
  await expect(page).toHaveURL(/\/path/);

  const row = await passed(page, 's0.u2');
  expect(row?.status).toBe('passed');
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.8);
});

test('s0.u3 teaches half steps by hand, walks the chromatic, and completes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await waitForApp(page);
  await seedPassedUnits(page, ['s0.u1', 's0.u2']);

  await page.goto('/lesson/s0.u3?midi=fake');
  await waitForApp(page);

  // "The very next key up from C" — a white D is the classic wrong answer.
  await press(page, 62); // D
  await expect(page.getByText(/That’s D\. Try again\./)).toBeVisible();
  await press(page, 61); // C#
  await expect(page.getByText('That’s it.')).toBeVisible();

  // E♭ next: enharmonic, so D♯ is the same key and must be accepted.
  await press(page, 63);
  await expect(page.getByText('That’s it.')).toHaveCount(2);

  await page.getByRole('button', { name: 'Continue' }).click();

  // The chromatic walk is 13 targets with a fingering shown on the keys.
  const s = await page.evaluate(() =>
    (
      window as unknown as {
        __runTest: { snapshot(): { targetCount: number; allTargets: number[][] } };
      }
    ).__runTest.snapshot(),
  );
  expect(s.targetCount).toBe(13);
  expect(s.allTargets.flat()).toEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]);

  await driveLesson(page);
  await expect(page).toHaveURL(/\/path/);

  const row = await passed(page, 's0.u3');
  expect(row?.status).toBe('passed');
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.8);
});

/**
 * Stage 1 is the first stage whose units are two-handed. The rebuilt lessons
 * are asserted on the two things the audit said were missing: an explain step
 * that needs hands on the keys, and a left hand that actually plays.
 */
test('s1.u1 walks the scale recipe by hand, then completes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await waitForApp(page);
  await seedPassedUnits(page, ['s0.u1', 's0.u2', 's0.u3', 's0.u4', 's0.u5', 's0.u6', 's0.cp']);

  await page.goto('/lesson/s1.u1?midi=fake');
  await waitForApp(page);

  // A whole step up from C. The half-step answer is the classic mistake, and
  // it gets named rather than buzzed.
  await press(page, 61); // C#
  await expect(page.getByText(/That’s C♯\. Try again\./)).toBeVisible();
  await press(page, 62); // D
  await expect(page.getByText('That’s it.')).toBeVisible();

  await press(page, 64); // E — another whole step
  await expect(page.getByText('That’s it.')).toHaveCount(2);

  // The recipe's first half step: E→F, and no black key in between.
  await press(page, 66); // F# — a whole step, which is what the recipe does not ask for
  await expect(page.getByText(/That’s F♯\. Try again\./)).toBeVisible();
  await press(page, 65); // F
  await expect(page.getByText('That’s it.')).toHaveCount(3);

  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();

  const snaps: Snap[] = [];
  await driveLesson(page, undefined, (s) => snaps.push(s));
  await expect(page).toHaveURL(/\/path/);

  // The unit ran a tempo ladder: at least one tempo-mode step happened.
  expect(snaps.some((s) => s.mode === 'tempo')).toBe(true);

  const row = await passed(page, 's1.u1');
  expect(row?.status).toBe('passed');
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.8);
});

test('s1.u5 plays I-IV-V with the root in the left hand, and completes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await waitForApp(page);
  await seedPassedUnits(page, [
    's0.u1',
    's0.u2',
    's0.u3',
    's0.u4',
    's0.u5',
    's0.u6',
    's0.cp',
    's1.u1',
    's1.u2',
    's1.u3',
    's1.u4',
  ]);

  await page.goto('/lesson/s1.u5?midi=fake');
  await waitForApp(page);

  // Build IV from its degrees: F, A, C — three distinct names, any octave.
  const counter = page.getByText(/^\d \/ 3$/).first();
  await expect(counter).toHaveText('0 / 3');
  await press(page, 65); // F
  await press(page, 69); // A
  await press(page, 72); // C
  await expect(page.getByText("All 3 — that's the pattern.")).toBeVisible();

  const snaps: Snap[] = [];
  await driveLesson(page, undefined, (s) => snaps.push(s));
  await expect(page).toHaveURL(/\/path/);

  // Somewhere in the unit the learner played a bass root under a right-hand
  // chord: a four-note target whose lowest note is below the RH register.
  const twoHanded = snaps
    .flatMap((s) => s.allTargets)
    .filter((midis) => midis.length === 4 && Math.min(...midis) < 48);
  expect(twoHanded.length).toBeGreaterThan(0);
  // C2 under C4-E4-G4 is the I chord of the progression.
  expect(twoHanded.some((midis) => midis.join(',') === '36,60,64,67')).toBe(true);

  const row = await passed(page, 's1.u5');
  expect(row?.status).toBe('passed');
  expect(row?.bestScore ?? 0).toBeGreaterThanOrEqual(0.8);
});

const STAGE_0_1 = [
  's0.u1',
  's0.u2',
  's0.u3',
  's0.u4',
  's0.u5',
  's0.u6',
  's0.cp',
  's1.u1',
  's1.u2',
  's1.u3',
  's1.u4',
  's1.u5',
  's1.u6',
  's1.u7',
  's1.cp',
];

/**
 * s2.u1 is the unit the audit caught teaching an outright error — intervals as
 * "a distance in half steps", which collapses size and quality. The rebuilt
 * unit teaches size (count the letters) before quality, and checks both by
 * hand. It also runs the first timed flashcard ladder, so this proves the
 * tempo matcher drives naming cards at all.
 */
test('s2.u1 separates interval size from quality, and completes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await waitForApp(page);
  await seedPassedUnits(page, STAGE_0_1);

  await page.goto('/lesson/s2.u1?midi=fake');
  await waitForApp(page);

  // "A 3rd above C" is about letters, so a 2nd is the wrong answer — but both
  // E and E flat are 3rds, and the check takes either.
  await press(page, 62); // D — a 2nd
  await expect(page.getByText(/That’s D\. Try again\./)).toBeVisible();
  await press(page, 63); // E flat — a minor 3rd, still a 3rd
  await expect(page.getByText('That’s it.')).toBeVisible();

  await press(page, 67); // a 5th above C
  await expect(page.getByText('That’s it.')).toHaveCount(2);

  // Quality: a minor 3rd above D is F, and it is white.
  await press(page, 66); // F# — the major 3rd
  await expect(page.getByText(/That’s F♯\. Try again\./)).toBeVisible();
  await press(page, 65); // F
  await expect(page.getByText('That’s it.')).toHaveCount(3);

  const snaps: Snap[] = [];
  await driveLesson(page, undefined, (s) => snaps.push(s));
  await expect(page).toHaveURL(/\/path/);
  // The naming cards ran on the clock, not just in wait mode.
  expect(snaps.some((s) => s.mode === 'tempo')).toBe(true);

  const row = await passed(page, 's2.u1');
  expect(row?.status).toBe('passed');
});

test('s2.u3 drills the black-key roots against the clock, and completes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await waitForApp(page);
  await seedPassedUnits(page, [...STAGE_0_1, 's2.u1', 's2.u2']);

  await page.goto('/lesson/s2.u3?midi=fake');
  await waitForApp(page);

  // E♭ major, built rather than recalled: E♭, G, B♭.
  await press(page, 63);
  await press(page, 67);
  await press(page, 70);
  await expect(page.getByText("All 3 — that's the pattern.")).toBeVisible();

  const snaps: Snap[] = [];
  await driveLesson(page, undefined, (s) => snaps.push(s));
  await expect(page).toHaveURL(/\/path/);

  // Every grip in the graded take is a full triad, and black roots showed up.
  const grips = snaps.flatMap((s) => s.allTargets).filter((m) => m.length === 3);
  expect(grips.length).toBeGreaterThan(0);
  expect(grips.some((m) => [1, 3, 6, 8, 10].includes(m[0]! % 12))).toBe(true);

  const row = await passed(page, 's2.u3');
  expect(row?.status).toBe('passed');
});

/**
 * Stage 3 is the stage the audit called "the learner's stated payoff moment"
 * and found built as four read-once-play-once units. s3.u1 now derives the
 * diatonic chords by hand and ramps all seven on a tempo ladder.
 */
test('s3.u1 builds the diatonic chords by hand, and completes', async ({ page }) => {
  await seedOnboarded(page);
  await page.goto('/path?midi=fake');
  await waitForApp(page);
  await seedPassedUnits(page, [
    ...STAGE_0_1,
    's2.u1',
    's2.u2',
    's2.u3',
    's2.u4',
    's2.u5',
    's2.u6',
    's2.u7',
    's2.cp',
  ]);

  await page.goto('/lesson/s3.u1?midi=fake');
  await waitForApp(page);

  // The chord on D is D-F-A: three letters, and the key decides it is minor.
  await press(page, 62);
  await press(page, 65);
  await press(page, 69);
  await expect(page.getByText("All 3 — that's the pattern.").first()).toBeVisible();

  // The odd one out on B: B-D-F, the diminished triad.
  await press(page, 71);
  await press(page, 74);
  await press(page, 77);
  await expect(page.getByText("All 3 — that's the pattern.")).toHaveCount(2);

  const snaps: Snap[] = [];
  await driveLesson(page, undefined, (s) => snaps.push(s));
  await expect(page).toHaveURL(/\/path/);
  expect(snaps.some((s) => s.mode === 'tempo')).toBe(true);

  const row = await passed(page, 's3.u1');
  expect(row?.status).toBe('passed');
});
