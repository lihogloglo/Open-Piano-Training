import { db } from './db';
import type { ExerciseDef, TakeResult } from '@/engine/types';

export interface SavedAssessment {
  result: TakeResult;
  exercise: ExerciseDef;
  seed: number;
  failCount: number;
  practiceOnly: boolean;
}

export interface LessonResume {
  stepId: string;
  scores: number[];
  flagged: boolean;
  ladders: Record<string, boolean[]>;
  assessments?: Record<string, SavedAssessment>;
}

export const resumeKey = (unitId: string): string => `lessonResume:${unitId}`;
export async function saveResume(unitId: string, resume: LessonResume): Promise<void> {
  await db.meta.put({ key: resumeKey(unitId), value: resume });
}

export async function queueRetest(unitId: string, stepId: string, exercise: ExerciseDef): Promise<void> {
  await db.meta.put({ key: `retest:${unitId}:${stepId}`, value: { unitId, stepId, exercise } });
}
