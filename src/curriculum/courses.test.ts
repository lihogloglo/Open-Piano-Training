import { describe, expect, it } from 'vitest';
import { TRACKS, TRACK_UNITS, getUnit, trackOf } from './content';
import { buildPath } from './path';
import { INTERACTIVE_BLOCKS } from './schema';
import { generate } from '@/engine/generators';
import { nameToMidi } from '@/theory/notes';

/**
 * Course lint. Courses follow a stricter, lighter grammar than the path:
 * experience first, short cards, a short lesson, and nothing to grind.
 */
describe('courses', () => {
  it('never join the path', () => {
    const pathIds = new Set(buildPath().flatMap((s) => s.nodes.map((n) => n.id)));
    for (const unit of TRACK_UNITS) expect(pathIds.has(unit.id), unit.id).toBe(false);
  });

  it('list every unit exactly once, and every unit resolves', () => {
    const listed = TRACKS.flatMap((t) => t.unitIds);
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed.sort()).toEqual(TRACK_UNITS.map((u) => u.id).sort());
    for (const id of listed) {
      expect(getUnit(id), id).toBeDefined();
      expect(trackOf(id)?.unitIds).toContain(id);
    }
  });

  describe.each(TRACK_UNITS.map((u) => [u.id, u] as const))('%s', (_id, unit) => {
    it('is short: at most six steps and seven minutes', () => {
      expect(unit.steps.length).toBeLessThanOrEqual(6);
      expect(unit.minutes).toBeLessThanOrEqual(7);
    });

    it('starts with hands on the keys, and every explain step has something to play', () => {
      const first = unit.steps[0];
      expect(first?.kind).toBe('explain');
      for (const step of unit.steps) {
        if (step.kind !== 'explain') continue;
        expect(step.blocks.some((b) => INTERACTIVE_BLOCKS.has(b.kind)), step.id).toBe(true);
      }
    });

    it('has no walls of text: one short sentence or two per card, at most two cards in a row', () => {
      for (const step of unit.steps) {
        if (step.kind !== 'explain') continue;
        let run = 0;
        for (const block of step.blocks) {
          if (block.kind === 'text') {
            expect(block.md.length, block.md).toBeLessThanOrEqual(140);
            run += 1;
            expect(run, `${step.id}: too many text cards in a row`).toBeLessThanOrEqual(2);
          } else run = 0;
        }
      }
    });

    it('practises before it checks, and every exercise generates', () => {
      const firstGraded = unit.steps.findIndex((s) => s.kind === 'graded');
      const firstPractice = unit.steps.findIndex((s) => s.kind === 'guided' || s.kind === 'ladder');
      expect(firstPractice).toBeGreaterThanOrEqual(0);
      if (firstGraded >= 0) expect(firstPractice).toBeLessThan(firstGraded);
      for (const step of unit.steps) {
        if (step.kind === 'explain' || step.kind === 'create') continue;
        for (let seed = 1; seed <= 10; seed++) {
          const inst = generate(step.exercise, seed);
          expect(inst.targets.length, `${step.id} seed ${seed}`).toBeGreaterThan(0);
          // Reading exercises carry their staff, so the note list stays hidden.
          if (step.exercise.generator === 'read-snippet') expect(inst.prompt.staff).toBeDefined();
        }
      }
    });

    it('writes staff checks in a readable range for their clef', () => {
      for (const step of unit.steps) {
        if (step.kind !== 'explain') continue;
        for (const block of step.blocks) {
          if (block.kind !== 'staffCheck') continue;
          for (const name of block.notes) {
            if (name === 'rest') continue;
            const midi = nameToMidi(name);
            expect(midi, name).not.toBeNull();
            const [lo, hi] = block.clef === 'treble' ? [55, 84] : [36, 64];
            expect(midi!, `${step.id} ${name}`).toBeGreaterThanOrEqual(lo);
            expect(midi!, `${step.id} ${name}`).toBeLessThanOrEqual(hi);
          }
          if (block.beats) expect(block.beats).toHaveLength(block.notes.length);
        }
      }
    });
  });
});
