import { CIRCLE_OF_FIFTHS } from '@/theory/keys';
import { ATOMS, type SkillAtom } from './atoms';
import type { AtomProgressRow } from './db';

/**
 * The Progress heatmap (05 §Progress): 12 keys × skill families, each cell
 * colored by how fluent that corner of the keyboard is. A cell is only ever
 * as bright as the learner's real data — untracked material stays gray.
 */
export type SkillFamily = 'scales' | 'triads' | 'inversions' | 'sevenths' | 'progressions';

export const FAMILIES: readonly { id: SkillFamily; label: string }[] = [
  { id: 'scales', label: 'Scales' },
  { id: 'triads', label: 'Triads' },
  { id: 'inversions', label: 'Inversions' },
  { id: 'sevenths', label: 'Sevenths' },
  { id: 'progressions', label: 'Progressions' },
];

export const HEATMAP_KEYS: readonly string[] = CIRCLE_OF_FIFTHS;

/** Which family an atom belongs to, or null if it isn't heatmap material. */
export function familyOf(atom: SkillAtom): SkillFamily | null {
  const parts = atom.id.split(':');
  const kind = parts[0];
  if (kind === 'scale' || kind === 'fivefinger') return 'scales';
  if (kind === 'prog' || kind === 'prog-smooth') return 'progressions';
  if (kind === 'chord') {
    const quality = parts[2] ?? '';
    if (['maj7', 'm7', '7', 'm7b5', 'dim7'].includes(quality)) return 'sevenths';
    const inv = parts[3] ?? '';
    return /^inv[123]$/.test(inv) ? 'inversions' : 'triads';
  }
  if (kind === 'spell') {
    const tail = parts.slice(1).join(':');
    if (tail === 'triad:inversions') return 'inversions';
    if (tail.startsWith('triad')) return 'triads';
    return 'sevenths';
  }
  return null;
}

/** The key an atom lives in, normalized to a circle-of-fifths label. */
export function keyOf(atom: SkillAtom): string | null {
  const parts = atom.id.split(':');
  const kind = parts[0];
  let raw: string | undefined;
  if (kind === 'scale' || kind === 'fivefinger' || kind === 'chord') raw = parts[1];
  else if (kind === 'prog' || kind === 'prog-smooth' || kind === 'keysig') raw = parts[2];
  if (!raw || raw === 'all') return null;
  const tonic = raw.endsWith('m') && raw.length > 1 ? raw.slice(0, -1) : raw;
  const display = tonic.length > 1 ? tonic[0]!.toUpperCase() + tonic.slice(1) : tonic.toUpperCase();
  const canonical = HEATMAP_KEYS.find((k) => k.toLowerCase() === display.toLowerCase());
  return canonical ?? null;
}

export interface HeatCell {
  key: string;
  family: SkillFamily;
  /** 0 = untracked, else mean fluency 0..1 across the cell's tracked atoms. */
  value: number;
  tracked: number;
  fluent: number;
  /** Atoms behind the cell, for "drill this now". */
  atomIds: string[];
}

/**
 * Cell value blends coverage with quality: a key with one fluent scale out of
 * four tracked reads dimmer than one with all four. Honest by construction —
 * nothing brightens a cell except graded takes.
 */
export function buildHeatmap(progress: readonly AtomProgressRow[]): HeatCell[] {
  const byAtom = new Map(progress.map((p) => [p.atomId, p]));
  const cells = new Map<string, HeatCell>();
  for (const key of HEATMAP_KEYS) {
    for (const { id: family } of FAMILIES) {
      cells.set(`${key}|${family}`, { key, family, value: 0, tracked: 0, fluent: 0, atomIds: [] });
    }
  }
  for (const atom of ATOMS.values()) {
    const family = familyOf(atom);
    const key = keyOf(atom);
    if (!family || !key) continue;
    const cell = cells.get(`${key}|${family}`);
    if (!cell) continue;
    cell.atomIds.push(atom.id);
    const row = byAtom.get(atom.id);
    if (!row) continue;
    cell.tracked += 1;
    if (row.fluent) cell.fluent += 1;
  }
  for (const cell of cells.values()) {
    if (cell.tracked === 0) continue;
    const coverage = cell.atomIds.length > 0 ? cell.tracked / cell.atomIds.length : 0;
    const quality = cell.fluent / cell.tracked;
    cell.value = Math.min(1, 0.35 * coverage + 0.65 * quality);
    // A tracked-but-never-fluent cell must still read as "started".
    if (cell.value < 0.12) cell.value = 0.12;
  }
  return [...cells.values()];
}
