import type { MidiNumber, StaffItem, StaffModel } from './types';

/** A sounding note or chord with its start and written length, in beats. */
export interface TimedNote {
  midi: MidiNumber;
  atBeat: number;
  durBeats: number;
}

/** Written lengths the staff can draw, longest first. */
const LENGTHS = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25] as const;

const EPS = 1e-6;

/** Largest drawable length that fits in `room`, or 0 when nothing fits. */
function fit(room: number): number {
  return LENGTHS.find((l) => l <= room + EPS) ?? 0;
}

/** The beat where the bar that contains `at` ends. */
function barEnd(at: number, beatsPerBar: number, pickup: number): number {
  return at < pickup - EPS ? pickup : pickup + (Math.floor((at - pickup + EPS) / beatsPerBar) + 1) * beatsPerBar;
}

/** Splits a silence into rests that never cross a bar line. */
function rests(from: number, to: number, beatsPerBar: number, pickup: number): StaffItem[] {
  const out: StaffItem[] = [];
  let at = from;
  while (to - at > EPS) {
    const len = fit(Math.min(to, barEnd(at, beatsPerBar, pickup)) - at);
    if (len === 0) break;
    out.push({ midis: [], beats: len });
    at += len;
  }
  return out;
}

/**
 * Writes timed notes as staff items. Notes that start together become one chord.
 * A note's written length runs to the next start (so 0.85-beat "detached" notes
 * read as quarters), capped by its own length rounded up to a drawable value.
 * Gaps become rests. The result fills whole bars.
 */
export function staffFromNotes(
  notes: readonly TimedNote[],
  opts: { clef: 'treble' | 'bass'; beatsPerBar: number; pickupBeats?: number },
): StaffModel {
  const pickup = opts.pickupBeats ?? 0;
  const groups = new Map<number, TimedNote[]>();
  for (const n of notes) groups.set(n.atBeat, [...(groups.get(n.atBeat) ?? []), n]);
  const starts = [...groups.keys()].sort((a, b) => a - b);
  const items: StaffItem[] = [];
  let cursor = 0;
  starts.forEach((at, i) => {
    items.push(...rests(cursor, at, opts.beatsPerBar, pickup));
    const group = groups.get(at)!;
    const next = starts[i + 1];
    const longest = Math.max(...group.map((n) => n.durBeats));
    const gap = next === undefined ? Infinity : next - at;
    // Authored notes sound a little shorter than written (0.85 for a quarter).
    // A note that sounds for at least half the gap is written up to the next start.
    // A shorter one is rounded up to a drawable length and the rest is silence.
    const written =
      longest >= gap * 0.5 ? gap : ([...LENGTHS].reverse().find((l) => l >= longest / 0.9 - 0.02) ?? 4);
    // A note never crosses a bar line: the staff draws no ties, so authors keep notes inside a bar.
    const len = fit(Math.min(written, gap, barEnd(at, opts.beatsPerBar, pickup) - at)) || 0.25;
    items.push({ midis: [...new Set(group.map((n) => n.midi))].sort((a, b) => a - b), beats: len });
    cursor = at + len;
  });
  const bars = Math.ceil((cursor - pickup - EPS) / opts.beatsPerBar);
  const end = pickup + Math.max(1, bars) * opts.beatsPerBar;
  items.push(...rests(cursor, end, opts.beatsPerBar, pickup));
  return { clef: opts.clef, beatsPerBar: opts.beatsPerBar, items, ...(pickup > 0 ? { pickupBeats: pickup } : {}) };
}

/** Splits staff items into bars. A pickup becomes a short first bar. */
export function staffBars(staff: StaffModel): StaffItem[][] {
  const bars: StaffItem[][] = [];
  let bar: StaffItem[] = [];
  let room = staff.pickupBeats && staff.pickupBeats > 0 ? staff.pickupBeats : staff.beatsPerBar;
  for (const item of staff.items) {
    bar.push(item);
    room -= item.beats;
    if (room <= EPS) {
      bars.push(bar);
      bar = [];
      room = staff.beatsPerBar;
    }
  }
  if (bar.length) bars.push(bar);
  return bars;
}

/** VexFlow duration code for a written length, e.g. 1.5 → "qd". */
export function vexDuration(beats: number): { code: string; dots: number } {
  const table: Record<string, { code: string; dots: number }> = {
    '4': { code: 'w', dots: 0 },
    '3': { code: 'hd', dots: 1 },
    '2': { code: 'h', dots: 0 },
    '1.5': { code: 'qd', dots: 1 },
    '1': { code: 'q', dots: 0 },
    '0.75': { code: '8d', dots: 1 },
    '0.5': { code: '8', dots: 0 },
    '0.25': { code: '16', dots: 0 },
  };
  return table[String(beats)] ?? { code: 'q', dots: 0 };
}

/** Index of the sounding staff item for each target index (rests are skipped). */
export function soundingIndex(staff: StaffModel, itemIdx: number): number {
  let n = -1;
  for (let i = 0; i <= itemIdx && i < staff.items.length; i++) if (staff.items[i]!.midis.length) n += 1;
  return n;
}
