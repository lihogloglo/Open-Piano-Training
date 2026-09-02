import type { Stage, Unit } from './schema';
import { CURRICULUM, getUnit } from './content';

export type NodeKind = 'lesson' | 'checkpoint' | 'review';
export type NodeStatus = 'locked' | 'available' | 'in-progress' | 'passed';

export interface PathNode {
  id: string;
  kind: NodeKind;
  stageId: string;
  /** Undefined for auto-inserted review nodes. */
  unit?: Unit;
  title: string;
  minutes: number;
}

export interface UnitProgressLike {
  unitId: string;
  status: NodeStatus;
  bestScore: number;
  /** Passed via the fail-3 escape hatch ("passed*"). */
  flagged?: boolean;
}

/**
 * The rendered path: authored units in order, with a review node auto-inserted
 * after every 3rd lesson unit of a stage (05/06). Review nodes are virtual and
 * never gate progress.
 */
export function buildPath(): { stage: Stage; nodes: PathNode[] }[] {
  return CURRICULUM.stages.map((stage) => {
    const nodes: PathNode[] = [];
    let lessonCount = 0;
    let reviewCount = 0;
    for (const unitId of stage.unitIds) {
      const unit = getUnit(unitId);
      if (!unit) continue;
      nodes.push({
        id: unit.id,
        kind: unit.kind,
        stageId: stage.id,
        unit,
        title: unit.title,
        minutes: unit.minutes,
      });
      if (unit.kind === 'lesson') {
        lessonCount += 1;
        if (lessonCount % 3 === 0) {
          reviewCount += 1;
          nodes.push({
            id: `${stage.id}.r${reviewCount}`,
            kind: 'review',
            stageId: stage.id,
            title: 'Review',
            minutes: 5,
          });
        }
      }
    }
    return { stage, nodes };
  });
}

/**
 * Status of every node given stored unit progress. A unit is available when
 * all its prerequisites are passed; review nodes are available when the unit
 * before them is passed and never block anything.
 */
export function nodeStatuses(progress: ReadonlyMap<string, UnitProgressLike>): Map<string, NodeStatus> {
  const statuses = new Map<string, NodeStatus>();
  const unitPassed = (id: string): boolean => progress.get(id)?.status === 'passed';

  for (const { nodes } of buildPath()) {
    let prevRealUnit: Unit | undefined;
    for (const node of nodes) {
      if (node.kind === 'review') {
        statuses.set(node.id, prevRealUnit && unitPassed(prevRealUnit.id) ? 'available' : 'locked');
        continue;
      }
      const unit = node.unit;
      if (!unit) continue;
      const stored = progress.get(unit.id);
      if (stored?.status === 'passed' || stored?.status === 'in-progress') {
        statuses.set(unit.id, stored.status);
      } else {
        const unlocked = unit.prerequisites.every(unitPassed);
        statuses.set(unit.id, unlocked ? 'available' : 'locked');
      }
      prevRealUnit = unit;
    }
  }
  return statuses;
}

/** First available (or in-progress) real unit — "continue here". */
export function nextUnit(progress: ReadonlyMap<string, UnitProgressLike>): Unit | null {
  const statuses = nodeStatuses(progress);
  for (const { nodes } of buildPath()) {
    for (const node of nodes) {
      if (!node.unit) continue;
      const s = statuses.get(node.id);
      if (s === 'available' || s === 'in-progress') return node.unit;
    }
  }
  return null;
}
