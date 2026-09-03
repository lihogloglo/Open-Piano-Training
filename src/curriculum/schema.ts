import { z } from 'zod';
import type { ExerciseDef } from '@/engine/types';

export type Strand = 'ear' | 'theory' | 'keys' | 'read' | 'create';

const strandEnum = z.enum(['ear', 'theory', 'keys', 'read', 'create']);
const handEnum = z.enum(['rh', 'lh', 'both']);
const rungEnum = z.enum(['keys-lit', 'note-names', 'chord-symbols', 'lead-sheet', 'by-ear']);
const tierEnum = z.enum(['relaxed', 'standard', 'strict']);

export const exerciseDefSchema = z.object({
  generator: z.string(),
  params: z.record(z.string(), z.unknown()),
  mode: z.enum(['wait', 'tempo']),
  bpm: z.number().int().min(30).max(220).optional(),
  timingTier: tierEnum.optional(),
  rung: rungEnum,
  hand: handEnum,
  seedPolicy: z.enum(['fixed', 'daily', 'random']),
}) satisfies z.ZodType<ExerciseDef>;

export const demoScriptSchema = z.object({
  events: z.array(
    z.object({ midi: z.number().int().min(21).max(108), atBeat: z.number(), durBeats: z.number() }),
  ),
  bpm: z.number().int().min(30).max(220),
  loop: z.boolean().default(false),
});

export const keyContextSchema = z.object({ tonic: z.string(), mode: z.enum(['major', 'minor']) });

export const explainBlockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), md: z.string().max(700) }),
  z.object({ kind: z.literal('keyboardDemo'), demo: demoScriptSchema, caption: z.string().optional() }),
  z.object({
    kind: z.literal('progressionCard'),
    roman: z.array(z.string()).min(1),
    key: keyContextSchema,
    songRefs: z.array(z.string()).optional(),
  }),
  z.object({ kind: z.literal('circleOfFifths'), highlight: z.array(z.string()).optional() }),
  z.object({
    kind: z.literal('earCheck'),
    question: z.string(),
    demo: demoScriptSchema,
    options: z.array(z.string()).min(2).max(4),
    correctIndex: z.number().int().min(0),
  }),
  /**
   * The teaching half of a unit with hands on the keys: the learner has to play
   * the thing before the explanation moves on. Never *gates* Continue — a
   * learner with no MIDI device must still be able to read the lesson — but it
   * answers, and a wrong note is named back rather than buzzed.
   */
  z.object({
    kind: z.literal('playCheck'),
    ask: z.string().max(120),
    /** Note names without octave that satisfy it; any octave counts. */
    notes: z.array(z.string()).min(1),
    /** How many accepted notes to collect before the check is satisfied. */
    count: z.number().int().min(1).max(12).default(1),
    /** What makes a second hit count: a new octave of the same name, or a new name. */
    distinct: z.enum(['octave', 'name']).default('octave'),
    hint: z.string().max(160).optional(),
  }),
]);
export type ExplainBlock = z.infer<typeof explainBlockSchema>;

export const lessonStepSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('explain'), id: z.string(), blocks: z.array(explainBlockSchema).min(1) }),
  z.object({ kind: z.literal('guided'), id: z.string(), exercise: exerciseDefSchema }),
  z.object({
    kind: z.literal('ladder'),
    id: z.string(),
    exercise: exerciseDefSchema,
    tempos: z.array(z.number().min(0.3).max(1)).min(1),
  }),
  z.object({
    kind: z.literal('graded'),
    id: z.string(),
    exercise: exerciseDefSchema,
    passScore: z.number().min(0.5).max(1).default(0.8),
  }),
  z.object({
    kind: z.literal('create'),
    id: z.string(),
    prompt: z.string(),
    /** Palette/backing description; free play, unscored. */
    exercise: exerciseDefSchema.optional(),
  }),
]);
export type LessonStep = z.infer<typeof lessonStepSchema>;

export const unitSchema = z.object({
  id: z.string().regex(/^s\d+\.(u\d+|cp)$/),
  stageId: z.string().regex(/^s\d+$/),
  ordinal: z.number().int().min(0),
  title: z.string().min(3).max(60),
  strandWeights: z.partialRecord(strandEnum, z.number()).default({}),
  concepts: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  steps: z.array(lessonStepSchema).min(1),
  minutes: z.number().int().min(2).max(30),
  kind: z.enum(['lesson', 'checkpoint']),
});
export type Unit = z.infer<typeof unitSchema>;

export const stageSchema = z.object({
  id: z.string().regex(/^s\d+$/),
  ordinal: z.number().int().min(0),
  title: z.string(),
  tagline: z.string(),
  summary: z.string(),
  unitIds: z.array(z.string()).min(1),
});
export type Stage = z.infer<typeof stageSchema>;

export interface CurriculumContent {
  stages: Stage[];
  units: Unit[];
}

/** Validates shape AND referential integrity; throws with a readable message. */
export function validateCurriculum(content: CurriculumContent): void {
  const unitIds = new Set<string>();
  for (const unit of content.units) {
    unitSchema.parse(unit);
    if (unitIds.has(unit.id)) throw new Error(`Duplicate unit id: ${unit.id}`);
    unitIds.add(unit.id);
  }
  const stageIds = new Set<string>();
  for (const stage of content.stages) {
    stageSchema.parse(stage);
    if (stageIds.has(stage.id)) throw new Error(`Duplicate stage id: ${stage.id}`);
    stageIds.add(stage.id);
    for (const uid of stage.unitIds) {
      if (!unitIds.has(uid)) throw new Error(`Stage ${stage.id} references missing unit ${uid}`);
    }
  }
  for (const unit of content.units) {
    if (!stageIds.has(unit.stageId))
      throw new Error(`Unit ${unit.id} references missing stage ${unit.stageId}`);
    for (const p of unit.prerequisites) {
      if (!unitIds.has(p)) throw new Error(`Unit ${unit.id} has missing prerequisite ${p}`);
    }
  }
  // Prerequisite graph must be acyclic (DFS).
  const byId = new Map(content.units.map((u) => [u.id, u]));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string): void => {
    if (done.has(id)) return;
    if (visiting.has(id)) throw new Error(`Prerequisite cycle involving ${id}`);
    visiting.add(id);
    for (const p of byId.get(id)?.prerequisites ?? []) visit(p);
    visiting.delete(id);
    done.add(id);
  };
  for (const unit of content.units) visit(unit.id);
}
