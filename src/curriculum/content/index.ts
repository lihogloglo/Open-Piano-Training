import { validateCurriculum, type CurriculumContent, type Stage, type Unit } from '../schema';
import { registerSongProvider } from '@/engine/generators/chartPlay';
import { stage0, stage0Units } from './stage0';
import { stage1, stage1Units } from './stage1';
import { stage2, stage2Units } from './stage2';
import { getSong } from './songs';

// Engine looks songs up through this provider (no upward import from engine/).
registerSongProvider(getSong);

export const CURRICULUM: CurriculumContent = {
  stages: [stage0, stage1, stage2],
  units: [...stage0Units, ...stage1Units, ...stage2Units],
};

// Fail fast in dev/test if content is malformed.
validateCurriculum(CURRICULUM);

export const STAGES: Stage[] = CURRICULUM.stages;
const unitById = new Map(CURRICULUM.units.map((u) => [u.id, u]));

export function getUnit(id: string): Unit | undefined {
  return unitById.get(id);
}
