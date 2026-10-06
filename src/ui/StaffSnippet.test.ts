import { describe, expect, it } from 'vitest';
import { layoutBars } from './StaffSnippet';

describe('layoutBars', () => {
  it('keeps short bars on one line, in proportion to their notes', () => {
    const slots = layoutBars([138, 80], 500);
    expect(slots.map((s) => s.row)).toEqual([0, 0]);
    expect(slots[0]!.width / slots[1]!.width).toBeCloseTo(138 / 80);
  });

  it('never stretches a bar past twice its need', () => {
    const [slot] = layoutBars([80], 900);
    expect(slot!.width).toBe(160);
  });

  it('balances lines: four bars that wrap become two and two', () => {
    const slots = layoutBars([174, 174, 174, 174], 560);
    expect(slots.map((s) => s.row)).toEqual([0, 0, 1, 1]);
  });

  it('puts at most four bars on a line', () => {
    const slots = layoutBars(Array(8).fill(80), 5000);
    expect(Math.max(...slots.map((s) => s.col))).toBe(3);
  });
});
