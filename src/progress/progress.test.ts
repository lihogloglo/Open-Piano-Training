import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { ATOMS, atomDifficulty } from './atoms';
import { gradeFromScore, newCard, reviewCard, isDue, isFluent, type StoredCard } from './fsrs';
import { buildSession, buildWorkout, localDateString, type AtomState } from './sessionBuilder';
import { computeStreak, weekDots } from './stats';
import { getUnit } from '@/curriculum/content';

const NOW = new Date(2026, 8, 2, 9, 0, 0);

function atomState(atomId: string, overrides: Partial<AtomState> = {}, dueOffset = -1): AtomState {
  const card = newCard(new Date(NOW.getTime() - 10 * 86_400_000));
  const due = new Date(NOW.getTime() + dueOffset * 86_400_000).toISOString();
  return { atomId, fsrs: { ...card, due }, bestScore: 0.85, fluent: false, ...overrides };
}

describe('atoms registry', () => {
  it('registers every Stage 0 concept', () => {
    const unit = getUnit('s0.u2');
    for (const id of unit?.concepts ?? []) expect(ATOMS.get(id), id).toBeDefined();
  });

  it('difficulty rule', () => {
    expect(atomDifficulty('note:find:c')).toBe(5);
    expect(atomDifficulty('fivefinger:c:maj:rh')).toBe(8);
    expect(atomDifficulty('scale:eb:major:rh:1oct')).toBe(22); // 20 + accidental
    expect(atomDifficulty('chord:eb:maj:inv1')).toBe(22); // 15 + 2 + 5
    expect(atomDifficulty('scale:a:harmminor:rh')).toBe(28); // 20 + 8
  });

  it('drillable atoms carry working drills', () => {
    const noteFind = ATOMS.get('note:find:c');
    expect(noteFind?.drill?.generator).toBe('note-find');
    const blackKeys = ATOMS.get('note:find:sharps');
    expect(blackKeys?.label).toBe('Find black keys');
    expect(blackKeys?.drill?.generator).toBe('key-group-find');
    const ff = ATOMS.get('fivefinger:g:maj:lh');
    expect(ff?.drill?.generator).toBe('five-finger');
    expect(ff?.drill?.hand).toBe('lh');
    const theory = ATOMS.get('theory:halfwhole');
    expect(theory?.drill).toBeNull();
  });
});

describe('fsrs wrapper', () => {
  it('grade mapping per spec', () => {
    expect(gradeFromScore(0.79)).toBe(Rating.Again);
    expect(gradeFromScore(0.8)).toBe(Rating.Hard);
    expect(gradeFromScore(0.85)).toBe(Rating.Hard);
    expect(gradeFromScore(0.86)).toBe(Rating.Good);
    expect(gradeFromScore(0.95)).toBe(Rating.Good);
    expect(gradeFromScore(0.96)).toBe(Rating.Easy);
  });

  it('14-day simulation: good reviews grow intervals, failures shrink stability', () => {
    let strong: StoredCard = newCard(new Date(2026, 0, 1));
    let clock = new Date(2026, 0, 1);
    const intervals: number[] = [];
    for (let day = 0; day < 14; day++) {
      if (isDue(strong, clock)) {
        strong = reviewCard(strong, 0.93, clock);
        intervals.push(strong.scheduled_days);
      }
      clock = new Date(clock.getTime() + 86_400_000);
    }
    expect(intervals.length).toBeGreaterThanOrEqual(2);
    expect(intervals[intervals.length - 1]!).toBeGreaterThan(intervals[0]!);

    // Same schedule but failing hurts stability.
    const before = strong.stability;
    const failed = reviewCard(strong, 0.4, clock);
    expect(failed.stability).toBeLessThan(before);
    expect(failed.lapses).toBeGreaterThanOrEqual(1);
  });

  it('fluency needs stability and score', () => {
    const card = newCard(NOW);
    expect(isFluent({ ...card, stability: 45 }, 0.95)).toBe(true);
    expect(isFluent({ ...card, stability: 45 }, 0.85)).toBe(false);
    expect(isFluent({ ...card, stability: 10 }, 0.95)).toBe(false);
  });
});

describe('session builder', () => {
  const next = getUnit('s0.u4')!;

  it('fresh day, stage 0: new + review + create, no warmup', () => {
    const plan = buildSession({
      date: '2026-09-02',
      dailyMinutes: 20,
      next,
      stageOrdinal: 0,
      atomStates: [atomState('note:find:c'), atomState('fivefinger:c:maj:rh')],
      now: NOW,
    });
    const kinds = plan.blocks.map((b) => b.kind);
    expect(kinds).toEqual(['new', 'review', 'create']);
    expect(plan.catchUp).toBe(false);
    const review = plan.blocks.find((b) => b.kind === 'review');
    expect(review && review.kind === 'review' ? review.atomIds.length : 0).toBe(2);
  });

  it('stage 2+ adds a warmup from fluent atoms', () => {
    const plan = buildSession({
      date: '2026-09-02',
      dailyMinutes: 20,
      next,
      stageOrdinal: 2,
      atomStates: [
        atomState('note:find:c', { fluent: true }, 5),
        atomState('fivefinger:c:maj:rh', { fluent: true }, 5),
        atomState('note:find:f'),
      ],
      now: NOW,
    });
    expect(plan.blocks[0]?.kind).toBe('warmup');
  });

  it('25 due atoms: capped at 10 and flagged as catch-up', () => {
    const states = Array.from({ length: 25 }, (_, i) =>
      atomState(i % 2 === 0 ? 'note:find:c' : 'fivefinger:c:maj:rh', {}, -(i + 1)),
    );
    const plan = buildSession({
      date: '2026-09-02',
      dailyMinutes: 30,
      next,
      stageOrdinal: 0,
      atomStates: states,
      now: NOW,
    });
    expect(plan.catchUp).toBe(true);
    const review = plan.blocks.find((b) => b.kind === 'review');
    expect(review && review.kind === 'review' ? review.atomIds.length : 0).toBeLessThanOrEqual(10);
  });

  it('10-minute budget drops warmup and create', () => {
    const plan = buildSession({
      date: '2026-09-02',
      dailyMinutes: 10,
      next,
      stageOrdinal: 3,
      atomStates: [atomState('note:find:c', { fluent: true })],
      now: NOW,
    });
    const kinds = plan.blocks.map((b) => b.kind);
    expect(kinds).not.toContain('warmup');
    expect(kinds).not.toContain('create');
    expect(kinds).toContain('new');
  });

  it('caught-up learner (no next unit) still gets review + create', () => {
    const plan = buildSession({
      date: '2026-09-02',
      dailyMinutes: 20,
      next: null,
      stageOrdinal: 8,
      atomStates: [atomState('note:find:c')],
      now: NOW,
    });
    expect(plan.blocks.map((b) => b.kind)).toEqual(['review', 'create']);
  });

  it('workout builds a review-only plan', () => {
    const plan = buildWorkout({
      date: '2026-09-02',
      atomStates: [atomState('note:find:c'), atomState('theory:halfwhole')], // theory not drillable
      now: NOW,
    });
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0]?.kind).toBe('review');
  });
});

describe('streaks', () => {
  const days = (list: string[]) => new Set(list);

  it('counts consecutive days and pending today', () => {
    const info = computeStreak(days(['2026-09-01', '2026-08-31', '2026-08-30']), '2026-09-02');
    expect(info.streak).toBe(3);
    expect(info.practicedToday).toBe(false);
  });

  it('earns a freeze at 7 days and spends it on a miss', () => {
    const week = [
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
      '2026-08-30',
    ];
    // Miss the 31st, practice the 1st: freeze covers the gap.
    const info = computeStreak(days([...week, '2026-09-01']), '2026-09-01');
    expect(info.streak).toBe(8);
    expect(info.frozenDates).toEqual(['2026-08-31']);
    expect(info.freezes).toBe(0);
  });

  it('a miss with no freeze resets', () => {
    const info = computeStreak(days(['2026-08-28', '2026-08-29', '2026-08-31']), '2026-09-01');
    expect(info.streak).toBe(1);
  });

  it('banks at most two freezes', () => {
    const long: string[] = [];
    for (let i = 0; i < 21; i++) {
      const d = new Date(2026, 7, 1 + i);
      long.push(localDateString(d));
    }
    const info = computeStreak(days(long), '2026-08-21');
    expect(info.freezes).toBe(2);
    expect(info.streak).toBe(21);
  });

  it('weekDots spans Mon..Sun around today', () => {
    const dots = weekDots(days(['2026-09-01']), '2026-09-02'); // Wednesday
    expect(dots).toHaveLength(7);
    expect(dots[0]?.date).toBe('2026-08-31'); // Monday
    expect(dots[1]?.done).toBe(true);
  });
});
