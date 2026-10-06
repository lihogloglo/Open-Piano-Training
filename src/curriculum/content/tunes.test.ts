import { describe, expect, it } from 'vitest';
import { TUNES, pitch, tuneNotes } from './tunes';

describe('tunes', () => {
  it('spells notes as midi', () => {
    expect(pitch('C4')).toBe(60);
    expect(pitch('G3')).toBe(55);
    expect(pitch('F#4')).toBe(66);
    expect(pitch('Bb3')).toBe(58);
  });

  it('fills every bar exactly and has one root per bar', () => {
    for (const tune of TUNES) {
      expect(tune.roots, tune.id).toHaveLength(tune.bars.length);
      tune.bars.forEach((bar, i) =>
        expect(bar.reduce((s, [, b]) => s + b, 0), `${tune.id} bar ${i + 1}`).toBe(tune.beatsPerBar),
      );
      expect(tuneNotes(tune).length).toBeGreaterThan(8);
    }
  });
});
