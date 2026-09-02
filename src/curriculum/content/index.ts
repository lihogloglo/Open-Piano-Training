import { validateCurriculum, type CurriculumContent, type Stage, type Unit } from '../schema';
import { stage0, stage0Units } from './stage0';

export const CURRICULUM: CurriculumContent = {
  stages: [stage0],
  units: [...stage0Units],
};

// Fail fast in dev/test if content is malformed.
validateCurriculum(CURRICULUM);

export const STAGES: Stage[] = CURRICULUM.stages;
const unitById = new Map(CURRICULUM.units.map((u) => [u.id, u]));

export function getUnit(id: string): Unit | undefined {
  return unitById.get(id);
}
