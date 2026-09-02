import { describe, expect, it } from 'vitest';
import { ATOMS } from './atoms';
import { generate } from '@/engine/generators';
import {
  BAND,
  CHALLENGE_ITEMS,
  MAX_LEVEL,
  MIN_LEVEL,
  applyChallengeResult,
  bandAtoms,
  buildChallenge,
  clampLevel,
  eligibleAtoms,
  initialLevel,
  itemPassed,
  levelDelta,
  levelDisplay,
  supportedLevelRange,
  suggestedStrands,
  type RatingStrand,
} from './ratings';
import type { RatingRow } from './db';

const allTracked = new Set([...ATOMS.keys()]);

function trackedOf(strand: RatingStrand): Set<string> {
  return new Set([...ATOMS.values()].filter((a) => a.strand === strand).map((a) => a.id));
}

describe('atom drills', () => {
  it('every drillable atom generates a usable exercise', () => {
    const failures: string[] = [];
    for (const atom of ATOMS.values()) {
      if (!atom.drill) continue;
      try {
        const inst = generate(atom.drill, 7);
        if (inst.targets.length === 0) failures.push(`${atom.id}: no targets`);
      } catch (err) {
        failures.push(`${atom.id}: ${(err as Error).message}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('theory and ear atoms are drillable (ratings depend on it)', () => {
    for (const strand of ['keys', 'theory', 'ear'] as const) {
      const drillable = [...ATOMS.values()].filter((a) => a.strand === strand && a.drill);
      expect(drillable.length, strand).toBeGreaterThanOrEqual(2);
    }
  });

  it('progression atoms resolve through the catalog', () => {
    const axis = ATOMS.get('prog:i-v-vi-iv:c');
    expect(axis?.drill?.generator).toBe('progression-play');
    expect(axis?.drill?.params['roman']).toEqual(['I', 'V', 'vi', 'IV']);
    const smooth = ATOMS.get('prog-smooth:i-v-vi-iv:g');
    expect(smooth?.drill?.params['voiceLead']).toBe('smooth');
    expect((smooth?.drill?.params['key'] as { tonic: string }).tonic).toBe('G');
  });
});

describe('rating ladder', () => {
  it('display number reads like an ELO', () => {
    expect(levelDisplay(34)).toBe(340);
  });

  it('ladder steps per spec', () => {
    expect(levelDelta(10)).toBe(2);
    expect(levelDelta(8)).toBe(2);
    expect(levelDelta(7)).toBe(1);
    expect(levelDelta(6)).toBe(1);
    expect(levelDelta(5)).toBe(0);
    expect(levelDelta(4)).toBe(0);
    expect(levelDelta(3)).toBe(-1);
    expect(levelDelta(0)).toBe(-1);
  });

  it('an item passes at 0.8', () => {
    expect(itemPassed(0.79)).toBe(false);
    expect(itemPassed(0.8)).toBe(true);
  });

  it('challenges draw only from tracked atoms of the strand', () => {
    const tracked = trackedOf('theory');
    const items = buildChallenge('theory', initialLevel('theory', tracked), tracked, 3);
    expect(items).toHaveLength(CHALLENGE_ITEMS);
    for (const item of items) {
      expect(tracked.has(item.atomId)).toBe(true);
      expect(ATOMS.get(item.atomId)?.strand).toBe('theory');
    }
  });

  it('untracked material can never appear (the path unlocks, the rating proves)', () => {
    const onlyEasy = new Set(
      [...ATOMS.values()].filter((a) => a.strand === 'keys' && a.difficulty <= 10).map((a) => a.id),
    );
    const level = initialLevel('keys', onlyEasy);
    for (const item of buildChallenge('keys', level, onlyEasy, 11)) {
      expect(onlyEasy.has(item.atomId)).toBe(true);
    }
  });

  it('items sit inside the level band', () => {
    const tracked = trackedOf('keys');
    const range = supportedLevelRange('keys', tracked)!;
    for (const item of buildChallenge('keys', range.max, tracked, 5)) {
      const d = ATOMS.get(item.atomId)!.difficulty;
      expect(d).toBeGreaterThanOrEqual(range.max - BAND);
      expect(d).toBeLessThanOrEqual(range.max + BAND);
    }
  });

  it('challenge items always use fresh seeds', () => {
    const tracked = trackedOf('keys');
    for (const item of buildChallenge('keys', initialLevel('keys', tracked), tracked, 2)) {
      expect(item.def.seedPolicy).toBe('random');
    }
  });

  it('the level is capped by what has been taught', () => {
    const onlyEasy = new Set(
      [...ATOMS.values()].filter((a) => a.strand === 'keys' && a.difficulty <= 10).map((a) => a.id),
    );
    const range = supportedLevelRange('keys', onlyEasy)!;
    expect(clampLevel(90, 'keys', onlyEasy)).toBe(range.max);
    expect(range.max).toBeLessThan(30);
  });

  it('promotion holds at the ceiling instead of running away', () => {
    const tracked = trackedOf('ear');
    const range = supportedLevelRange('ear', tracked)!;
    const out = applyChallengeResult('ear', range.max, 10, tracked);
    expect(out.after).toBe(range.max);
    expect(out.delta).toBe(0);
    expect(out.verdict).toBe('hold');
  });

  it('demotion floors at the bottom of the supported range', () => {
    const tracked = trackedOf('theory');
    const range = supportedLevelRange('theory', tracked)!;
    const out = applyChallengeResult('theory', range.min, 0, tracked);
    expect(out.after).toBe(range.min);
    expect(out.verdict).toBe('hold');
  });

  it('a full ladder walk promotes then settles at the ceiling', () => {
    const tracked = trackedOf('keys');
    const range = supportedLevelRange('keys', tracked)!;
    let level = range.min;
    for (let i = 0; i < 100; i++) level = applyChallengeResult('keys', level, 10, tracked).after;
    expect(level).toBe(range.max);
    for (let i = 0; i < 100; i++) level = applyChallengeResult('keys', level, 0, tracked).after;
    expect(level).toBe(range.min);
  });

  it('levels stay inside the absolute bounds for any pass count', () => {
    const tracked = allTracked;
    for (let passed = 0; passed <= 10; passed++) {
      for (const strand of ['keys', 'theory', 'ear'] as const) {
        const start = initialLevel(strand, tracked);
        const out = applyChallengeResult(strand, start, passed, tracked);
        expect(out.after).toBeGreaterThanOrEqual(MIN_LEVEL);
        expect(out.after).toBeLessThanOrEqual(MAX_LEVEL);
      }
    }
  });

  it('a strand with too little material is not challengeable', () => {
    const almostNothing = new Set<string>([...trackedOf('ear')].slice(0, 1));
    expect(supportedLevelRange('ear', almostNothing)).toBeNull();
    expect(bandAtoms('ear', 25, new Set())).toEqual([]);
    expect(eligibleAtoms('ear', new Set())).toEqual([]);
  });

  it('suggests a strand weekly, and not before', () => {
    const tracked = allTracked;
    const ratings = new Map<string, RatingRow>([
      ['keys', { strand: 'keys', level: 20, history: [{ date: '2026-08-30', level: 20 }] }],
    ]);
    const today = '2026-09-02'; // 3 days after the keys challenge
    const suggested = suggestedStrands(ratings, today, () => tracked);
    expect(suggested).not.toContain('keys');
    expect(suggested).toContain('ear');
    const later = suggestedStrands(ratings, '2026-09-08', () => tracked);
    expect(later).toContain('keys');
  });
});
