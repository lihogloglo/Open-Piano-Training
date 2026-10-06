import {
  trackSchema,
  validateCurriculum,
  type CurriculumContent,
  type Stage,
  type Track,
  type Unit,
} from '../schema';
import { registerSongProvider } from '@/engine/generators/chartPlay';
import { stage0, stage0Units } from './stage0';
import { stage1, stage1Units } from './stage1';
import { stage2, stage2Units } from './stage2';
import { stage3, stage3Units } from './stage3';
import { stage4, stage4Units } from './stage4';
import { stage5, stage5Units } from './stage5';
import { stage6, stage6Units } from './stage6';
import { stage7, stage7Units } from './stage7';
import { getSong } from './songs';
import { readingTrack, readingUnits } from './reading';
import { rhythmTrack, rhythmUnits } from './rhythm';

// Engine looks songs up through this provider (no upward import from engine/).
registerSongProvider(getSong);

export const CURRICULUM: CurriculumContent = {
  stages: [stage0, stage1, stage2, stage3, stage4, stage5, stage6, stage7],
  units: [
    ...stage0Units,
    ...stage1Units,
    ...stage2Units,
    ...stage3Units,
    ...stage4Units,
    ...stage5Units,
    ...stage6Units,
    ...stage7Units,
  ],
};

// Fail fast in dev/test if content is malformed.
validateCurriculum(CURRICULUM);

export const STAGES: Stage[] = CURRICULUM.stages;

/** Courses beside the path. Their units play in the lesson player, but never join the path. */
export const TRACKS: Track[] = [readingTrack, rhythmTrack];
export const TRACK_UNITS: Unit[] = [...readingUnits, ...rhythmUnits];

// Courses use the same unit rules as the path; each track stands in for a stage.
validateCurriculum({
  stages: TRACKS.map((t, i) => ({
    id: t.id,
    ordinal: 100 + i,
    title: t.title,
    tagline: t.title,
    summary: t.summary,
    unitIds: t.unitIds,
  })),
  units: TRACK_UNITS,
});
for (const t of TRACKS) trackSchema.parse(t);

const unitById = new Map([...CURRICULUM.units, ...TRACK_UNITS].map((u) => [u.id, u]));

/** The course a unit belongs to, or undefined for a path unit. */
export function trackOf(unitId: string): Track | undefined {
  return TRACKS.find((t) => t.unitIds.includes(unitId));
}

export function getUnit(id: string): Unit | undefined {
  return unitById.get(id);
}
