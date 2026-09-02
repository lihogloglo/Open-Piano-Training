import { z } from 'zod';
import { chordSymbol } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import type { ExerciseDef, ExerciseInstance } from '../types';
import { chordTargets, type ChordEvent } from './progressionPlay';

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
});

/** The song's flattened chord events in the requested key. */
export function songChordEvents(songId: string, transposeTo?: string): { events: ChordEvent[]; bpm: number; tonic: string; mode: 'major' | 'minor' } {
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

/** Play through a song chart: one chord per bar, any voicing, root in the bass. */
export function generateChartPlay(def: ExerciseDef, seed: number): ExerciseInstance {
  const p = chartPlayParams.parse(def.params);
  const song = getSong(p.songId);
  if (!song) throw new Error(`Unknown song: ${p.songId}`);
  const { events, tonic, mode } = songChordEvents(p.songId, p.transposeTo);
  return {
    def,
    seed,
    targets: chordTargets(events),
    prompt: {
      title: `${song.title} — in ${tonic}`,
      detail: `${song.styleRef} · one chord per bar`,
      key: { tonic, mode },
      perTarget: events.map((e) => ({ label: e.symbol, detail: e.roman })),
    },
  };
}
