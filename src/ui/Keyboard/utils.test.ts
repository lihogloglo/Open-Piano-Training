import { describe, expect, it } from 'vitest';
import { BLACK_W, layoutKeys, WHITE_W } from './utils';

describe('keyboard layout', () => {
  it('centres every black key over its white-key boundary', () => {
    const layout = layoutKeys(60, 72);
    const boundaryByMidi = new Map([
      [61, 1],
      [63, 2],
      [66, 4],
      [68, 5],
      [70, 6],
    ]);

    for (const [midi, boundary] of boundaryByMidi) {
      const key = layout.keys.find((candidate) => candidate.midi === midi);
      expect(key?.x).toBe(boundary * WHITE_W - BLACK_W / 2);
      expect((key?.x ?? 0) + BLACK_W / 2).toBe(boundary * WHITE_W);
    }
  });
});
