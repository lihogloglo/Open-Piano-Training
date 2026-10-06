import { describe, expect, it } from 'vitest';
import { staffBars, staffFromNotes, vexDuration } from './staff';
import { generate } from './generators';
import type { ExerciseDef } from './types';

const beats = (items: { midis: number[]; beats: number }[]) =>
  items.map((i) => (i.midis.length ? i.beats : -i.beats));

describe('staffFromNotes', () => {
  it('writes slightly short notes as full quarters', () => {
    const staff = staffFromNotes(
      [0, 1, 2, 3].map((b) => ({ midi: 60 + b, atBeat: b, durBeats: 0.85 })),
      { clef: 'treble', beatsPerBar: 4 },
    );
    expect(beats(staff.items)).toEqual([1, 1, 1, 1]);
  });

  it('turns gaps into rests and fills the last bar', () => {
    const staff = staffFromNotes(
      [
        { midi: 60, atBeat: 0, durBeats: 0.9 },
        { midi: 62, atBeat: 2, durBeats: 1.8 },
        { midi: 64, atBeat: 4, durBeats: 0.9 },
      ],
      { clef: 'treble', beatsPerBar: 4 },
    );
    // Beat 0 quarter, a quarter rest, a half; then a quarter and three beats of rest.
    expect(beats(staff.items)).toEqual([1, -1, 2, 1, -3]);
    expect(staffBars(staff)).toHaveLength(2);
  });

  it('groups notes that start together into one chord', () => {
    const staff = staffFromNotes(
      [
        { midi: 64, atBeat: 0, durBeats: 3.6 },
        { midi: 48, atBeat: 0, durBeats: 3.6 },
      ],
      { clef: 'treble', beatsPerBar: 4 },
    );
    expect(staff.items).toEqual([{ midis: [48, 64], beats: 4 }]);
  });

  it('keeps dotted rhythms', () => {
    const staff = staffFromNotes(
      [
        { midi: 60, atBeat: 0, durBeats: 1.35 },
        { midi: 62, atBeat: 1.5, durBeats: 0.45 },
        { midi: 64, atBeat: 2, durBeats: 1.8 },
      ],
      { clef: 'treble', beatsPerBar: 4 },
    );
    expect(beats(staff.items)).toEqual([1.5, 0.5, 2]);
    expect(vexDuration(1.5)).toEqual({ code: 'qd', dots: 1 });
  });

  it('writes a pickup as a short first bar', () => {
    const staff = staffFromNotes(
      [
        { midi: 67, atBeat: 0, durBeats: 0.9 },
        { midi: 72, atBeat: 1, durBeats: 3.6 },
      ],
      { clef: 'treble', beatsPerBar: 4, pickupBeats: 1 },
    );
    expect(staffBars(staff).map((bar) => beats(bar))).toEqual([[1], [4]]);
  });

  it('writes a syncopation as eighth, quarter, eighth', () => {
    const staff = staffFromNotes(
      [
        { midi: 60, atBeat: 0, durBeats: 0.45 },
        { midi: 64, atBeat: 0.5, durBeats: 0.9 },
        { midi: 67, atBeat: 1.5, durBeats: 0.45 },
        { midi: 72, atBeat: 2, durBeats: 1.8 },
      ],
      { clef: 'treble', beatsPerBar: 4 },
    );
    expect(beats(staff.items)).toEqual([0.5, 1, 0.5, 2]);
  });

  it('never lets a note cross a bar line', () => {
    const staff = staffFromNotes([{ midi: 60, atBeat: 3, durBeats: 1.8 }], {
      clef: 'treble',
      beatsPerBar: 4,
    });
    for (const bar of staffBars(staff)) expect(bar.reduce((s, i) => s + i.beats, 0)).toBe(4);
  });
});

describe('read snippet rhythm', () => {
  const def = (params: Record<string, unknown>): ExerciseDef => ({
    generator: 'read-snippet',
    params: { key: { tonic: 'C', mode: 'major' }, ...params },
    mode: 'tempo',
    bpm: 60,
    rung: 'note-names',
    hand: 'rh',
    seedPolicy: 'fixed',
  });

  it('fills every bar exactly, for every rhythm pool and meter', () => {
    for (const rhythm of ['quarters', 'halves', 'long', 'rests', 'eighths', 'syncopation', 'dotted']) {
      for (const beatsPerBar of [2, 3, 4]) {
        for (let seed = 1; seed <= 20; seed++) {
          const inst = generate(def({ rhythm, beatsPerBar, bars: 4 }), seed);
          const staff = inst.prompt.staff!;
          const bars = staffBars(staff);
          expect(bars, `${rhythm} ${beatsPerBar} ${seed}`).toHaveLength(4);
          for (const bar of bars) expect(bar.reduce((s, i) => s + i.beats, 0)).toBeCloseTo(beatsPerBar);
          // One target per sounding item, at the same beat.
          expect(staff.items.filter((i) => i.midis.length)).toHaveLength(inst.targets.length);
        }
      }
    }
  });

  it('stays inside the requested note range', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const inst = generate(def({ low: 60, high: 67, bars: 4 }), seed);
      for (const t of inst.targets) {
        if (t.kind !== 'note') continue;
        expect(t.midi).toBeGreaterThanOrEqual(60);
        expect(t.midi).toBeLessThanOrEqual(67);
      }
    }
  });

  it('never starts on a rest', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const inst = generate(def({ rhythm: 'rests', bars: 2 }), seed);
      expect(inst.prompt.staff!.items[0]!.midis.length).toBeGreaterThan(0);
    }
  });
});

describe('phrase staff', () => {
  it('writes an authored phrase on a staff when a clef is given', () => {
    const inst = generate(
      {
        generator: 'phrase',
        params: {
          title: 'Test',
          beatsPerBar: 4,
          clef: 'treble',
          key: { tonic: 'C', mode: 'major' },
          notes: [0, 1, 2, 3].map((b) => ({ midi: 64, atBeat: b, durBeats: 0.9 })),
        },
        mode: 'tempo',
        bpm: 80,
        rung: 'note-names',
        hand: 'rh',
        seedPolicy: 'fixed',
      },
      1,
    );
    expect(inst.prompt.staff?.items).toHaveLength(4);
    expect(inst.prompt.key).toEqual({ tonic: 'C', mode: 'major' });
  });
});
