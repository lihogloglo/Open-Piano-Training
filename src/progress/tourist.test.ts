import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('./db', () => ({
  db: { meta: { put: mock.put, delete: mock.del } },
}));

import { isTourist, setTouristMode } from './tourist';
import { clearResume, queueRetest, saveResume } from './lessonResume';

const RESUME = { stepId: 's0.u1.a', scores: [], flagged: false, ladders: {} };
const EXERCISE = { generator: 'note-find', params: {}, mode: 'wait', rung: 'by-ear', hand: 'rh' } as never;

beforeEach(() => {
  mock.put.mockReset();
  mock.del.mockReset();
});

afterEach(() => setTouristMode(false));

describe('tourist flag', () => {
  it('is off until it is turned on', () => {
    expect(isTourist()).toBe(false);
    setTouristMode(true);
    expect(isTourist()).toBe(true);
    setTouristMode(false);
    expect(isTourist()).toBe(false);
  });
});

describe('progress writes under tourist mode', () => {
  it('records a resume point and a retest as usual when it is off', async () => {
    await saveResume('s0.u1', RESUME);
    await queueRetest('s0.u1', 's0.u1.g', EXERCISE);
    expect(mock.put).toHaveBeenCalledTimes(2);
  });

  it('writes nothing when it is on', async () => {
    setTouristMode(true);
    await saveResume('s0.u1', RESUME);
    await queueRetest('s0.u1', 's0.u1.g', EXERCISE);
    expect(mock.put).not.toHaveBeenCalled();
  });

  it('keeps a real resume point that a tourist visits', async () => {
    setTouristMode(true);
    await clearResume('s0.u1');
    expect(mock.del).not.toHaveBeenCalled();
    setTouristMode(false);
    await clearResume('s0.u1');
    expect(mock.del).toHaveBeenCalledWith('lessonResume:s0.u1');
  });
});
