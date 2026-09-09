import { db } from './db';
import { isTourist } from './tourist';
import type { ExerciseDef, TakeResult } from '@/engine/types';

export interface SavedAssessment {
  result: TakeResult;
  exercise: ExerciseDef;
  seed: number;
  failCount: number;
  practiceOnly: boolean;
}

export interface LessonResume {
  seed?: number;
  stepId: string;
  scores: number[];
  flagged: boolean;
  ladders: Record<string, boolean[]>;
  assessments?: Record<string, SavedAssessment>;
}

export const resumeKey = (unitId: string): string => `lessonResume:${unitId}`;
export async function saveResume(unitId: string, resume: LessonResume): Promise<void> {
  if (isTourist()) return;
  await db.meta.put({ key: resumeKey(unitId), value: resume });
}

export async function queueRetest(unitId: string, stepId: string, exercise: ExerciseDef): Promise<void> {
  if (isTourist()) return;
  await db.meta.put({ key: `retest:${unitId}:${stepId}`, value: { unitId, stepId, exercise } });
}

/**
 * Forget a saved resume point. A tourist never writes one, and must not delete
 * the one a real visit to the same unit left behind.
 */
export async function clearResume(unitId: string): Promise<void> {
  if (isTourist()) return;
  await db.meta.delete(resumeKey(unitId));
}
