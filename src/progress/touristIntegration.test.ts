import 'fake-indexeddb/auto';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { db } from './db';
import {
  getTodaySession,
  readTodaySession,
  startWorkout,
  getSession,
  syncReadStrand,
  refreshBadges,
  getRecap,
  markThenVsNowViewed,
  markBlockComplete,
} from './service';
import { setTouristMode } from './tourist';
beforeEach(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null });
  await Promise.all(db.tables.map((t) => t.clear()));
  setTouristMode(true);
});
afterEach(() => {
  setTouristMode(false);
  vi.unstubAllGlobals();
});
it('opens reviews and today without writing any database tables', async () => {
  const date = new Date();
  const workout = await startWorkout(date);
  expect(workout.blocks.length).toBeGreaterThan(0);
  expect(await getSession(workout.id)).toEqual(workout);
  const today = await getTodaySession(date);
  expect(await readTodaySession(date)).toEqual(today);
  await markBlockComplete(workout.id, 0, 5);
  await syncReadStrand(true);
  await refreshBadges();
  await getRecap();
  await markThenVsNowViewed();
  for (const table of db.tables) expect(await table.count(), table.name).toBe(0);
});
it('leaves the real daily plan intact when tourist mode ends', async () => {
  const date = new Date();
  setTouristMode(false);
  const real = await getTodaySession(date);
  setTouristMode(true);
  expect((await getTodaySession(date)).id).not.toBe(real.id);
  setTouristMode(false);
  expect(await getTodaySession(date)).toEqual(real);
});
