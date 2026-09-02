import type { ExerciseDef } from '@/engine/types';
import type { Strand, Unit } from '@/curriculum/schema';
import { CURRICULUM } from '@/curriculum/content';

export interface SkillAtom {
  id: string;
  kind: string; // first id segment: note | fivefinger | theory | rhythm | scale | chord | prog | keysig | spell | ear | …
  strand: Strand;
  label: string;
  /** 1..100, from the difficulty rule in 07-progress-scheduling. */
  difficulty: number;
  introducedIn: string; // unit id
  /** Review drill; null = tracked but not directly drillable. */
  drill: ExerciseDef | null;
}

const KIND_BASE: Record<string, number> = {
  note: 5,
  fivefinger: 8,
  keysig: 10,
  theory: 10,
  rhythm: 10,
  spell: 10,
  chord: 15,
  scale: 20,
  ear: 25,
  prog: 30,
  voicing: 40,
  comp: 45,
  skill: 70,
};

const KIND_STRAND: Record<string, Strand> = {
  note: 'keys',
  fivefinger: 'keys',
  scale: 'keys',
  chord: 'keys',
  prog: 'keys',
  voicing: 'keys',
  comp: 'keys',
  skill: 'keys',
  rhythm: 'keys',
  theory: 'theory',
  keysig: 'theory',
  spell: 'theory',
  ear: 'ear',
};

const ACCIDENTAL_TONICS = new Set(['c#', 'db', 'd#', 'eb', 'f#', 'gb', 'g#', 'ab', 'a#', 'bb']);

function cap(s: string): string {
  return (s[0]?.toUpperCase() ?? '') + s.slice(1);
}

function pretty(tonic: string): string {
  return cap(tonic)
    .replace('#', '♯')
    .replace(/(?<=.)b/, '♭');
}

/** Difficulty rule (07): kind base + accidentals + inversion + hands + variant bumps. */
export function atomDifficulty(id: string): number {
  const [kind = '', ...rest] = id.split(':');
  let d = KIND_BASE[kind] ?? 20;
  for (const seg of rest) {
    if (ACCIDENTAL_TONICS.has(seg)) d += 2;
    if (/^inv[123]$/.test(seg)) d += 5 * Number(seg.slice(3));
    if (seg === 'both') d += 5;
    if (seg === 'harmminor' || seg === 'blues') d += 8;
  }
  return Math.max(1, Math.min(100, d));
}

function drillFor(id: string): ExerciseDef | null {
  const parts = id.split(':');
  const kind = parts[0];
  if (kind === 'note' && parts[1] === 'find' && parts[2]) {
    return {
      generator: 'note-find',
      params: { notes: [cap(parts[2])], count: 5 },
      mode: 'wait',
      rung: 'keys-lit',
      hand: 'rh',
      seedPolicy: 'random',
    };
  }
  if (kind === 'fivefinger' && parts[1] && parts[2] && parts[3]) {
    const hand = parts[3] === 'lh' ? 'lh' : 'rh';
    return {
      generator: 'five-finger',
      params: { tonic: cap(parts[1]), quality: parts[2] === 'min' ? 'min' : 'maj', hand, pattern: 'updown' },
      mode: 'tempo',
      bpm: 80,
      timingTier: 'relaxed',
      rung: 'keys-lit',
      hand,
      seedPolicy: 'random',
    };
  }
  if (kind === 'scale' && parts[1] && parts[2] && parts[3]) {
    const hand = parts[3] === 'lh' ? 'lh' : 'rh';
    return {
      generator: 'scale-run',
      params: { tonic: cap(parts[1]), scaleType: scaleTypeOf(parts[2]), hand, direction: 'up' },
      mode: 'tempo',
      bpm: 70,
      timingTier: 'standard',
      rung: 'keys-lit',
      hand,
      seedPolicy: 'random',
    };
  }
  if (kind === 'chord' && parts[1] && parts[2]) {
    const inversion = parts[3]?.startsWith('inv') ? Number(parts[3].slice(3)) : 0;
    return {
      generator: 'chord-grip',
      params: { root: cap(parts[1]), quality: parts[2], inversion },
      mode: 'wait',
      rung: 'chord-symbols',
      hand: 'rh',
      seedPolicy: 'random',
    };
  }
  return null;
}

function scaleTypeOf(seg: string): string {
  const map: Record<string, string> = {
    major: 'major',
    natminor: 'natural-minor',
    harmminor: 'harmonic-minor',
    majorpent: 'major-pentatonic',
    minorpent: 'minor-pentatonic',
    blues: 'blues',
  };
  return map[seg] ?? 'major';
}

function labelFor(id: string): string {
  const parts = id.split(':');
  const kind = parts[0];
  if (kind === 'note') return `Find ${pretty(parts[2] ?? '?')}`;
  if (kind === 'fivefinger') {
    return `${pretty(parts[1] ?? '?')} ${parts[2] === 'min' ? 'minor' : 'major'} five-finger · ${(parts[3] ?? '').toUpperCase()}`;
  }
  if (kind === 'scale')
    return `${pretty(parts[1] ?? '?')} ${parts[2] ?? ''} scale · ${(parts[3] ?? '').toUpperCase()}`;
  if (kind === 'chord') {
    const inv = parts[3]?.startsWith('inv')
      ? ` · ${['root', '1st inv', '2nd inv', '3rd inv'][Number(parts[3].slice(3))]}`
      : '';
    return `${pretty(parts[1] ?? '?')} ${parts[2] ?? ''}${inv}`;
  }
  return id.replace(/:/g, ' · ');
}

function buildRegistry(): Map<string, SkillAtom> {
  const registry = new Map<string, SkillAtom>();
  for (const unit of CURRICULUM.units as Unit[]) {
    for (const id of unit.concepts) {
      if (registry.has(id)) continue;
      const kind = id.split(':')[0] ?? '';
      registry.set(id, {
        id,
        kind,
        strand: KIND_STRAND[kind] ?? 'keys',
        label: labelFor(id),
        difficulty: atomDifficulty(id),
        introducedIn: unit.id,
        drill: drillFor(id),
      });
    }
  }
  return registry;
}

export const ATOMS: ReadonlyMap<string, SkillAtom> = buildRegistry();

export function getAtom(id: string): SkillAtom | undefined {
  return ATOMS.get(id);
}
