import { useEffect, useRef, useState } from 'react';
import type { KeyContext } from '@/theory/keys';
import { midiToName } from '@/theory/notes';

/**
 * Renders a short phrase as notation (VexFlow 5), lazily — the engraver is
 * large and only the Read strand needs it, so it must never land in the boot
 * chunk. Until it loads (or if it fails) the note names stand in, so the
 * exercise is still playable.
 */
export function StaffSnippet({
  midis,
  keyContext,
  clef = 'treble',
  beatsPerBar = 4,
  width = 620,
  height = 130,
  highlightIndex = -1,
}: {
  midis: readonly number[];
  keyContext: KeyContext;
  clef?: 'treble' | 'bass';
  beatsPerBar?: number;
  width?: number;
  height?: number;
  /** The note the learner is on; drawn in the accent colour. */
  highlightIndex?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const el = host.current;
    if (!el) return;
    el.replaceChildren();

    void (async () => {
      try {
        const VF = await import('vexflow');
        if (cancelled || !host.current) return;
        const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = VF;

        const renderer = new Renderer(host.current, Renderer.Backends.SVG);
        renderer.resize(width, height);
        const ctx = renderer.getContext();
        // Inherit the theme instead of VexFlow's hard-coded black.
        const ink = getComputedStyle(host.current).color || '#000';
        ctx.setFillStyle(ink);
        ctx.setStrokeStyle(ink);

        const barCount = Math.max(1, Math.ceil(midis.length / beatsPerBar));
        const barWidth = (width - 20) / barCount;

        let noteIdx = 0;
        for (let bar = 0; bar < barCount; bar++) {
          const stave = new Stave(10 + bar * barWidth, 20, barWidth);
          if (bar === 0) {
            stave.addClef(clef).addKeySignature(keyContext.tonic).addTimeSignature(`${beatsPerBar}/4`);
          }
          stave.setContext(ctx).draw();

          const slice = midis.slice(bar * beatsPerBar, (bar + 1) * beatsPerBar);
          if (slice.length === 0) continue;
          const notes = slice.map((midi) => {
            const name = midiToName(midi, keyContext); // e.g. "F#4"
            const letter = name.slice(0, -1).toLowerCase();
            const octave = name.slice(-1);
            const note = new StaveNote({
              keys: [`${letter}/${octave}`],
              duration: 'q',
              clef,
            });
            if (letter.length > 1) note.addModifier(new Accidental(letter.slice(1)), 0);
            if (noteIdx === highlightIndex) {
              note.setStyle({ fillStyle: 'var(--accent)', strokeStyle: 'var(--accent)' });
            }
            noteIdx += 1;
            return note;
          });

          const voice = new Voice({ numBeats: slice.length, beatValue: 4 });
          voice.setStrict(false).addTickables(notes);
          new Formatter().joinVoices([voice]).format([voice], barWidth - 60);
          voice.draw(ctx, stave);
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
  }, [midis, keyContext, clef, beatsPerBar, width, height, highlightIndex]);

  if (failed) {
    return (
      <p role="img" aria-label={`Phrase: ${midis.map((m) => midiToName(m, keyContext)).join(', ')}`}>
        {midis.map((m) => midiToName(m, keyContext)).join(' · ')}
      </p>
    );
  }

  return (
    <div
      ref={host}
      role="img"
      aria-label={`Notation: ${midis.map((m) => midiToName(m, keyContext)).join(', ')}`}
      style={{ color: 'var(--text)', overflowX: 'auto' }}
    />
  );
}
