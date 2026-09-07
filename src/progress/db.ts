import { readPreferences } from './preferences';
import { isTourist } from './tourist';
import { validateBackup } from './backupSchema';
import Dexie, { type EntityTable } from 'dexie';
import type { Take } from '@/engine/replay';
import type { NodeStatus } from '@/curriculum/path';

export interface UnitProgressRow {
  unitId: string;
  status: NodeStatus;
  bestScore: number;
  flagged?: boolean;
  completedAt?: number;
}

export interface AtomProgressRow {
  lastScore?: number;
  atomId: string;
  fsrs: unknown; // ts-fsrs Card, serialized (Phase 4)
  introducedAt: number;
  lastSeenAt: number;
  bestScore: number;
  attempts: number;
  fluent: boolean;
}

export interface RatingRow {
  strand: string;
  level: number;
  history: { date: string; level: number }[];
}

export interface SessionRow {
  id: string;
  date: string; // YYYY-MM-DD local
  plan: unknown; // SessionPlan (Phase 4)
  state: 'fresh' | 'partial' | 'done';
}

export interface KVRow {
  key: string;
  value: unknown;
}

export class KeysenseDb extends Dexie {
  takes!: EntityTable<Take, 'id'>;
  unitProgress!: EntityTable<UnitProgressRow, 'unitId'>;
  atomProgress!: EntityTable<AtomProgressRow, 'atomId'>;
  ratings!: EntityTable<RatingRow, 'strand'>;
  sessions!: EntityTable<SessionRow, 'id'>;
  settings!: EntityTable<KVRow, 'key'>;
  meta!: EntityTable<KVRow, 'key'>;

  constructor() {
    super('keysense');
    this.version(1).stores({
      takes: 'id, startedAt, unitId, *atomIds',
      unitProgress: 'unitId, status',
      atomProgress: 'atomId, fluent, lastSeenAt',
      ratings: 'strand',
      sessions: 'id, date',
      settings: 'key',
      meta: 'key',
    });
  }
}

export const db = new KeysenseDb();

const MAX_TAKES = 500;

/** Persist a take; prune oldest non-best takes past the cap. Never throws. */
export async function saveTake(take: Take): Promise<void> {
  if (isTourist()) return;
  try {
    await db.takes.put(take);
    const count = await db.takes.count();
    if (count > MAX_TAKES) {
      const oldest = await db.takes
        .orderBy('startedAt')
        .limit(count - MAX_TAKES)
        .toArray();
      const prunable = oldest.filter((t) => t.result.stars < 3).map((t) => t.id);
      if (prunable.length > 0) await db.takes.bulkDelete(prunable);
    }
  } catch (err) {
    console.error('saveTake failed:', err);
  }
}

export async function getUnitProgressMap(): Promise<Map<string, UnitProgressRow>> {
  const rows = await db.unitProgress.toArray();
  return new Map(rows.map((r) => [r.unitId, r]));
}

export async function markUnitPassed(unitId: string, score: number, flagged = false): Promise<void> {
  if (isTourist()) return;
  const existing = await db.unitProgress.get(unitId);
  await db.unitProgress.put({
    unitId,
    status: 'passed',
    bestScore: Math.max(existing?.bestScore ?? 0, score),
    flagged,
    completedAt: existing?.completedAt ?? Date.now(),
  });
}

export async function markUnitInProgress(unitId: string): Promise<void> {
  if (isTourist()) return;
  const existing = await db.unitProgress.get(unitId);
  if (existing?.status === 'passed') return;
  await db.unitProgress.put({
    unitId,
    status: 'in-progress',
    bestScore: existing?.bestScore ?? 0,
  });
}

/** Full-database JSON export (Settings → Data). */
export async function exportAll(): Promise<string> {
  const [takes, unitProgress, atomProgress, ratings, sessions, settings, meta] = await Promise.all([
    db.takes.toArray(),
    db.unitProgress.toArray(),
    db.atomProgress.toArray(),
    db.ratings.toArray(),
    db.sessions.toArray(),
    db.settings.toArray(),
    db.meta.toArray(),
  ]);
  return JSON.stringify({
    app: 'keysense',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    preferences: readPreferences(),
    tables: { takes, unitProgress, atomProgress, ratings, sessions, settings, meta },
  });
}

export async function importAll(json: string): Promise<void> {
  const data = validateBackup(json);
  const oldPreferences = typeof localStorage === 'undefined' ? null : localStorage.getItem('ks.settings.v1');
  if (data.preferences && typeof localStorage !== 'undefined') {
    const current = readPreferences();
    localStorage.setItem('ks.settings.v1', JSON.stringify({ ...current, ...data.preferences }));
  }
  try {
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        const rows = data.tables[table.name as keyof typeof data.tables];
        if (rows) {
          await table.clear();
          await table.bulkPut(rows as never[]);
        }
      }
    });
  } catch (error) {
    if (typeof localStorage !== 'undefined' && data.preferences) {
      if (oldPreferences === null) localStorage.removeItem('ks.settings.v1');
      else localStorage.setItem('ks.settings.v1', oldPreferences);
    }
    throw error;
  }
}
