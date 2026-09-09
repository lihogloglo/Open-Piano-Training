import { tr } from '@/i18n';
import { generate } from '@/engine/generators';
import type { ExerciseDef } from '@/engine/types';
import { preferencesSchema } from './preferences';
import { z } from 'zod';
import { exerciseDefSchema } from '@/curriculum/schema';
import { getUnit } from '@/curriculum/content';
import { ATOMS } from './atoms';

const score = z.number().min(0).max(1);
const time = z.number().finite().nonnegative();
const id = z.string().min(1).max(200);
const date = z.string().refine((s) => Number.isFinite(Date.parse(s)), 'Invalid date');
const unitId = id.refine((s) => !!getUnit(s), tr('Unknown lesson'));
const judgment = z.object({
  targetIndex: z.number().int().min(-1),
  midi: z.number().int(),
  verdict: z.enum(['perfect', 'good', 'ok', 'wrong', 'extra', 'missed']),
  deltaMs: z.number().finite().nullable(),
});
const result = z.object({
  pitchAccuracy: score,
  timingAccuracy: score,
  score,
  stars: z.number().int().min(0).max(3),
  passed: z.boolean(),
  judgments: z.array(judgment),
  firstAnswerAccuracy: score.optional(),
  responseTimesMs: z.array(time).optional(),
  hintsUsed: time.optional(),
  vlScore: score.optional(),
});
const kv = z.object({ key: id, value: z.unknown() });
const block = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('new'),
    unitId,
    title: id,
    minutes: time,
    endStep: z.number().int().positive().optional(),
  }),
  z.object({
    kind: z.literal('review'),
    atomIds: z.array(id),
    minutes: time,
    retests: z.array(z.object({ key: id, unitId, stepId: id, exercise: exerciseDefSchema })).optional(),
  }),
  z.object({
    kind: z.literal('warmup'),
    exercises: z.array(z.object({ atomId: id, def: exerciseDefSchema })),
    minutes: time,
  }),
  z.object({
    kind: z.literal('create'),
    title: id,
    prompt: z.string(),
    basePrompt: z.string().optional(),
    reviewAtomId: id.optional(),
    minutes: time,
  }),
]);

export const backupSchema = z.object({
  app: z.literal('keysense'),
  schemaVersion: z.literal(1),
  exportedAt: date.optional(),
  preferences: preferencesSchema.optional(),
  tables: z
    .object({
      takes: z.array(
        z.object({
          id,
          atomIds: z.array(id),
          unitId: unitId.optional(),
          sessionId: id.optional(),
          exercise: exerciseDefSchema.extend({ resolvedSeed: z.number().finite() }),
          startedAt: time,
          bpm: z.number().positive().nullable(),
          events: z.array(
            z.tuple([
              time,
              z.number().int().min(0).max(127),
              z.union([z.literal(0), z.literal(1)]),
              z.number().int().min(0).max(127),
            ]),
          ),
          result,
        }),
      ),
      unitProgress: z.array(
        z.object({
          unitId,
          status: z.enum(['locked', 'available', 'in-progress', 'passed']),
          bestScore: score,
          flagged: z.boolean().optional(),
          completedAt: time.optional(),
        }),
      ),
      atomProgress: z.array(
        z.object({
          atomId: id,
          introducedAt: time,
          lastSeenAt: time,
          bestScore: score,
          lastScore: score.optional(),
          attempts: time,
          fluent: z.boolean(),
          fsrs: z.object({
            due: date,
            stability: time,
            difficulty: time,
            elapsed_days: time,
            scheduled_days: time,
            learning_steps: time,
            reps: time,
            lapses: time,
            state: z.number().int().min(0).max(3),
            last_review: date.optional(),
          }),
        }),
      ),
      ratings: z.array(
        z.object({
          strand: z.enum(['keys', 'theory', 'ear', 'read', 'create']),
          level: z.number().finite(),
          history: z.array(z.object({ date, level: z.number().finite() })),
        }),
      ),
      sessions: z.array(
        z.object({
          id,
          date,
          state: z.enum(['fresh', 'partial', 'done']),
          plan: z
            .object({
              id,
              date,
              blocks: z.array(block),
              completedBlocks: z.array(z.number().int().nonnegative()),
              catchUp: z.boolean(),
            })
            .refine((p) => p.completedBlocks.every((i) => i < p.blocks.length), tr('Invalid session block')),
        }),
      ),
      settings: z.array(kv),
      meta: z.array(kv),
    })
    .strict(),
});

function validateExercise(def: ExerciseDef, seed = 1): void {
  const instance = generate(def, seed);
  if (instance.targets.length === 0) throw new Error(tr('Empty saved exercise'));
}

function validateRetest(value: unknown): void {
  const r = z.object({ unitId, stepId: id, exercise: exerciseDefSchema }).parse(value);
  if (!getUnit(r.unitId)?.steps.some((s) => s.id === r.stepId && s.kind === 'graded'))
    throw new Error(tr('Unknown retest step'));
  validateExercise(r.exercise);
}

export function validateBackup(json: string): z.infer<typeof backupSchema> {
  const data = backupSchema.parse(JSON.parse(json));
  for (const [name, rows] of Object.entries(data.tables)) {
    const keys = rows.map((row) => {
      const r = row as Record<string, unknown>;
      return r['id'] ?? r['unitId'] ?? r['atomId'] ?? r['strand'] ?? r['key'];
    });
    if (new Set(keys).size !== keys.length) throw new Error(`Duplicate records in ${name}`);
  }
  for (const row of data.tables.sessions) {
    if (row.id !== row.plan.id || row.date !== row.plan.date)
      throw new Error(tr('Session identity mismatch'));
    for (const block of row.plan.blocks) {
      if (block.kind === 'new' && block.endStep && block.endStep > getUnit(block.unitId)!.steps.length)
        throw new Error(tr('Saved section exceeds lesson length'));
      if (block.kind === 'warmup')
        for (const item of block.exercises) {
          if (!ATOMS.has(item.atomId)) throw new Error(tr('Unknown warmup skill'));
          validateExercise(item.def);
        }
      if (block.kind === 'review') for (const retest of block.retests ?? []) validateRetest(retest);
      if (block.kind === 'review' && block.atomIds.some((id) => !ATOMS.has(id)))
        throw new Error(tr('Unknown review skill'));
    }
  }
  if (data.tables.atomProgress.some((row) => !ATOMS.has(row.atomId)))
    throw new Error(tr('Unknown tracked skill'));
  if (data.tables.takes.some((row) => row.atomIds.some((id) => !ATOMS.has(id))))
    throw new Error(tr('Unknown skill in recording'));
  for (const row of data.tables.meta) {
    if (row.key === 'practiceDays') z.record(z.string(), time).parse(row.value);
    if (row.key.startsWith('lessonResume:')) {
      const resume = z
        .object({
          stepId: id,
          seed: z.number().int().nonnegative().optional(),
          scores: z.array(score),
          flagged: z.boolean(),
          ladders: z.record(z.string(), z.array(z.boolean())),
          assessments: z
            .record(
              z.string(),
              z.object({
                result,
                exercise: exerciseDefSchema,
                seed: z.number().finite(),
                failCount: z.number().int().nonnegative(),
                practiceOnly: z.boolean(),
              }),
            )
            .optional(),
        })
        .parse(row.value);
      const unit = getUnit(row.key.slice(13));
      if (!unit?.steps.some((s) => s.id === resume.stepId)) throw new Error(tr('Unknown saved lesson step'));
      for (const [stepId, lit] of Object.entries(resume.ladders)) {
        const step = unit.steps.find((s) => s.id === stepId);
        if (step?.kind !== 'ladder' || lit.length !== step.tempos.length)
          throw new Error(tr('Invalid saved tempo ladder'));
      }
      for (const [stepId, outcome] of Object.entries(resume.assessments ?? {})) {
        if (!unit.steps.some((s) => s.id === stepId && s.kind === 'graded'))
          throw new Error(tr('Unknown assessment step'));
        validateExercise(outcome.exercise, outcome.seed);
      }
    }
    if (row.key.startsWith('retest:')) validateRetest(row.value);
    if (row.key.startsWith('study:')) z.object({ title: id, completedAt: time }).parse(row.value);
  }
  return data;
}
