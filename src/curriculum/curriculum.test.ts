import { describe, expect, it } from 'vitest';
import { CURRICULUM, getUnit } from './content';
import { validateCurriculum } from './schema';
import { buildPath, nodeStatuses, nextUnit, type UnitProgressLike } from './path';
import { GENERATORS, generate } from '@/engine/generators';

describe('curriculum content', () => {
  it('validates (shape, referential integrity, acyclic prerequisites)', () => {
    expect(() => validateCurriculum(CURRICULUM)).not.toThrow();
  });

  it('every exercise references a real generator and actually generates', () => {
    for (const unit of CURRICULUM.units) {
      for (const step of unit.steps) {
        if (step.kind === 'explain') continue;
        if (step.kind === 'create' && !step.exercise) continue;
        const def = step.kind === 'create' ? step.exercise! : step.exercise;
        expect(GENERATORS[def.generator], `${unit.id}/${step.id} generator ${def.generator}`).toBeDefined();
        // Generation must not throw, across several seeds.
        for (const seed of [1, 42, 20260901]) {
          const inst = generate(def, seed);
          expect(inst.targets.length, `${unit.id}/${step.id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('tempo exercises always carry a bpm', () => {
    for (const unit of CURRICULUM.units) {
      for (const step of unit.steps) {
        if (step.kind === 'explain' || step.kind === 'create') continue;
        if (step.exercise.mode === 'tempo') {
          expect(step.exercise.bpm, `${unit.id}/${step.id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every unit is reachable from the start', () => {
    // Simulate passing everything in order; every unit must become available.
    const progress = new Map<string, UnitProgressLike>();
    let guard = 0;
    for (;;) {
      const next = nextUnit(progress);
      if (!next) break;
      progress.set(next.id, { unitId: next.id, status: 'passed', bestScore: 1 });
      if (++guard > 500) throw new Error('Path did not terminate');
    }
    expect(progress.size).toBe(CURRICULUM.units.length);
  });

  it('rejects broken content', () => {
    expect(() =>
      validateCurriculum({
        stages: [{ id: 's9', ordinal: 9, title: 'X', tagline: 'x', summary: 'x', unitIds: ['s9.u1'] }],
        units: [],
      }),
    ).toThrow(/missing unit/);
    const unit = getUnit('s0.u1');
    expect(unit).toBeDefined();
    expect(() =>
      validateCurriculum({
        stages: CURRICULUM.stages,
        units: CURRICULUM.units.map((u) => (u.id === 's0.u1' ? { ...u, prerequisites: ['s0.cp'] } : u)),
      }),
    ).toThrow(/cycle/i);
  });
});

describe('path', () => {
  it('inserts a review node after every 3rd lesson unit', () => {
    const s0 = buildPath().find((p) => p.stage.id === 's0');
    const kinds = s0?.nodes.map((n) => `${n.kind}:${n.id}`) ?? [];
    // 6 lessons + checkpoint → reviews after u3 and u6
    expect(kinds).toContain('review:s0.r1');
    expect(kinds).toContain('review:s0.r2');
    const idx = (id: string) => kinds.findIndex((k) => k.endsWith(`:${id}`));
    expect(idx('s0.r1')).toBe(idx('s0.u3') + 1);
    expect(idx('s0.r2')).toBe(idx('s0.u6') + 1);
    expect(idx('s0.cp')).toBeGreaterThan(idx('s0.r2'));
  });

  it('unlocks strictly by prerequisites', () => {
    const empty = new Map<string, UnitProgressLike>();
    let statuses = nodeStatuses(empty);
    expect(statuses.get('s0.u1')).toBe('available');
    expect(statuses.get('s0.u2')).toBe('locked');
    expect(statuses.get('s0.r1')).toBe('locked');

    const some = new Map<string, UnitProgressLike>([
      ['s0.u1', { unitId: 's0.u1', status: 'passed', bestScore: 0.9 }],
      ['s0.u2', { unitId: 's0.u2', status: 'passed', bestScore: 0.85 }],
      ['s0.u3', { unitId: 's0.u3', status: 'passed', bestScore: 0.85 }],
    ]);
    statuses = nodeStatuses(some);
    expect(statuses.get('s0.u4')).toBe('available');
    expect(statuses.get('s0.u5')).toBe('locked');
    expect(statuses.get('s0.r1')).toBe('available'); // after u3
    expect(nextUnit(some)?.id).toBe('s0.u4');
  });

  it('review nodes never gate the next unit', () => {
    const some = new Map<string, UnitProgressLike>(
      ['s0.u1', 's0.u2', 's0.u3'].map((id) => [id, { unitId: id, status: 'passed', bestScore: 1 }]),
    );
    // u4 available even though review r1 was never "done"
    expect(nodeStatuses(some).get('s0.u4')).toBe('available');
  });
});
