import { targetMidis } from '@/engine/matcher/setMatch';
import { useRunStore } from './runStore';

export interface RunSnapshot {
  phase: string;
  mode: 'wait' | 'tempo' | null;
  targetIndex: number;
  targetCount: number;
  currentTargetMidis: number[];
  allTargets: number[][];
  atBeats: number[];
  anchorT0Perf: number | null;
  bpm: number | null;
  spacing: number;
}

declare global {
  interface Window {
    __runTest?: { snapshot(): RunSnapshot };
  }
}

/** Dev/test observability hook (used by the Playwright driver and the lab). */
export function installRunTestBridge(): void {
  window.__runTest = {
    snapshot(): RunSnapshot {
      const s = useRunStore.getState();
      const spacing = s.instance?.beatsPerTarget ?? 1;
      const targets = s.instance?.targets ?? [];
      return {
        phase: s.phase,
        mode: s.instance?.def.mode ?? null,
        targetIndex: s.targetIndex,
        targetCount: targets.length,
        currentTargetMidis: targets[s.targetIndex] ? targetMidis(targets[s.targetIndex]!) : [],
        allTargets: targets.map(targetMidis),
        atBeats: targets.map((t, i) => t.atBeat ?? i * spacing),
        anchorT0Perf: s.anchorT0Perf,
        bpm: s.bpm,
        spacing,
      };
    },
  };
}
