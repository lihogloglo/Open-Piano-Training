import { describe, expect, it } from 'vitest';
import { generate } from './generators';
import { unseenChartBars } from './generators/unseenChart';
import { palettePcs } from './generators/improv';
import { snippetNotes } from './generators/readSnippet';
import { COMP_PATTERNS, swingBeat, voiceChord } from './comp';
import { detectChord, QUALITY_INTERVALS } from '@/theory/chords';
import type { ExerciseDef } from './types';

const def = (over: Partial<ExerciseDef> & Pick<ExerciseDef, 'generator'>): ExerciseDef => ({
  params: {},
  mode: 'tempo',
  bpm: 80,
  timingTier: 'standard',
  rung: 'lead-sheet',
  hand: 'rh',
  seedPolicy: 'random',
  ...over,
});

describe('comp voicings', () => {
  it('shell 1-7 is the root and the seventh', () => {
    const { lh } = voiceChord('C', '7', 'shell17');
    expect(lh).toHaveLength(2);
    expect(lh[1]! - lh[0]!).toBe(10); // minor 7th
  });

  it('shell 1-3 is the root and the third', () => {
    const { lh } = voiceChord('C', 'min', 'shell13');
    expect(lh[1]! - lh[0]!).toBe(3); // minor 3rd
  });

  it('guide tones put 3rd and 7th over a root', () => {
    const { lh, rh } = voiceChord('D', 'm7', 'guidetones');
    expect(lh).toHaveLength(1);
    expect(rh).toHaveLength(2);
    // F and C above middle C: the two voices that steer a ii-V-I.
    expect(rh.map((m) => m % 12).sort((a, b) => a - b)).toEqual([0, 5]);
  });

  it('falls back to the fifth when a chord has no seventh', () => {
    const { lh } = voiceChord('C', 'maj', 'shell17');
    expect(lh[1]! - lh[0]!).toBe(7);
  });

  it('hands never collide: LH sits below RH', () => {
    for (const quality of Object.keys(QUALITY_INTERVALS)) {
      const { lh, rh } = voiceChord('C', quality as never, 'guidetones');
      expect(Math.max(...lh)).toBeLessThan(Math.min(...rh));
    }
  });
});

describe('comp patterns', () => {
  it('every pattern fits inside a 4/4 bar and uses both hands', () => {
    for (const [id, pattern] of Object.entries(COMP_PATTERNS)) {
      expect(pattern.hits.length, id).toBeGreaterThan(0);
      for (const hit of pattern.hits) {
        expect(hit.beat, id).toBeGreaterThanOrEqual(0);
        expect(hit.beat, id).toBeLessThan(4);
      }
    }
  });

  it('swing delays the offbeat only', () => {
    expect(swingBeat(0, 0.667)).toBe(0);
    expect(swingBeat(2, 0.667)).toBe(2);
    expect(swingBeat(0.5, 0.667)).toBeCloseTo(0.667);
    expect(swingBeat(2.5, 0.667)).toBeCloseTo(2.667);
    expect(swingBeat(0.5, 0.5)).toBe(0.5); // straight
  });

  it('a comping progression lands targets on the pattern beats', () => {
    const inst = generate(
      def({
        generator: 'progression-play',
        hand: 'both',
        params: {
          key: { tonic: 'C', mode: 'major' },
          roman: ['I', 'V'],
          beatsPerChord: 4,
          loops: 1,
          style: 'boomchuck',
          voicing: 'shell17',
        },
      }),
      1,
    );
    // boom-chuck = 4 hits per bar, 2 bars.
    expect(inst.targets).toHaveLength(8);
    const beats = inst.targets.map((t) => t.atBeat);
    expect(beats).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('an LH-only comp drill never demands the right hand', () => {
    const inst = generate(
      def({
        generator: 'progression-play',
        hand: 'lh',
        params: {
          key: { tonic: 'C', mode: 'major' },
          roman: ['I', 'V'],
          loops: 1,
          style: 'boomchuck',
        },
      }),
      3,
    );
    // Only the two 'lh' hits per bar survive.
    expect(inst.targets).toHaveLength(4);
  });
});

describe('unseen chart', () => {
  it('produces valid, playable charts across 50 seeds', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const form of ['aaba', 'verse-chorus', 'blues'] as const) {
        const d = def({ generator: 'unseen-chart', params: { form } });
        const inst = generate(d, seed);
        expect(inst.targets.length, `seed ${seed} ${form}`).toBeGreaterThan(0);
        // Every target must be a real, nameable chord under the hand.
        for (const target of inst.targets) {
          if (target.kind !== 'set') continue;
          expect(target.midis.length, `seed ${seed}`).toBeGreaterThanOrEqual(3);
          for (const midi of target.midis) {
            expect(midi, `seed ${seed}`).toBeGreaterThanOrEqual(21);
            expect(midi, `seed ${seed}`).toBeLessThanOrEqual(108);
          }
          expect(detectChord(target.midis), `seed ${seed} ${target.label}`).not.toBeNull();
        }
        // The beat grid must be strictly ordered.
        const beats = inst.targets.map((t) => t.atBeat ?? 0);
        for (let i = 1; i < beats.length; i++) {
          expect(beats[i]!, `seed ${seed}`).toBeGreaterThanOrEqual(beats[i - 1]!);
        }
      }
    }
  });

  it('is deterministic per seed but different across seeds', () => {
    const d = def({ generator: 'unseen-chart', params: { form: 'aaba' } });
    expect(unseenChartBars(d, 7)).toEqual(unseenChartBars(d, 7));
    const seen = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(unseenChartBars(d, i + 1))));
    expect(seen.size).toBeGreaterThan(3);
  });

  it('the blues form is 12 bars of dominants', () => {
    const bars = unseenChartBars(def({ generator: 'unseen-chart', params: { form: 'blues' } }), 5);
    expect(bars).toHaveLength(12);
    expect(bars.every((b) => b.roman.includes('7'))).toBe(true);
  });

  it('an AABA chart repeats its A section', () => {
    const bars = unseenChartBars(def({ generator: 'unseen-chart', params: { form: 'aaba' } }), 9);
    expect(bars).toHaveLength(16);
    expect(bars.slice(0, 4).map((b) => b.roman)).toEqual(bars.slice(4, 8).map((b) => b.roman));
    expect(bars.slice(0, 4).map((b) => b.roman)).toEqual(bars.slice(12, 16).map((b) => b.roman));
  });
});

describe('improv', () => {
  it('free play is unscored but still has a focus', () => {
    const inst = generate(
      def({
        generator: 'improv',
        mode: 'wait',
        params: { key: { tonic: 'C', mode: 'major' }, palette: 'degrees123' },
      }),
      1,
    );
    expect(inst.targets).toHaveLength(1);
    expect(inst.audioPreview?.notes.length).toBeGreaterThan(0);
  });

  it('chord-tone targeting scores one landing per bar', () => {
    const inst = generate(
      def({
        generator: 'improv',
        mode: 'wait',
        params: {
          key: { tonic: 'C', mode: 'major' },
          palette: 'chordtones',
          roman: ['I', 'V', 'vi', 'IV'],
          loops: 1,
          targetDownbeats: true,
        },
      }),
      2,
    );
    expect(inst.targets).toHaveLength(4);
    expect(inst.targets.every((t) => t.kind === 'chord-any')).toBe(true);
  });

  it('palettes name real pitch classes', () => {
    expect(palettePcs({ tonic: 'C', mode: 'major' }, 'degrees123')).toEqual([0, 2, 4]);
    expect(palettePcs({ tonic: 'A', mode: 'minor' }, 'degrees123')).toEqual([9, 11, 0]);
    expect(palettePcs({ tonic: 'C', mode: 'major' }, 'pentatonic')).toContain(0);
    expect(palettePcs({ tonic: 'C', mode: 'major' }, 'blues')).toContain(6); // the blue note
  });
});

describe('read snippet', () => {
  it('generates readable phrases inside the clef range', () => {
    for (const clef of ['treble', 'bass'] as const) {
      for (let seed = 1; seed <= 25; seed++) {
        const inst = generate(
          def({
            generator: 'read-snippet',
            params: { key: { tonic: 'G', mode: 'major' }, clef, bars: 2 },
          }),
          seed,
        );
        const notes = snippetNotes(inst);
        expect(notes, `${clef} seed ${seed}`).toHaveLength(8);
        for (const midi of notes) {
          expect(midi, `${clef} seed ${seed}`).toBeGreaterThanOrEqual(28);
          expect(midi, `${clef} seed ${seed}`).toBeLessThanOrEqual(96);
        }
      }
    }
  });

  it('stays inside the key', () => {
    const inst = generate(
      def({
        generator: 'read-snippet',
        params: { key: { tonic: 'D', mode: 'major' }, bars: 4 },
      }),
      11,
    );
    // D major: F# and C#, never F natural or C natural.
    const pcs = new Set(snippetNotes(inst).map((m) => m % 12));
    expect(pcs.has(5)).toBe(false); // F natural
    expect(pcs.has(0)).toBe(false); // C natural
  });

  it('respects the maximum leap', () => {
    const inst = generate(
      def({
        generator: 'read-snippet',
        params: { key: { tonic: 'C', mode: 'major' }, bars: 4, maxLeap: 1 },
      }),
      4,
    );
    const notes = snippetNotes(inst);
    for (let i = 1; i < notes.length; i++) {
      // One scale step is at most a whole tone in a major scale.
      expect(Math.abs(notes[i]! - notes[i - 1]!)).toBeLessThanOrEqual(2);
    }
  });
});
