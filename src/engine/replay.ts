import type { ExerciseDef, TakeResult } from './types';

/** [dtMs from run start, midi, 0=off/1=on, velocity 0..127] */
export type CompactEvent = [number, number, 0 | 1, number];

export interface Take {
  id: string;
  atomIds: string[];
  unitId?: string;
  sessionId?: string;
  exercise: ExerciseDef & { resolvedSeed: number };
  startedAt: number; // epoch ms
  bpm: number | null;
  events: CompactEvent[];
  result: TakeResult;
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** ULID-format id (sortable by time); crypto-random tail. */
export function makeTakeId(now = Date.now()): string {
  let time = now;
  let timePart = '';
  for (let i = 0; i < 10; i++) {
    timePart = CROCKFORD[time % 32] + timePart;
    time = Math.floor(time / 32);
  }
  let rand = '';
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < 16; i++) rand += CROCKFORD[(bytes[i] ?? 0) % 32];
  return timePart + rand;
}

/** Accumulates raw note events during a run and finalizes a Take. */
export class TakeRecorder {
  private events: CompactEvent[] = [];
  private readonly startedAtEpoch = Date.now();
  private readonly startedAtPerf: number;

  constructor(startPerf: number) {
    this.startedAtPerf = startPerf;
  }

  record(kind: 'noteon' | 'noteoff', midi: number, velocity: number, tPerf: number): void {
    this.events.push([
      Math.max(0, Math.round(tPerf - this.startedAtPerf)),
      midi,
      kind === 'noteon' ? 1 : 0,
      Math.round(velocity * 127),
    ]);
  }

  finalize(
    exercise: ExerciseDef,
    resolvedSeed: number,
    result: TakeResult,
    extra: { atomIds?: string[]; unitId?: string; sessionId?: string; bpm?: number | null } = {},
  ): Take {
    return {
      id: makeTakeId(),
      atomIds: extra.atomIds ?? [],
      ...(extra.unitId !== undefined ? { unitId: extra.unitId } : {}),
      ...(extra.sessionId !== undefined ? { sessionId: extra.sessionId } : {}),
      exercise: { ...exercise, resolvedSeed },
      startedAt: this.startedAtEpoch,
      bpm: extra.bpm ?? null,
      events: this.events,
      result,
    };
  }
}
