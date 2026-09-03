import { describe, expect, it } from 'vitest';
import { CURRICULUM, getUnit } from './content';
import { getSong } from './content/songs';
import { validateCurriculum, type Unit } from './schema';
import { buildPath, nodeStatuses, nextUnit, type UnitProgressLike } from './path';
import { GENERATORS, generate } from '@/engine/generators';
import { scaleFingering, type Hand, type ScaleType } from '@/theory/scales';
import type { ExerciseDef } from '@/engine/types';

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

  it('teaches all 12 key signatures, so circle-complete is reachable', () => {
    const keysigs = new Set(
      CURRICULUM.units.flatMap((u) => u.concepts.filter((c) => c.startsWith('keysig:'))),
    );
    expect(keysigs.size).toBeGreaterThanOrEqual(12);
  });

  it('every charted song in the curriculum exists in the catalog', () => {
    for (const unit of CURRICULUM.units) {
      for (const step of unit.steps) {
        if (step.kind === 'explain') continue;
        const def = step.kind === 'create' ? step.exercise : step.exercise;
        if (def?.generator !== 'chart-play') continue;
        const songId = def.params['songId'] as string;
        expect(getSong(songId), `${unit.id}/${step.id} → ${songId}`).toBeDefined();
      }
    }
  });

  /**
   * Curriculum lint (content-audit §7.1/§7.2). The zod schema validates shape;
   * this validates *policy* — the minimum teaching grammar a rebuilt unit has
   * to meet. Stages are added to REBUILT as their content is authored, so the
   * bar is enforced from the first stage that claims to clear it rather than
   * waiting for all eight.
   */
  describe('rebuilt stages meet the minimum unit grammar', () => {
    const REBUILT = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'];
    /**
     * A ladder ramps a *motor* pattern. These units teach recognition — find a
     * named key, name a degree by ear — where three reps behind a tempo UI
     * would be three identical reps, so they are exempt by design, not by
     * omission.
     */
    const NO_MOTOR_PATTERN = new Set([
      's0.u1',
      's0.u2',
      's0.u3',
      's1.u3',
      // Harmonization and progression-recognition are choosing tasks whose
      // exercises are wait-mode only (`chord-any` targets cannot be scheduled
      // on a beat grid at all), so there is no tempo to ramp.
      's3.u6',
      's3.u7',
      // Improv and by-ear units: `improv` and `ear-progression` both build
      // `chord-any` targets, so the same wait-mode-only rule applies.
      's7.u1',
      's7.u3',
      's7.u6',
      's7.u7',
    ]);

    const lessons = CURRICULUM.units.filter((u) => REBUILT.includes(u.stageId) && u.kind === 'lesson');

    it.each(lessons.map((u) => [u.id, u] as const))('%s', (_id, unit) => {
      const kinds = unit.steps.map((s) => s.kind);
      expect(kinds, 'needs a practice rep before it tests').toContain('guided');
      if (!NO_MOTOR_PATTERN.has(unit.id)) {
        expect(kinds, 'needs a tempo ladder').toContain('ladder');
      }
      expect(kinds, 'needs a graded take').toContain('graded');

      // The Make strand is never skipped, and never just a printed sentence.
      const create = unit.steps.filter((s) => s.kind === 'create');
      expect(create.length, 'needs a create step').toBeGreaterThan(0);
      for (const step of create) {
        expect(step.kind === 'create' && step.exercise, `${step.id} create has no exercise`).toBeTruthy();
      }

      // No explain step is a slide: every one of them puts hands on keys.
      for (const step of unit.steps) {
        if (step.kind !== 'explain') continue;
        const interactive = step.blocks.some((b) => b.kind === 'playCheck' || b.kind === 'earCheck');
        expect(interactive, `${step.id} has no block that needs playing`).toBe(true);
      }
    });

    it('checkpoints sample the stage with several graded takes', () => {
      for (const stageId of REBUILT) {
        const cp = CURRICULUM.units.find((u) => u.id === `${stageId}.cp`);
        const graded = cp?.steps.filter((s) => s.kind === 'graded') ?? [];
        expect(graded.length, `${stageId}.cp`).toBeGreaterThanOrEqual(5);
      }
    });

    it('teaches with two hands, not just the right one', () => {
      // content-audit §C: two-hand playing was 15% of the course and stage 5
      // ran 32 RH exercises against one for both hands. Per rebuilt stage from
      // s1 on, the left hand has to actually appear.
      for (const stageId of REBUILT.filter((s) => s !== 's0')) {
        const defs = CURRICULUM.units
          .filter((u) => u.stageId === stageId)
          .flatMap((u) => u.steps.map((s) => (s.kind === 'explain' ? null : s.exercise)))
          .filter((d): d is NonNullable<typeof d> => Boolean(d));
        const twoHanded = defs.filter((d) => d.hand === 'both' || d.hand === 'lh');
        expect(twoHanded.length / defs.length, stageId).toBeGreaterThan(0.25);
      }
    });
  });

  /**
   * Rehearsal lint. The grammar lint above proves a unit *has* a ladder. This
   * one proves the ladder ramps the thing the graded take then scores.
   *
   * The rule: a graded take may change the key, the tempo and the length of
   * what the unit rehearsed. It must not introduce a motor pattern the learner
   * has never made — a new scale fingering, a new comp pattern, a new voicing,
   * a new song, or a chord the path never taught.
   *
   * "Rehearsed" means a `guided` or `ladder` step with the same signature, in
   * this unit or in any earlier unit on the path. The path is gated, so a
   * learner reaches unit N having passed everything before it.
   *
   * A tempo-mode take needs a tempo-mode rehearsal at the same signature, and
   * that rehearsal must reach at least the take's BPM. Nobody is scored faster
   * than they were ramped.
   */
  describe('graded takes only score rehearsed material', () => {
    /**
     * What counts as the same motor pattern. Two exercises share a signature
     * when a learner who can play one can play the other after transposing.
     * Key is deliberately absent from every signature: transposing a known
     * shape is the skill the whole curriculum teaches.
     *
     * `null` exempts a generator, for a stated reason.
     *
     * NOTE: rehearsal counts path-wide, not per stage. The path is gated, so a
     * learner reaches unit N having passed every unit before it. A left-hand
     * ladder in s1.u2 does cover a left-hand take in s2.u4.
     */
    function signature(def: ExerciseDef): string | null {
      const p = def.params;
      const s = (k: string): string => String(p[k] ?? '');
      switch (def.generator) {
        case 'scale-run': {
          // The fingering array *is* the motor pattern. C/G/D/A/E/B share one
          // right-hand fingering, so grading E after laddering A is a real
          // transposition test. B-flat, E-flat, A-flat, D-flat and G-flat each
          // have their own, so they are each new material.
          const f = scaleFingering(s('tonic'), s('scaleType') as ScaleType, s('hand') as Hand);
          // Pentatonic and blues carry no published fingering, so there is no
          // motor pattern to compare. Scale type and hand are all we can check.
          return `scale:${s('scaleType')}:${s('hand')}:${f ? f.join('') : 'none'}`;
        }
        case 'five-finger':
          // Five fingers on five notes, 1-5 in every key. Only the hand differs.
          return `fivefinger:${s('hand')}`;
        case 'chord-grip':
        case 'grip-interleave':
          return `grip:${def.hand}`;
        case 'flashcard':
          return `flashcard:${s('kind')}`;
        case 'progression-play':
          // The texture is the motor pattern. The chord order is not: rotating
          // a loop is what s3.u4 teaches. Chord vocabulary is checked below.
          return `prog:${p['style'] ?? 'block'}:${p['voicing'] ?? 'triad'}:${p['voiceLead'] ?? 'free'}:${def.hand}`;
        case 'chart-play':
          // A new song is new bars and a new form, not a transposition.
          return `chart:${s('songId')}:${p['style'] ?? 'block'}:${p['voicing'] ?? 'triad'}`;
        case 'improv':
          return `improv:${s('palette')}:${p['targetDownbeats'] === true}`;
        // Exempt, each for a reason:
        // - unseen-chart is unseen by design; rehearsing it would defeat it.
        // - note-find and the ear generators recognise, they do not execute a
        //   pattern, which is the same reason NO_MOTOR_PATTERN exempts their
        //   units from the ladder rule.
        default:
          return null;
      }
    }

    /** Items a graded take may only draw from what was rehearsed. */
    function pool(def: ExerciseDef): string[] {
      const p = def.params;
      const arr = (k: string): string[] => (Array.isArray(p[k]) ? (p[k] as unknown[]).map(String) : []);
      switch (def.generator) {
        case 'chord-grip':
          return [`q:${String(p['quality'] ?? '')}`];
        case 'grip-interleave':
          return [...arr('qualities').map((q) => `q:${q}`), ...arr('inversions').map((i) => `inv:${i}`)];
        case 'flashcard':
          return [...arr('qualities').map((q) => `q:${q}`), ...arr('intervals').map((i) => `int:${i}`)];
        default:
          return [];
      }
    }

    /** Roman numerals a take asks the learner to play. */
    function romans(def: ExerciseDef): string[] {
      if (def.generator === 'progression-play' || def.generator === 'improv') {
        const r = def.params['roman'];
        return Array.isArray(r) ? r.map(String) : [];
      }
      if (def.generator === 'chart-play') {
        const song = getSong(String(def.params['songId'] ?? ''));
        return song ? [...song.romanized] : [];
      }
      return [];
    }

    const defOf = (step: Unit['steps'][number]): ExerciseDef | null =>
      step.kind === 'explain' ? null : (step.exercise ?? null);

    /** Every roman numeral played anywhere on the path, by stage ordinal. */
    const romansBefore = new Map<string, number>();
    for (const stage of CURRICULUM.stages) {
      for (const unitId of stage.unitIds) {
        for (const step of getUnit(unitId)?.steps ?? []) {
          const def = defOf(step);
          if (!def || step.kind === 'graded') continue;
          for (const r of romans(def)) {
            if (!romansBefore.has(r)) romansBefore.set(r, stage.ordinal);
          }
        }
      }
    }

    // Rehearsals accumulate along the path, so a rep in an earlier unit still
    // covers a later take.
    const seen = new Map<string, { pool: Set<string>; maxTempoBpm: number }>();

    for (const stage of CURRICULUM.stages) {
      const lessons = stage.unitIds.map((id) => getUnit(id)).filter((u): u is Unit => u?.kind === 'lesson');

      for (const unit of lessons) {
        for (const step of unit.steps) {
          if (step.kind !== 'guided' && step.kind !== 'ladder') continue;
          const sig = signature(step.exercise);
          if (!sig) continue;
          const row = seen.get(sig) ?? { pool: new Set<string>(), maxTempoBpm: 0 };
          for (const item of pool(step.exercise)) row.pool.add(item);
          if (step.exercise.mode === 'tempo') {
            row.maxTempoBpm = Math.max(row.maxTempoBpm, step.exercise.bpm ?? 0);
          }
          seen.set(sig, row);
        }

        const graded = unit.steps.filter((s) => s.kind === 'graded');
        if (graded.length === 0) continue;

        it(`${unit.id}`, () => {
          for (const step of graded) {
            if (step.kind !== 'graded') continue;
            const def = step.exercise;
            const sig = signature(def);
            const where = `${unit.id}/${step.id} (${def.generator})`;

            if (sig) {
              const row = seen.get(sig);
              expect(row, `${where}: nothing on the path rehearses "${sig}"`).toBeDefined();
              if (row) {
                for (const item of pool(def)) {
                  expect(row.pool, `${where}: "${item}" is graded but never rehearsed`).toContain(item);
                }
                if (def.mode === 'tempo') {
                  expect(
                    row.maxTempoBpm,
                    `${where}: graded at ${def.bpm ?? 0} BPM, but "${sig}" was only ever taken to ${row.maxTempoBpm} BPM`,
                  ).toBeGreaterThanOrEqual(def.bpm ?? 0);
                }
              }
            }

            for (const r of romans(def)) {
              const first = romansBefore.get(r);
              expect(
                first !== undefined && first <= stage.ordinal,
                `${where}: chord "${r}" is graded but the path never teaches it first`,
              ).toBe(true);
            }
          }
        });
      }
    }
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
