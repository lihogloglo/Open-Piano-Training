import { buildChord } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import type { KeyContext } from '@/theory/keys';
import { COMP_PATTERNS, swingBeat, type CompPattern } from '@/engine/comp';
import { onBeat, startMetronome, stopMetronome } from './metronome';
import { ensureSamplerLoaded, playNote, stopNote } from './sampler';
import { unlockAudio } from './clock';

export interface BackingOptions {
  key: KeyContext;
  romans: readonly string[];
  bpm: number;
  /** Beats each chord holds; 4 = one bar in 4/4. */
  beatsPerChord?: number;
  pattern?: CompPattern | 'block';
  /** Swing ratio for offbeat hits; 0.5 = straight. */
  swing?: number;
  volume?: number;
  /** Click track under the backing; off by default for improv. */
  metronomeVolume?: number;
  onBar?: (barIndex: number) => void;
}

export interface BackingHandle {
  stop(): void;
}

/**
 * A looping chord backing for improvisation (08 Stage 7).
 *
 * This rides the existing metronome scheduler rather than introducing a second
 * transport: the app already has a sample-accurate beat clock, and two clocks
 * sharing one AudioContext drift against each other. See decisions.md.
 */
export async function startBacking(opts: BackingOptions): Promise<BackingHandle> {
  const beatsPerChord = opts.beatsPerChord ?? 4;
  const chords = progressionChords([...opts.romans], opts.key);
  if (chords.length === 0) return { stop: () => {} };

  const sounding: number[] = [];
  const releaseAll = (): void => {
    for (const midi of sounding) stopNote(midi);
    sounding.length = 0;
  };
  const strike = (midis: readonly number[], velocity: number): void => {
    for (const midi of midis) {
      playNote(midi, velocity);
      sounding.push(midi);
    }
  };

  await unlockAudio();
  // Backing and lesson demonstrations always need app audio. The live piano
  // echo preference only controls whether incoming MIDI notes are repeated.
  await ensureSamplerLoaded();
  startMetronome({ bpm: opts.bpm, countInBars: 0, volume: opts.metronomeVolume ?? 0 });

  const pattern = opts.pattern ?? 'block';
  const hits = pattern === 'block' ? null : COMP_PATTERNS[pattern].hits;
  const volume = opts.volume ?? 0.4;

  const unsubscribe = onBeat((beat) => {
    if (beat.beatIndex < 0) return;
    const chordIdx = Math.floor(beat.beatIndex / beatsPerChord) % chords.length;
    const chord = chords[chordIdx];
    if (!chord) return;
    const beatInChord = beat.beatIndex % beatsPerChord;
    const voicing = buildChord({ root: chord.root, quality: chord.quality, inversion: 0 }, 48);

    if (beatInChord === 0) {
      releaseAll();
      opts.onBar?.(chordIdx);
    }
    if (!hits) {
      // Block: one sustained chord per bar, quiet and out of the way.
      if (beatInChord === 0) strike(voicing, volume);
      return;
    }
    for (const hit of hits) {
      // Only whole beats can be scheduled from the beat callback; offbeat hits
      // are delayed by hand within the beat.
      const swung = swingBeat(hit.beat, opts.swing ?? 0.5);
      if (Math.floor(swung) !== beatInChord) continue;
      const delayMs = (swung - Math.floor(swung)) * (60_000 / opts.bpm);
      const midis = hit.hand === 'lh' ? [voicing[0] ?? 48] : voicing.slice(1);
      if (delayMs < 1) strike(midis, volume);
      else setTimeout(() => strike(midis, volume), delayMs);
    }
  });

  return {
    stop() {
      unsubscribe();
      stopMetronome();
      releaseAll();
    },
  };
}
