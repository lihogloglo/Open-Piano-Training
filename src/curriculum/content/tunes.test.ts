import { describe, expect, it } from 'vitest';
import { TUNES, WHEN_THE_SAINTS, pitch, tuneNotes } from './tunes';

describe('tunes', () => {
  it('spells notes as midi', () => {
    expect(pitch('C4')).toBe(60);
    expect(pitch('G3')).toBe(55);
    expect(pitch('F#4')).toBe(66);
    expect(pitch('Bb3')).toBe(58);
  });

  it('fills every bar exactly and has one root per bar', () => {
    for (const tune of [...TUNES, WHEN_THE_SAINTS]) {
      expect(tune.roots, tune.id).toHaveLength(tune.bars.length);
      tune.bars.forEach((bar, i) =>
        expect(
          bar.reduce((s, [, b]) => s + b, 0),
          `${tune.id} bar ${i + 1}`,
        ).toBe(i === 0 && tune.pickupBeats ? tune.pickupBeats : tune.beatsPerBar),
      );
      expect(tuneNotes(tune).length).toBeGreaterThan(8);
    }
  });

  it('starts the bar after a pickup on the right beat', () => {
    const notes = tuneNotes(WHEN_THE_SAINTS);
    // The pickup is beats 0-2, the first full bar starts on 3, and bar 2 opens with a rest.
    expect(notes.slice(0, 5).map((n) => n.atBeat)).toEqual([0, 1, 2, 3, 8]);
  });
});
