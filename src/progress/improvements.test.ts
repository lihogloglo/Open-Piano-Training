import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, exportAll, importAll } from './db';
import { buildSession } from './sessionBuilder';
import {
  loadAtomStates,
  syncReadStrand,
  addPracticeMinutes,
  markBlockComplete,
  resolveRetest,
} from './service';
import { queueRetest, saveResume, resumeKey } from './lessonResume';
import { performanceMilestones } from './performance';
import { CURRICULUM } from '@/curriculum/content';
import { MUSIC_STUDIES, PIECES } from '@/curriculum/content/musicianship';
import { generate } from '@/engine/generators';
import { WaitMatcher } from '@/engine/matcher/waitMatcher';
import { TempoMatcher } from '@/engine/matcher/tempoMatcher';
import { targetMidis } from '@/engine/matcher/setMatch';
import type { ExerciseDef, TakeResult } from '@/engine/types';
import { TakeRecorder } from '@/engine/replay';

beforeEach(async () => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(() => vi.unstubAllGlobals());

const def: ExerciseDef = {
  generator: 'note-find',
  params: { notes: ['C', 'F'], count: 12 },
  mode: 'wait',
  hand: 'rh',
  rung: 'note-names',
  seedPolicy: 'fixed',
  assessment: true,
};

describe('assessment integrity', () => {
  it('replays a focused retry with the same targets but no assessment credit', () => {
    const original = generate({ ...def, mode: 'tempo' }, 23);
    const focused = generate({ ...def, mode: 'tempo', focus: { start: 3, end: 6 } }, 23);
    expect(focused.targets.map(targetMidis)).toEqual(original.targets.slice(3, 6).map(targetMidis));
    expect(focused.targets[0]?.atBeat).toBe(0);
    expect(focused.def.assessment).toBe(false);
    expect(focused.prompt.perTarget).toEqual(original.prompt.perTarget?.slice(3, 6));
  });
  it('fails note searching and records response time without giving assessment hints', () => {
    const instance = generate(def, 1);
    const matcher = new WaitMatcher(instance);
    matcher.start(0);
    let result: TakeResult | undefined;
    let hints = 0;
    for (let i = 0; i < 12; i++) {
      const correct = targetMidis(instance.targets[i]!)[0]!;
      for (const midi of [61, 63, 66, 68, correct]) {
        const events = matcher.feed({ kind: 'noteon', midi, tPerf: i * 1000 + 500 });
        matcher.feed({ kind: 'noteoff', midi, tPerf: i * 1000 + 510 });
        hints += events.filter((e) => e.type === 'hintEligible').length;
        for (const event of events) if (event.type === 'completed') result = event.result;
      }
    }
    expect(result?.passed).toBe(false);
    expect(result?.firstAnswerAccuracy).toBe(0);
    expect(result?.responseTimesMs).toHaveLength(12);
    expect(hints).toBe(0);
  });
  it('a wrong note followed by a correct timed note reduces the score', () => {
    const instance = generate({ ...def, mode: 'tempo', params: { notes: ['C'], count: 1 } }, 1);
    const matcher = new TempoMatcher(instance, 60, 1000);
    matcher.feed({ kind: 'noteon', midi: 61, tPerf: 1000 });
    const end = matcher.feed({ kind: 'noteon', midi: 60, tPerf: 1010 }).find((e) => e.type === 'completed');
    expect(end?.type === 'completed' && end.result.passed).toBe(false);
  });
  it('requires separate days under matching conditions for retention', () => {
    const result: TakeResult = {
      score: 1,
      pitchAccuracy: 1,
      timingAccuracy: 1,
      passed: true,
      stars: 3,
      judgments: [],
    };
    const take = new TakeRecorder(0).finalize({ ...def, bpm: 60 }, 1, result);
    expect(performanceMilestones([take])[0]?.level).toBe('Independent');
    expect(performanceMilestones([take, { ...take, startedAt: take.startedAt + 86400000 }])[0]?.level).toBe(
      'Retained',
    );
    const faster = { ...take, exercise: { ...take.exercise, bpm: 80 }, startedAt: take.startedAt + 86400000 };
    expect(performanceMilestones([take, faster]).every((m) => m.level === 'Independent')).toBe(true);
    expect(performanceMilestones([{ ...take, exercise: { ...take.exercise, assessment: false } }])).toEqual(
      [],
    );
  });
});

describe('progress preservation', () => {
  it('completes concurrent session blocks without lost or duplicate credit', async () => {
    const plan = {
      id: 'test',
      date: '2026-09-06',
      completedBlocks: [],
      catchUp: false,
      blocks: [
        { kind: 'create', title: 'One', prompt: 'Play', minutes: 1 },
        { kind: 'create', title: 'Two', prompt: 'Play', minutes: 1 },
      ],
    };
    await db.sessions.put({ id: plan.id, date: plan.date, state: 'fresh', plan });
    await Promise.all([
      markBlockComplete('test', 0, 1),
      markBlockComplete('test', 1, 1),
      markBlockComplete('test', 0, 1),
    ]);
    const row = await db.sessions.get('test');
    expect(row?.state).toBe('done');
    expect((row?.plan as { completedBlocks: number[] }).completedBlocks.sort()).toEqual([0, 1]);
    expect((await db.meta.get('practiceDays'))?.value).toEqual({ '2026-09-06': 2 });
  });
  it('preserves smooth-chord metrics and all valid MIDI note numbers in backups', async () => {
    const take = new TakeRecorder(0).finalize(def, 1, {
      score: 1,
      pitchAccuracy: 1,
      timingAccuracy: 1,
      stars: 3,
      passed: true,
      judgments: [],
    });
    const recorded = {
      ...take,
      result: { ...take.result, vlScore: 0.92 },
      events: [
        [0, 12, 1, 90],
        [100, 12, 0, 0],
      ] as typeof take.events,
    };
    await db.takes.put(recorded);
    const json = await exportAll();
    await db.takes.clear();
    await importAll(json);
    const restored = await db.takes.get(take.id);
    expect(restored?.events[0]?.[1]).toBe(12);
    expect((restored?.result as unknown as { vlScore: number }).vlScore).toBe(0.92);
  });
  it('retains reading history when disabled, but removes it from scheduling', async () => {
    await syncReadStrand(true);
    const initial = await db.atomProgress.toArray();
    await db.atomProgress.update(initial[0]!.atomId, { bestScore: 0.95, attempts: 12 });
    await syncReadStrand(false);
    expect(await db.atomProgress.count()).toBe(6);
    expect(await loadAtomStates()).toHaveLength(0);
    await syncReadStrand(true);
    expect((await db.atomProgress.get(initial[0]!.atomId))?.attempts).toBe(12);
  });
  it('backs up preferences, lesson resume, and reading state together', async () => {
    localStorage.setItem(
      'ks.settings.v1',
      JSON.stringify({ onboarded: true, latencyOffsetMs: 42, largePractice: true }),
    );
    await syncReadStrand(true);
    await saveResume('s0.u1', { stepId: 's0.u1.g1', scores: [], flagged: false, ladders: {} });
    const json = await exportAll();
    await Promise.all(db.tables.map((t) => t.clear()));
    localStorage.setItem('ks.settings.v1', '{}');
    await importAll(json);
    expect(JSON.parse(localStorage.getItem('ks.settings.v1')!).latencyOffsetMs).toBe(42);
    expect(await db.atomProgress.count()).toBe(6);
    expect(await db.meta.get(resumeKey('s0.u1'))).toBeDefined();
  });
  it('rejects malformed and duplicate records before changing existing data', async () => {
    await db.meta.put({ key: 'sentinel', value: true });
    const valid = JSON.parse(await exportAll());
    valid.tables.unitProgress = [{ unitId: 's0.u1', status: 'passed', bestScore: 8 }];
    await expect(importAll(JSON.stringify(valid))).rejects.toThrow();
    expect(await db.meta.get('sentinel')).toBeDefined();
    valid.tables.unitProgress = [];
    valid.tables.meta = [
      { key: 'x', value: 1 },
      { key: 'x', value: 2 },
    ];
    await expect(importAll(JSON.stringify(valid))).rejects.toThrow('Duplicate');
    expect(await db.meta.get('sentinel')).toBeDefined();
  });
  it('clears a flag only after its exact retests pass', async () => {
    await db.unitProgress.put({ unitId: 's0.u1', status: 'passed', bestScore: 0.4, flagged: true });
    await queueRetest('s0.u1', 's0.u1.q1', def);
    await queueRetest('s0.u1', 's0.u1.other', def);
    await resolveRetest('retest:s0.u1:s0.u1.q1');
    expect((await db.unitProgress.get('s0.u1'))?.flagged).toBe(true);
    await resolveRetest('retest:s0.u1:s0.u1.other');
    expect((await db.unitProgress.get('s0.u1'))?.flagged).toBe(false);
  });
  it('serializes concurrent time updates', async () => {
    await Promise.all([addPracticeMinutes('2026-09-06', 0.5), addPracticeMinutes('2026-09-06', 0.25)]);
    expect((await db.meta.get('practiceDays'))?.value).toEqual({ '2026-09-06': 0.75 });
  });
});

describe('practice content', () => {
  it('rotates safe beginner tasks and draws later creative work only from completed lessons', () => {
    const base = {
      next: null,
      dailyMinutes: 20,
      stageOrdinal: 0,
      atomStates: [],
      date: '2026-09-06',
      now: new Date('2026-09-06'),
    };
    const challenge = (date: string, learnedUnitIds: string[] = []) =>
      buildSession({ ...base, date, learnedUnitIds }).blocks.find((b) => b.kind === 'create');
    expect(challenge('2026-09-06')).not.toEqual(challenge('2026-09-07'));
    expect(challenge('2026-09-06', ['s0.u1'])?.title).toBe('Meet the keyboard');
    expect(challenge('2026-09-06', ['s0.u2'])?.title).toBe('Every note has a name');
  });
  it('fits every lesson into each available daily budget', () => {
    for (const next of CURRICULUM.units)
      for (const dailyMinutes of [10, 15, 20, 30]) {
        const plan = buildSession({
          next,
          dailyMinutes,
          stageOrdinal: 5,
          atomStates: [],
          date: '2026-09-06',
          now: new Date('2026-09-06'),
        });
        expect(
          plan.blocks.reduce((n, b) => n + b.minutes, 0),
          next.id,
        ).toBeLessThanOrEqual(dailyMinutes);
      }
  });
  it('all practical lessons and piece arrangements generate playable timelines', () => {
    for (const study of MUSIC_STUDIES) {
      for (const accompaniment of [[], study.bass, study.chords]) {
        const notes = [...study.notes, ...accompaniment];
        expect(Math.max(...notes.map((n) => n.atBeat + n.durBeats))).toBeLessThanOrEqual(
          study.bars * study.beatsPerBar,
        );
        const instance = generate(
          {
            ...def,
            generator: 'phrase',
            mode: 'tempo',
            params: { title: study.title, notes, beatsPerBar: study.beatsPerBar },
          },
          1,
        );
        expect(instance.targets.length).toBeGreaterThan(0);
        const matcher = new TempoMatcher(instance, 60, 0);
        expect(() => matcher.finish()).not.toThrow();
      }
    }
    expect(PIECES.every((p) => p.bars === 8 && p.bass.length > 0 && p.chords.length > 0)).toBe(true);
  });
});
