import { describe, expect, it } from 'vitest';
import type { Take } from '@/engine/replay';
import type { ExerciseDef, TakeResult } from '@/engine/types';
import type { AtomProgressRow, RatingRow, UnitProgressRow } from './db';
import { BADGES, earnedBadges, findThenVsNowPairs, newlyEarned, THEN_VS_NOW_MIN_DAYS } from './badges';
import { computeRecap, weekEndingSunday } from './stats';
import { buildHeatmap, familyOf, keyOf, FAMILIES, HEATMAP_KEYS } from './heatmap';
import { ATOMS } from './atoms';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 7, 1); // 2026-08-01

function result(over: Partial<TakeResult> = {}): TakeResult {
  return {
    pitchAccuracy: 1,
    timingAccuracy: 1,
    score: 0.9,
    stars: 3,
    judgments: [],
    passed: true,
    ...over,
  };
}

function take(
  over: Omit<Partial<Take>, 'exercise'> & { exercise?: Partial<ExerciseDef> } = {},
): Take {
  const { exercise, ...rest } = over;
  return {
    id: `t${Math.random()}`,
    atomIds: [],
    exercise: {
      generator: 'chord-grip',
      params: {},
      mode: 'wait',
      rung: 'chord-symbols',
      hand: 'rh',
      seedPolicy: 'random',
      resolvedSeed: 1,
      ...exercise,
    },
    startedAt: T0,
    bpm: null,
    events: [],
    result: result(),
    ...rest,
  };
}

function atomRow(atomId: string, over: Partial<AtomProgressRow> = {}): AtomProgressRow {
  return {
    atomId,
    fsrs: {},
    introducedAt: T0,
    lastSeenAt: T0,
    bestScore: 0.9,
    attempts: 1,
    fluent: false,
    ...over,
  };
}

const EMPTY = {
  takes: [] as Take[],
  units: [] as UnitProgressRow[],
  atoms: [] as AtomProgressRow[],
  sessionCount: 0,
  onboarded: false,
  viewedThenVsNow: false,
};

describe('badges', () => {
  it('a fresh database has earned nothing', () => {
    expect(earnedBadges(EMPTY).size).toBe(0);
  });

  it('first-note needs both onboarding and a real take', () => {
    expect(earnedBadges({ ...EMPTY, onboarded: true }).has('first-note')).toBe(false);
    expect(earnedBadges({ ...EMPTY, onboarded: true, takes: [take()] }).has('first-note')).toBe(true);
  });

  it('first-song comes from a passed chart', () => {
    const failed = take({ exercise: { generator: 'chart-play' }, result: result({ passed: false }) });
    expect(earnedBadges({ ...EMPTY, takes: [failed] }).has('first-song')).toBe(false);
    const passed = take({ exercise: { generator: 'chart-play' } });
    expect(earnedBadges({ ...EMPTY, takes: [passed] }).has('first-song')).toBe(true);
  });

  it('smooth-operator needs three stars on a voice-led take', () => {
    const twoStar = take({
      exercise: { generator: 'progression-play', params: { voiceLead: 'smooth' } },
      result: result({ stars: 2 }),
    });
    expect(earnedBadges({ ...EMPTY, takes: [twoStar] }).has('smooth-operator')).toBe(false);
    const threeStar = take({
      exercise: { generator: 'progression-play', params: { voiceLead: 'smooth' } },
    });
    expect(earnedBadges({ ...EMPTY, takes: [threeStar] }).has('smooth-operator')).toBe(true);
  });

  it('circle-complete needs all twelve key signatures', () => {
    const eleven = Array.from({ length: 11 }, (_, i) => atomRow(`keysig:k${i}:major`));
    expect(earnedBadges({ ...EMPTY, atoms: eleven }).has('circle-complete')).toBe(false);
    expect(
      earnedBadges({ ...EMPTY, atoms: [...eleven, atomRow('keysig:k11:major')] }).has('circle-complete'),
    ).toBe(true);
  });

  it('deep-groove needs a comp atom that actually went fluent', () => {
    const notYet = [atomRow('comp:straight8', { fluent: false })];
    expect(earnedBadges({ ...EMPTY, atoms: notYet }).has('deep-groove')).toBe(false);
    const fluent = [atomRow('comp:straight8', { fluent: true })];
    expect(earnedBadges({ ...EMPTY, atoms: fluent }).has('deep-groove')).toBe(true);
  });

  it('centurion counts sessions', () => {
    expect(earnedBadges({ ...EMPTY, sessionCount: 99 }).has('centurion')).toBe(false);
    expect(earnedBadges({ ...EMPTY, sessionCount: 100 }).has('centurion')).toBe(true);
  });

  it('newlyEarned reports only the difference', () => {
    const fresh = newlyEarned(new Set(['first-note']), new Set(['first-note', 'first-song']));
    expect(fresh.map((b) => b.id)).toEqual(['first-song']);
  });

  it('every badge has a title and criterion', () => {
    for (const b of BADGES) {
      expect(b.title.length).toBeGreaterThan(0);
      expect(b.criterion.length).toBeGreaterThan(0);
    }
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
});

describe('then vs now', () => {
  it('pairs the same atom across at least four weeks', () => {
    const atomId = 'chord:c:maj:inv0';
    const pairs = findThenVsNowPairs([
      take({ atomIds: [atomId], startedAt: T0 }),
      take({ atomIds: [atomId], startedAt: T0 + 40 * DAY }),
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.daysApart).toBe(40);
    expect(pairs[0]?.label).toBe(ATOMS.get(atomId)?.label);
  });

  it('ignores takes that are too close together', () => {
    const atomId = 'chord:c:maj:inv0';
    const pairs = findThenVsNowPairs([
      take({ atomIds: [atomId], startedAt: T0 }),
      take({ atomIds: [atomId], startedAt: T0 + (THEN_VS_NOW_MIN_DAYS - 1) * DAY }),
    ]);
    expect(pairs).toEqual([]);
  });

  it('takes the widest span for an atom, best gap first', () => {
    const pairs = findThenVsNowPairs([
      take({ atomIds: ['a'], startedAt: T0 }),
      take({ atomIds: ['a'], startedAt: T0 + 30 * DAY }),
      take({ atomIds: ['a'], startedAt: T0 + 60 * DAY }),
      take({ atomIds: ['b'], startedAt: T0 }),
      take({ atomIds: ['b'], startedAt: T0 + 90 * DAY }),
    ]);
    expect(pairs.map((p) => p.atomId)).toEqual(['b', 'a']);
    expect(pairs[1]?.daysApart).toBe(60);
  });
});

describe('weekly recap', () => {
  it('files under the coming Sunday', () => {
    expect(weekEndingSunday('2026-09-02')).toBe('2026-09-06'); // Wed → Sun
    expect(weekEndingSunday('2026-09-06')).toBe('2026-09-06'); // Sun → itself
  });

  it('counts only the recap week', () => {
    const recap = computeRecap({
      today: '2026-09-02',
      practiceMinutes: {
        '2026-08-25': 30, // before the window
        '2026-09-01': 20,
        '2026-09-02': 15,
      },
      sessionDates: ['2026-08-25', '2026-09-01', '2026-09-02'],
      atoms: [],
      ratings: [],
      takes: [],
    });
    expect(recap.from).toBe('2026-08-31');
    expect(recap.weekEnding).toBe('2026-09-06');
    expect(recap.minutes).toBe(35);
    expect(recap.sessions).toBe(2);
    expect(recap.dismissed).toBe(false);
  });

  it('reports rating movement against the level before the week', () => {
    const ratings: RatingRow[] = [
      {
        strand: 'keys',
        level: 24,
        history: [
          { date: '2026-08-20', level: 20 },
          { date: '2026-09-01', level: 24 },
        ],
      },
    ];
    const recap = computeRecap({
      today: '2026-09-02',
      practiceMinutes: {},
      sessionDates: [],
      atoms: [],
      ratings,
      takes: [],
    });
    expect(recap.ratingDeltas).toEqual([{ strand: 'keys', from: 20, to: 24 }]);
  });

  it('an idle week reports zeros rather than nothing', () => {
    const recap = computeRecap({
      today: '2026-09-02',
      practiceMinutes: {},
      sessionDates: [],
      atoms: [],
      ratings: [],
      takes: [],
    });
    expect(recap.minutes).toBe(0);
    expect(recap.sessions).toBe(0);
    expect(recap.newAtoms).toEqual([]);
    expect(recap.highlight).toBeNull();
  });
});

describe('heatmap', () => {
  it('classifies atoms into families', () => {
    expect(familyOf(ATOMS.get('scale:c:major:rh:1oct')!)).toBe('scales');
    expect(familyOf(ATOMS.get('chord:c:maj:inv0')!)).toBe('triads');
    expect(familyOf(ATOMS.get('chord:c:maj:inv1')!)).toBe('inversions');
    expect(familyOf(ATOMS.get('prog:i-iv-v:c')!)).toBe('progressions');
    expect(familyOf(ATOMS.get('theory:degrees')!)).toBeNull();
  });

  it('resolves keys onto the circle of fifths', () => {
    expect(keyOf(ATOMS.get('scale:c:major:rh:1oct')!)).toBe('C');
    expect(keyOf(ATOMS.get('prog:i-iv-v:g')!)).toBe('G');
    expect(keyOf(ATOMS.get('theory:degrees')!)).toBeNull();
  });

  it('is fully gray with no progress', () => {
    const cells = buildHeatmap([]);
    expect(cells).toHaveLength(HEATMAP_KEYS.length * FAMILIES.length);
    expect(cells.every((c) => c.value === 0 && c.tracked === 0)).toBe(true);
  });

  it('tracked-but-not-fluent still reads as started, fluent reads brighter', () => {
    const started = buildHeatmap([atomRow('chord:c:maj:inv0', { fluent: false })]);
    const cell = started.find((c) => c.key === 'C' && c.family === 'triads')!;
    expect(cell.value).toBeGreaterThan(0);
    expect(cell.tracked).toBe(1);

    const fluent = buildHeatmap([atomRow('chord:c:maj:inv0', { fluent: true })]);
    const brighter = fluent.find((c) => c.key === 'C' && c.family === 'triads')!;
    expect(brighter.value).toBeGreaterThan(cell.value);
  });

  it('never brightens a cell the learner has not touched', () => {
    const cells = buildHeatmap([atomRow('chord:c:maj:inv0', { fluent: true })]);
    for (const cell of cells) {
      if (cell.key === 'C' && cell.family === 'triads') continue;
      expect(cell.value, `${cell.key}/${cell.family}`).toBe(0);
    }
  });

  it('cells carry their atoms so a click can drill them', () => {
    const cells = buildHeatmap([]);
    const cMajorScales = cells.find((c) => c.key === 'C' && c.family === 'scales')!;
    expect(cMajorScales.atomIds.length).toBeGreaterThan(0);
  });
});
