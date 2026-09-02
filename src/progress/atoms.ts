import type { ExerciseDef } from '@/engine/types';
import type { Strand, Unit } from '@/curriculum/schema';
import { CURRICULUM } from '@/curriculum/content';
import { PROGRESSION_CATALOG } from '@/theory/progressions';
import type { ChordQuality } from '@/theory/chords';

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
  'prog-smooth': 30,
  pattern: 20,
  create: 20,
  song: 20,
  voicing: 40,
  comp: 45,
  texture: 35,
  improv: 50,
  read: 15,
  skill: 70,
};

const KIND_STRAND: Record<string, Strand> = {
  note: 'keys',
  fivefinger: 'keys',
  scale: 'keys',
  chord: 'keys',
  prog: 'keys',
  'prog-smooth': 'keys',
  pattern: 'keys',
  song: 'keys',
  create: 'create',
  voicing: 'keys',
  comp: 'keys',
  texture: 'keys',
  improv: 'create',
  read: 'read',
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
  if (kind === 'spell') return spellDrill(parts);
  if (kind === 'keysig' && parts[1]) return keysigDrill(parts);
  if (kind === 'ear') return earDrill(parts);
  if (kind === 'prog' || kind === 'prog-smooth') return progDrill(kind, parts);
  if (kind === 'song' && parts[1]) {
    return {
      generator: 'chart-play',
      params: { songId: parts[1] },
      mode: 'tempo',
      bpm: 72,
      timingTier: 'relaxed',
      rung: 'lead-sheet',
      hand: 'rh',
      seedPolicy: 'random',
    };
  }
  return null;
}

const ALL_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHROMATIC_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function spellCard(roots: string[], qualities: ChordQuality[], count = 8): ExerciseDef {
  return {
    generator: 'flashcard',
    params: { kind: 'spell', roots, qualities, count },
    mode: 'wait',
    rung: 'chord-symbols',
    hand: 'rh',
    seedPolicy: 'random',
  };
}

/** `spell:triad:maj` · `spell:triad:allroots` · `spell:maj7` · `spell:m7b5` … */
function spellDrill(parts: string[]): ExerciseDef | null {
  const tail = parts.slice(1);
  if (tail[0] === 'triad') {
    if (tail[1] === 'maj') return spellCard(ALL_ROOTS, ['maj']);
    if (tail[1] === 'min') return spellCard(ALL_ROOTS, ['min']);
    if (tail[1] === 'allroots') return spellCard(CHROMATIC_ROOTS, ['maj', 'min']);
    if (tail[1] === 'inversions') return spellCard(ALL_ROOTS, ['maj', 'min']);
    return spellCard(ALL_ROOTS, ['maj', 'min']);
  }
  // Seventh-chord families introduced in Stage 5: the id names the quality.
  const quality = tail[0];
  const known: ChordQuality[] = ['maj7', 'm7', '7', 'm7b5', 'dim7', '6', 'm6', 'sus2', 'sus4', 'add9'];
  if (quality && (known as string[]).includes(quality)) {
    return spellCard(CHROMATIC_ROOTS, [quality as ChordQuality]);
  }
  return null;
}

/**
 * Key signatures are conceptually a choice card (deferred, 06); the playable
 * proxy is a roman drill inside that key — you can't answer it without knowing
 * which notes the signature gives you.
 */
function keysigDrill(parts: string[]): ExerciseDef | null {
  const tonic = cap(parts[1] ?? '');
  const mode = parts[2] === 'minor' ? 'minor' : 'major';
  return {
    generator: 'flashcard',
    params: {
      kind: 'roman',
      keys: [{ tonic, mode }],
      romans: mode === 'minor' ? ['i', 'iv', 'v', 'VI'] : ['I', 'IV', 'V', 'vi'],
      count: 8,
    },
    mode: 'wait',
    rung: 'chord-symbols',
    hand: 'rh',
    seedPolicy: 'random',
  };
}

const C_MAJOR = { tonic: 'C', mode: 'major' } as const;

/** `ear:degree:135` · `ear:quality:majmin` · `ear:cadence` · `ear:prog:iivi` … */
function earDrill(parts: string[]): ExerciseDef | null {
  const byEar = { mode: 'wait', rung: 'by-ear', hand: 'rh', seedPolicy: 'random' } as const;
  const sub = parts[1];
  if (sub === 'degree') {
    const digits = (parts[2] ?? '135').split('').map(Number).filter((n) => n >= 1 && n <= 7);
    return {
      generator: 'ear-degree',
      params: { key: C_MAJOR, degreePool: digits.length > 0 ? digits : [1, 3, 5], count: 6 },
      ...byEar,
    };
  }
  if (sub === 'quality') {
    const tag = parts[2] ?? 'majmin';
    const pool = QUALITY_POOLS[tag] ?? ['maj', 'min'];
    return {
      generator: 'ear-quality',
      params: { qualityPool: pool, roots: ['C', 'F', 'G'], count: 6 },
      ...byEar,
    };
  }
  // Everything else in the ear strand is progression recognition.
  const pool = EAR_PROG_POOLS[parts.slice(1).join(':')] ?? EAR_PROG_POOLS['cadence'];
  return { generator: 'ear-progression', params: { key: C_MAJOR, pool, count: 3 }, ...byEar };
}

const QUALITY_POOLS: Record<string, ChordQuality[]> = {
  majmin: ['maj', 'min'],
  'majmin-solid': ['maj', 'min'],
  maj7: ['maj7', '7'],
  '7': ['maj7', '7'],
  m7: ['m7', 'min'],
  sevenths: ['maj7', '7', 'm7', 'm7b5'],
  triads: ['maj', 'min', 'dim', 'aug'],
};

const EAR_PROG_POOLS: Record<string, string[][]> = {
  cadence: [
    ['V', 'I'],
    ['IV', 'I'],
    ['I', 'V'],
  ],
  'chord-function:145': [
    ['I', 'IV', 'V'],
    ['I', 'V', 'IV'],
    ['IV', 'V', 'I'],
  ],
  'prog:iivi': [
    ['ii7', 'V7', 'Imaj7'],
    ['IV', 'V', 'I'],
  ],
  'prog:advanced': [
    ['I', 'V', 'vi', 'IV'],
    ['I', 'vi', 'IV', 'V'],
    ['vi', 'IV', 'I', 'V'],
    ['ii7', 'V7', 'Imaj7'],
  ],
  findkey: [
    ['I', 'IV', 'V', 'I'],
    ['i', 'VI', 'III', 'VII'],
  ],
};

/** `prog:i-v-vi-iv:c` · `prog-smooth:i-v-vi-iv:g` · `prog:ii-v-i:all`. */
function progDrill(kind: string, parts: string[]): ExerciseDef | null {
  const progId = parts[1];
  const keySeg = parts[2] ?? 'c';
  if (!progId) return null;
  const entry =
    PROGRESSION_CATALOG.find((p) => p.id === progId) ??
    PROGRESSION_CATALOG.find((p) => p.id === `min-${progId}`);
  if (!entry) return null;
  // `all` = drill it in a rotating key; the generator picks per seed via roots.
  const minor = keySeg.endsWith('m');
  const tonic = keySeg === 'all' ? 'C' : cap(minor ? keySeg.slice(0, -1) : keySeg);
  return {
    generator: 'progression-play',
    params: {
      key: { tonic, mode: entry.mode },
      roman: entry.romans,
      beatsPerChord: 4,
      loops: 1,
      ...(kind === 'prog-smooth' ? { voiceLead: 'smooth' } : {}),
    },
    mode: 'tempo',
    bpm: 66,
    timingTier: 'relaxed',
    rung: 'chord-symbols',
    hand: 'rh',
    seedPolicy: 'random',
  };
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
  if (kind === 'spell') {
    if (parts[1] === 'triad') {
      const what =
        { maj: 'major triads', min: 'minor triads', allroots: 'triads from any root', inversions: 'triad inversions' }[
          parts[2] ?? ''
        ] ?? 'triads';
      return `Spell ${what}`;
    }
    return `Spell ${parts[1] ?? ''} chords`;
  }
  if (kind === 'keysig') return `Key of ${pretty(parts[1] ?? '?')} ${parts[2] ?? 'major'}`;
  if (kind === 'ear') {
    if (parts[1] === 'degree') return `Hear degrees ${parts[2] ?? ''}`;
    if (parts[1] === 'quality') return `Hear chord quality (${parts[2] ?? ''})`;
    if (parts[1] === 'cadence') return 'Hear cadences';
    return `Hear ${parts.slice(1).join(' ')}`;
  }
  if (kind === 'prog' || kind === 'prog-smooth') {
    const entry =
      PROGRESSION_CATALOG.find((p) => p.id === parts[1]) ??
      PROGRESSION_CATALOG.find((p) => p.id === `min-${parts[1]}`);
    const where = parts[2] === 'all' ? 'all keys' : pretty(parts[2] ?? '');
    const smooth = kind === 'prog-smooth' ? ' (smooth)' : '';
    return `${entry?.name ?? parts[1]} in ${where}${smooth}`;
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
