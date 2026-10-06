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
  scale = 1,
  showTimeSignature = true,
  lower,
}: {
  staff: StaffModel;
  /** A second part, drawn below as a grand staff: the left hand under the right. */
  lower?: StaffModel | undefined;
  keyContext: KeyContext;
  /** The sounding note the learner is on (rests do not count); drawn in the accent colour. */
  highlightIndex?: number;
  /** Results so far, by sounding note. */
  states?: readonly StaffNoteState[];
  maxWidth?: number;
  /** Teaching cards draw a larger staff, so a beginner can read it at a glance. */
  scale?: number;
  /** A pitch-only card has no rhythm to count, so it leaves the time signature out. */
  showTimeSignature?: boolean;
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
        const { Renderer, Stave, StaveNote, StaveConnector, Voice, Formatter, Accidental, Beam, Dot } = VF;
        host.current.querySelector('svg')?.remove();

        // One part, or two joined as a grand staff (right hand above, left hand below).
        const parts = lower ? [staff, lower] : [staff];
        const partBars = parts.map(staffBars);
        const barCount = Math.max(...partBars.map((bars) => bars.length));
        const systemHeight = parts.length === 1 ? ROW_HEIGHT : ROW_HEIGHT * 2 - 20;
        // Lay out in unscaled units; the context scales everything at draw time.
        const layoutWidth = width / scale;
        // As many bars per line as fit, then balanced: 4 bars at 3 per line become 2 + 2, not 3 + 1.
        const fits = Math.max(1, Math.min(4, Math.floor((layoutWidth - LINE_HEAD) / MIN_BAR_WIDTH)));
        const rows = Math.ceil(barCount / fits);
        const perRow = Math.ceil(barCount / rows);
        const renderer = new Renderer(host.current, Renderer.Backends.SVG);
        renderer.resize(width, (rows * systemHeight + 10) * scale);
        const ctx = renderer.getContext();
        ctx.scale(scale, scale);
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
        const last = barCount - 1;
        let sounding = 0;
        for (let b = 0; b < barCount; b++) {
          const row = Math.floor(b / perRow);
          const col = b % perRow;
          const inRow = Math.min(perRow, barCount - row * perRow);
          const barWidth = (layoutWidth - 10 - LINE_HEAD) / inRow;
          const x = 5 + (col === 0 ? 0 : LINE_HEAD + col * barWidth);

          const staves = parts.map((part, pi) => {
            const stave = new Stave(
              x,
              row * systemHeight + pi * (ROW_HEIGHT - 20),
              col === 0 ? barWidth + LINE_HEAD : barWidth,
            );
            if (col === 0) {
              stave.addClef(part.clef).addKeySignature(signature);
              if (b === 0 && showTimeSignature) stave.addTimeSignature(`${part.beatsPerBar}/4`);
            }
            if (b === last)
              stave.setEndBarType(showTimeSignature ? VF.Barline.type.END : VF.Barline.type.SINGLE);
            return stave;
          });
          // Both staves start their notes at the same x, so the hands line up.
          if (staves.length > 1) Stave.formatBegModifiers(staves);
          for (const stave of staves) stave.setContext(ctx).draw();
          if (staves.length > 1) {
            const [top, bottom] = staves as [InstanceType<typeof Stave>, InstanceType<typeof Stave>];
            if (col === 0) {
              new StaveConnector(top, bottom).setType('brace').setContext(ctx).draw();
              new StaveConnector(top, bottom).setType('singleLeft').setContext(ctx).draw();
            }
            new StaveConnector(top, bottom)
              .setType(b === last && showTimeSignature ? 'boldDoubleRight' : 'singleRight')
              .setContext(ctx)
              .draw();
          }

          const voices = parts.map((part, pi) => {
            const bar = partBars[pi]![b] ?? [{ midis: [], beats: part.beatsPerBar }];
            const notes = bar.map((item) => {
              const { code, dots } = vexDuration(item.beats);
              const base = code.replace('d', '');
              const rest = item.midis.length === 0;
              const keys = rest
                ? [part.clef === 'bass' ? 'd/3' : 'b/4']
                : item.midis.map((midi) => {
                    const name = ascii(midiToName(midi, keyContext)); // e.g. "F#4"
                    return `${name.slice(0, -1).toLowerCase()}/${name.slice(-1)}`;
                  });
              const note = new StaveNote({
                keys,
                duration: rest ? `${base}r` : base,
                dots,
                clef: part.clef,
                autoStem: true,
              });
              if (dots > 0) Dot.buildAndAttach([note], { all: true });
              // VexFlow draws stems, flags and ledger lines black unless told otherwise.
              let fill = ink;
              if (!rest && pi === 0) {
                const state = states?.[sounding];
                fill =
                  sounding === highlightIndex ? accent : state === 'ok' ? ok : state === 'bad' ? bad : ink;
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
            return { voice, beams: Beam.generateBeams(notes) };
          });

          const stave0 = staves[0]!;
          const room = stave0.getNoteEndX() - stave0.getNoteStartX() - 12;
          const formatter = new Formatter();
          for (const { voice } of voices) formatter.joinVoices([voice]);
          formatter.format(
            voices.map((v) => v.voice),
            Math.max(40, room),
          );
          voices.forEach(({ voice, beams }, pi) => {
            voice.draw(ctx, staves[pi]!);
            for (const beam of beams)
              beam.setStyle({ fillStyle: ink, strokeStyle: ink }).setContext(ctx).draw();
          });
        }
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
  }, [staff, lower, keyContext, highlightIndex, states, width, scale, showTimeSignature]);

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
