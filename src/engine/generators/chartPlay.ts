import { tr } from '@/i18n';
import { z } from 'zod';
import { chordSymbol } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import type { ExerciseDef, ExerciseInstance } from '../types';
import { progressionTargets, type ChordEvent } from './progressionPlay';
import { COMP_PATTERNS } from '../comp';

/** Minimal song shape the engine needs; curriculum owns the full catalog. */
export interface ChartSong {
  id: string;
  title: string;
  styleRef: string;
  key: { tonic: string; mode: 'major' | 'minor' };
  bpm: number;
  timeSig: [number, number];
  romanized: string[];
}

// Dependency inversion: curriculum registers its catalog at module init so the
// engine never imports upward.
let songProvider: (id: string) => ChartSong | undefined = () => undefined;

export function registerSongProvider(provider: (id: string) => ChartSong | undefined): void {
  songProvider = provider;
}

function getSong(id: string): ChartSong | undefined {
  return songProvider(id);
}

export const chartPlayParams = z.object({
  songId: z.string(),
  /** Target tonic; the song's romanized chart makes any key free. */
  transposeTo: z.string().optional(),
  style: z
    .enum(['block', 'rootchord', 'brokenLH', 'straight8', 'ballad', 'boomchuck', 'swing'])
    .default('block'),
  voiceLead: z.enum(['free', 'smooth']).default('free'),
  /** Comping voicing (Stage 6): shells and guide tones instead of full triads. */
  voicing: z.enum(['triad', 'shell17', 'shell13', 'guidetones']).default('triad'),
  /** Swing ratio for the eighth-note grid; 0.5 = straight. */
  swing: z.number().min(0.5).max(0.7).default(0.5),
});

/** The song's flattened chord events in the requested key. */
export function songChordEvents(
  songId: string,
  transposeTo?: string,
): { events: ChordEvent[]; bpm: number; tonic: string; mode: 'major' | 'minor' } {
  const song = getSong(songId);
  if (!song) throw new Error(`Unknown song: ${songId}`);
  const tonic = transposeTo ?? song.key.tonic;
  const key = { tonic, mode: song.key.mode };
  const chords = progressionChords(song.romanized, key);
  const beatsPerBar = song.timeSig[0];
  const events: ChordEvent[] = chords.map((c, bar) => ({
    symbol: chordSymbol(c.root, c.quality),
    roman: c.roman,
    root: c.root,
    quality: c.quality,
    degree: c.degree,
    atBeat: bar * beatsPerBar,
    beats: beatsPerBar,
  }));
  return { events, bpm: song.bpm, tonic, mode: song.key.mode };
}

/** Play through a song chart: one chord per bar; optional LH texture and smooth RH. */
export function generateChartPlay(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = chartPlayParams.parse(def.params);
  const song = getSong(p.songId);
  if (!song) throw new Error(`Unknown song: ${p.songId}`);
  const { events, tonic, mode } = songChordEvents(p.songId, p.transposeTo);
  const { targets, ideal, labels } = progressionTargets(events, {
    style: p.style,
    voiceLead: p.voiceLead,
    hand: def.hand,
    voicing: p.voicing,
    swing: p.swing,
  });
  const styleNote =
    p.style === 'brokenLH'
      ? tr('LH broken pattern')
      : p.style === 'rootchord'
        ? def.hand === 'both'
          ? tr('LH root, RH chord — one per bar')
          : tr('one chord per bar')
        : p.style === 'block'
          ? tr('one chord per bar')
          : COMP_PATTERNS[p.style].label;
  return {
    def,
    seed,
    targets,
    beatsPerBar: song.timeSig[0],
    prompt: {
      title: tr('{v0} — in {v1}', { v0: song.title, v1: tonic }),
      detail: tr('{v0} · {v1}', { v0: song.styleRef, v1: styleNote }),
      key: { tonic, mode },
      perTarget: labels.map((label) => ({ label })),
    },
    ...(ideal ? { voiceLeading: { ideal } } : {}),
  };
}
