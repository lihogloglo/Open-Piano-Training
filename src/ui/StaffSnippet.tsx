import { tr } from '@/i18n';
import { useEffect, useRef, useState } from 'react';
import type { KeyContext } from '@/theory/keys';
import { midiToName } from '@/theory/notes';
import { staffBars, vexDuration } from '@/engine/staff';
import type { StaffModel } from '@/engine/types';

/** Per-note result colour: green when played right, red when wrong. */
export type StaffNoteState = 'ok' | 'bad' | undefined;

/** A bar needs about this much room to stay readable; wider phrases wrap to a new line. */
const MIN_BAR_WIDTH = 170;
/** Room for the clef, key signature and time signature at the start of a line. */
const LINE_HEAD = 70;
const ROW_HEIGHT = 120;

/** VexFlow spells accidentals in ASCII: F♯ → F#, B♭ → Bb. */
const ascii = (name: string) =>
  name.replace(/♯/g, '#').replace(/♭/g, 'b').replace(/𝄪/g, '##').replace(/𝄫/g, 'bb');

/**
 * Renders a phrase as notation (VexFlow 5), lazily — the engraver is large and
 * only reading exercises need it, so it must never land in the boot chunk.
 * Until it loads (or if it fails) the note names stand in, so the exercise is
 * still playable.
 */
export function StaffSnippet({
  staff,
  keyContext,
  highlightIndex = -1,
  states,
  maxWidth = 760,
}: {
  staff: StaffModel;
  keyContext: KeyContext;
  /** The sounding note the learner is on (rests do not count); drawn in the accent colour. */
  highlightIndex?: number;
  /** Results so far, by sounding note. */
  states?: readonly StaffNoteState[];
  maxWidth?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(maxWidth);

  // Fit the staff to its column, so a phone-width window wraps instead of scrolling.
  useEffect(() => {
    const el = host.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry?.contentRect.width ?? maxWidth);
      if (w > 0) setWidth(Math.min(maxWidth, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  useEffect(() => {
    let cancelled = false;
    const el = host.current;
    if (!el) return;

    void (async () => {
      try {
        const VF = await import('vexflow');
        // The bundle registers its music fonts asynchronously. Drawing before they load
        // measures note heads with the wrong glyphs, and stems come loose from the heads.
        await Promise.all([document.fonts.load('30px Bravura'), document.fonts.load('12px Academico')]);
        if (cancelled || !host.current) return;
        const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Beam, Dot } = VF;
        host.current.querySelector('svg')?.remove();

        const bars = staffBars(staff);
        const perRow = Math.max(1, Math.min(4, Math.floor((width - LINE_HEAD) / MIN_BAR_WIDTH)));
        const rows = Math.ceil(bars.length / perRow);
        const renderer = new Renderer(host.current, Renderer.Backends.SVG);
        renderer.resize(width, rows * ROW_HEIGHT + 10);
        const ctx = renderer.getContext();
        // Inherit the theme instead of VexFlow's hard-coded black.
        const css = getComputedStyle(host.current);
        const ink = css.color || '#000';
        const colour = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
        const accent = colour('--accent', '#2a9d8f');
        const ok = colour('--ok', '#2a9d8f');
        const bad = colour('--err', '#d1495b');
        ctx.setFillStyle(ink);
        ctx.setStrokeStyle(ink);

        const signature = ascii(keyContext.tonic) + (keyContext.mode === 'minor' ? 'm' : '');
        let sounding = 0;
        bars.forEach((bar, b) => {
          const row = Math.floor(b / perRow);
          const col = b % perRow;
          const inRow = Math.min(perRow, bars.length - row * perRow);
          const barWidth = (width - 10 - LINE_HEAD) / inRow;
          const x = 5 + (col === 0 ? 0 : LINE_HEAD + col * barWidth);
          const stave = new Stave(x, row * ROW_HEIGHT, col === 0 ? barWidth + LINE_HEAD : barWidth);
          if (col === 0) {
            stave.addClef(staff.clef).addKeySignature(signature);
            if (b === 0) stave.addTimeSignature(`${staff.beatsPerBar}/4`);
          }
          if (b === bars.length - 1) stave.setEndBarType(VF.Barline.type.END);
          stave.setContext(ctx).draw();

          const notes = bar.map((item) => {
            const { code, dots } = vexDuration(item.beats);
            const base = code.replace('d', '');
            const rest = item.midis.length === 0;
            const keys = rest
              ? [staff.clef === 'bass' ? 'd/3' : 'b/4']
              : item.midis.map((midi) => {
                  const name = ascii(midiToName(midi, keyContext)); // e.g. "F#4"
                  return `${name.slice(0, -1).toLowerCase()}/${name.slice(-1)}`;
                });
            const note = new StaveNote({
              keys,
              duration: rest ? `${base}r` : base,
              dots,
              clef: staff.clef,
              autoStem: true,
            });
            if (dots > 0) Dot.buildAndAttach([note], { all: true });
            // VexFlow draws stems, flags and ledger lines black unless told otherwise.
            let fill = ink;
            if (!rest) {
              const state = states?.[sounding];
              fill = sounding === highlightIndex ? accent : state === 'ok' ? ok : state === 'bad' ? bad : ink;
              sounding += 1;
            }
            const style = { fillStyle: fill, strokeStyle: fill };
            note.setStyle(style);
            note.setLedgerLineStyle(style);
            return note;
          });

          const beats = bar.reduce((sum, item) => sum + item.beats, 0);
          const voice = new Voice({ numBeats: beats, beatValue: 4 }).setStrict(false);
          voice.addTickables(notes);
          // Only the accidentals the key signature does not already give.
          Accidental.applyAccidentals([voice], signature);
          const beams = Beam.generateBeams(notes);
          const room = stave.getNoteEndX() - stave.getNoteStartX() - 12;
          new Formatter().joinVoices([voice]).format([voice], Math.max(40, room));
          voice.draw(ctx, stave);
          for (const beam of beams)
            beam.setStyle({ fillStyle: ink, strokeStyle: ink }).setContext(ctx).draw();
        });
      } catch (err) {
        if (!cancelled) {
          console.warn('Notation renderer unavailable:', err);
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staff, keyContext, highlightIndex, states, width]);

  const names = staff.items
    .filter((item) => item.midis.length > 0)
    .map((item) => item.midis.map((m) => midiToName(m, keyContext)).join('+'));

  if (failed) {
    return (
      <p role="img" aria-label={tr('Phrase: {v0}', { v0: names.join(', ') })}>
        {names.join(' · ')}
      </p>
    );
  }

  return (
    <div
      ref={host}
      role="img"
      aria-label={tr('Notation: {v0}', { v0: names.join(', ') })}
      style={{ color: 'var(--text)', width: '100%', maxWidth, margin: '0 auto' }}
    />
  );
}
