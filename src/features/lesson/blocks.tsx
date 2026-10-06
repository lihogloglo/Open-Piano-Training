import { tr } from '@/i18n';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ExplainBlock } from '@/curriculum/schema';
import { Keyboard } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { playNote, stopNote } from '@/audio/sampler';
import { unlockAudio } from '@/audio/clock';
import { subscribeMidiEvents } from '@/store/midiStore';
import { midiToName, midiToPcName, namePc, nameToMidi } from '@/theory/notes';
import { staffFromNotes, type TimedNote } from '@/engine/staff';
import type { StaffModel } from '@/engine/types';
import { StaffSnippet, staffNaturalWidth, type StaffNoteState } from '@/ui/StaffSnippet';
import { buildChord } from '@/theory/chords';
import { progressionChords } from '@/theory/progressions';
import { CIRCLE_OF_FIFTHS } from '@/theory/keys';
import styles from './blocks.module.css';

/** Markdown-lite: our own trusted content; only **bold** and *italic*. */
export function renderMd(md: string): ReactNode[] {
  const parts = md.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function KeyboardDemoBlock({ block }: { block: Extract<ExplainBlock, { kind: 'keyboardDemo' }> }) {
  const [ghost, setGhost] = useState<ReadonlySet<number>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [playing, setPlaying] = useState(false);

  const midis = block.demo.events.map((e) => e.midi);
  const lo = Math.min(...midis) - 2;
  const hi = Math.max(...midis) + 2;

  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  const play = async () => {
    await unlockAudio();
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    setPlaying(true);
    const beatMs = 60_000 / block.demo.bpm;
    let end = 0;
    for (const ev of block.demo.events) {
      const at = ev.atBeat * beatMs + 200;
      const until = at + ev.durBeats * beatMs;
      end = Math.max(end, until);
      timers.current.push(
        setTimeout(() => {
          playNote(ev.midi, 0.7);
          setGhost((g) => new Set([...g, ev.midi]));
        }, at),
        setTimeout(() => {
          stopNote(ev.midi);
          setGhost((g) => {
            const next = new Set(g);
            next.delete(ev.midi);
            return next;
          });
        }, until),
      );
    }
    timers.current.push(setTimeout(() => setPlaying(false), end + 100));
  };

  return (
    <div className={styles['demo']}>
      <Keyboard range={[lo, hi]} pressed={new Set()} ghost={ghost} height={110} />
      <div className={styles['demoRow']}>
        <Button onClick={() => void play()} disabled={playing}>
          <Icon name={playing ? 'listen' : 'play'} size={16} />
          {playing ? tr('Playing…') : tr('Hear it')}
        </Button>
        {block.caption && <span className={styles['caption']}>{block.caption}</span>}
      </div>
    </div>
  );
}

function ProgressionCardBlock({ block }: { block: Extract<ExplainBlock, { kind: 'progressionCard' }> }) {
  const chords = progressionChords(block.roman, block.key);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  const playChord = (i: number) => {
    const chord = chords[i];
    if (!chord) return;
    void unlockAudio().then(() => {
      const midis = buildChord({ root: chord.root, quality: chord.quality, inversion: 0 }, 55);
      for (const m of midis) playNote(m, 0.7);
      timers.current.push(setTimeout(() => midis.forEach((m) => stopNote(m)), 900));
    });
  };

  return (
    <div className={styles['progression']}>
      <div className={styles['chips']}>
        {chords.map((c, i) => (
          <button key={i} className={styles['chip']} data-degree={c.degree} onClick={() => playChord(i)}>
            <span className={styles['roman']}>{c.roman}</span>
            <span className={styles['chipRoot']}>{c.root.replace('#', '♯').replace(/(?<=.)b/, '♭')}</span>
          </button>
        ))}
      </div>
      <p className={styles['caption']}>
        {tr('in ')}
        {block.key.tonic} {tr(block.key.mode)}
        {tr('. Tap a chord to hear it')}
      </p>
    </div>
  );
}

function CircleOfFifthsBlock({ block }: { block: Extract<ExplainBlock, { kind: 'circleOfFifths' }> }) {
  const R = 92;
  return (
    <svg viewBox="0 0 240 240" className={styles['circle']} role="img" aria-label={tr('Circle of fifths')}>
      <circle cx="120" cy="120" r={R + 22} fill="none" stroke="var(--border)" />
      {CIRCLE_OF_FIFTHS.map((name, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 120 + R * Math.cos(angle);
        const y = 120 + R * Math.sin(angle);
        const hot = block.highlight?.includes(name);
        return (
          <g key={name}>
            {hot && <circle cx={x} cy={y} r={16} fill="var(--accent)" opacity={0.25} />}
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              style={{
                fontSize: 15,
                fontWeight: hot ? 700 : 500,
                fill: hot ? 'var(--accent)' : 'var(--text-2)',
              }}
            >
              {name.replace('#', '♯').replace(/(?<=.)b/, '♭')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function EarCheckBlock({ block }: { block: Extract<ExplainBlock, { kind: 'earCheck' }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  const play = () => {
    void unlockAudio().then(() => {
      const beatMs = 60_000 / block.demo.bpm;
      for (const ev of block.demo.events) {
        const at = ev.atBeat * beatMs + 150;
        timers.current.push(
          setTimeout(() => playNote(ev.midi, 0.7), at),
          setTimeout(() => stopNote(ev.midi), at + ev.durBeats * beatMs),
        );
      }
    });
  };

  return (
    <div className={styles['earCheck']}>
      <p className={styles['text']}>{block.question}</p>
      <div className={styles['demoRow']}>
        <Button onClick={play}>
          <Icon name="play" size={16} />
          {tr('Listen')}
        </Button>
        {block.options.map((opt, i) => (
          <Button
            key={i}
            variant={picked === i ? (i === block.correctIndex ? 'primary' : 'secondary') : 'ghost'}
            onClick={() => setPicked(i)}
          >
            {opt}
            {picked === i && (i === block.correctIndex ? ' ✓' : tr(', listen again'))}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * "Play it now" — the explain step's hands-on block. Accepts the real MIDI
 * keyboard and the on-screen one equally, so it works with no device attached.
 * A wrong note is named back ("that's a D") because at this stage naming what
 * you just played *is* the lesson.
 */
function PlayCheckBlock({
  block,
  active,
  onSatisfied,
  registerOffer,
}: {
  block: Extract<ExplainBlock, { kind: 'playCheck' }>;
  /** Only one check on a step listens at a time, so they read as a sequence. */
  active: boolean;
  onSatisfied: () => void;
  /** Lends the step's own keyboard to whichever check is currently listening. */
  registerOffer: (handler: ((midi: number) => void) | null) => void;
}) {
  const wanted = useMemo(
    () => new Set(block.notes.map((n) => namePc(n)).filter((pc): pc is number => pc !== null)),
    [block.notes],
  );
  const [hits, setHits] = useState<ReadonlySet<number>>(new Set());
  const [missed, setMissed] = useState<string | null>(null);

  const done = hits.size >= block.count;
  const listening = active && !done;

  useEffect(() => {
    if (done) onSatisfied();
  }, [done, onSatisfied]);

  const offer = useCallback(
    (midi: number) => {
      if (!listening) return;
      if (!wanted.has(midi % 12)) {
        setMissed(midiToPcName(midi));
        return;
      }
      setMissed(null);
      // 'octave' counts each distinct key; 'name' counts each distinct letter.
      setHits((prev) => new Set([...prev, block.distinct === 'name' ? midi % 12 : midi]));
    },
    [wanted, block.distinct, listening],
  );

  // Two input surfaces, one check: the attached MIDI keyboard, and the step's
  // on-screen keyboard (the only one a learner without a device has).
  useEffect(
    () =>
      subscribeMidiEvents((e) => {
        if (e.kind === 'noteon') offer(e.midi);
      }),
    [offer],
  );
  useEffect(() => {
    if (!listening) return;
    registerOffer(offer);
    return () => registerOffer(null);
  }, [listening, offer, registerOffer]);

  const status = done
    ? block.count > 1
      ? tr("All {v0} — that's the pattern.", { v0: block.count })
      : tr('That’s it.')
    : !active
      ? tr('Finish the step above first.')
      : missed
        ? tr('That’s {v0}. Try again.', { v0: missed })
        : (block.hint ?? tr('Play it on your keyboard, or click the keys below.'));

  return (
    <div className={styles['playCheck']} data-done={done || undefined} data-waiting={!active || undefined}>
      <p className={styles['text']}>{renderMd(block.ask)}</p>
      <div className={styles['demoRow']}>
        <span className={styles['checkMark']} aria-hidden>
          {done ? <Icon name="check" size={18} /> : null}
        </span>
        {/* Screen readers get the running state; the count is the visual cue. */}
        <span className={styles['caption']} role="status">
          {status}
        </span>
        {block.count > 1 && (
          <span className={`${styles['checkCount']} tabular`}>
            {Math.min(hits.size, block.count)} / {block.count}
          </span>
        )}
      </div>
    </div>
  );
}

type StaffCheck = Extract<ExplainBlock, { kind: 'staffCheck' }>;

/** The block's notes with their start beats. A rest is a gap; the staff draws it from the gap. */
function staffCheckNotes(block: StaffCheck): TimedNote[] {
  const out: TimedNote[] = [];
  let at = 0;
  block.notes.forEach((name, i) => {
    const len = block.beats?.[i] ?? 1;
    if (name !== 'rest') out.push({ midi: nameToMidi(name) ?? 60, atBeat: at, durBeats: len * 0.9 });
    at += len;
  });
  return out;
}

/** Wide enough to keep a short card on one line at the card's scale. */
function cardWidth(staff: StaffModel): number {
  // A few units of slack: an exact fit can round below the need and wrap the last bar.
  return Math.min(740, Math.ceil((staffNaturalWidth(staff) + 12) * CARD_SCALE));
}

const CARD_SCALE = 1.45;

/** The staff for a block: exactly the authored length, so a trailing rest stays and nothing more is added. */
function staffCheckStaff(block: StaffCheck, timed: TimedNote[]) {
  const total = (block.beats ?? block.notes.map(() => 1)).reduce((a, b) => a + b, 0);
  // A pitch-only card (no beats given) is one unmetred group: no bar lines inside it.
  const beatsPerBar = block.beats ? (block.beatsPerBar ?? 4) : Math.max(1, block.notes.length);
  const written = staffFromNotes(timed, {
    clef: block.clef,
    beatsPerBar,
    ...(block.pickupBeats ? { pickupBeats: block.pickupBeats } : {}),
  });
  const items = [];
  let at = 0;
  for (const item of written.items) {
    at += item.beats;
    if (at > total + 1e-6) break;
    items.push(item);
  }
  return { ...written, items };
}

/**
 * "Read it, play it" — a few notes on a staff, played in order at the written
 * pitch. The current note is lit, each played note turns green, and a wrong
 * key is named back. Like the play-check, it answers but never gates.
 */
function StaffCheckBlock({
  block,
  active,
  onSatisfied,
  registerOffer,
}: {
  block: StaffCheck;
  active: boolean;
  onSatisfied: () => void;
  registerOffer: (handler: ((midi: number) => void) | null) => void;
}) {
  const key = useMemo(() => block.key ?? { tonic: 'C', mode: 'major' as const }, [block.key]);
  const timed = useMemo(() => staffCheckNotes(block), [block]);
  const staff = useMemo(() => staffCheckStaff(block, timed), [block, timed]);
  const [next, setNext] = useState(0);
  const [missed, setMissed] = useState<string | null>(null);
  const done = next >= timed.length;
  const listening = active && !done;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  useEffect(() => {
    if (done) onSatisfied();
  }, [done, onSatisfied]);

  const offer = useCallback(
    (midi: number) => {
      if (!listening) return;
      if (midi !== timed[next]?.midi) {
        setMissed(midiToName(midi, key));
        return;
      }
      setMissed(null);
      setNext((n) => n + 1);
    },
    [listening, timed, next, key],
  );
  useEffect(
    () =>
      subscribeMidiEvents((e) => {
        if (e.kind === 'noteon') offer(e.midi);
      }),
    [offer],
  );
  useEffect(() => {
    if (!listening) return;
    registerOffer(offer);
    return () => registerOffer(null);
  }, [listening, offer, registerOffer]);

  const hear = () => {
    void unlockAudio().then(() => {
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
      const beatMs = 60_000 / (block.bpm ?? 72);
      for (const n of timed) {
        const at = n.atBeat * beatMs + 150;
        timers.current.push(
          setTimeout(() => playNote(n.midi, 0.7), at),
          setTimeout(() => stopNote(n.midi), at + n.durBeats * beatMs),
        );
      }
    });
  };

  const states = useMemo<StaffNoteState[]>(
    () => timed.map((_, i) => (i < next ? 'ok' : undefined)),
    [timed, next],
  );
  const status = done
    ? tr('That’s it.')
    : !active
      ? tr('Finish the step above first.')
      : missed
        ? tr('That’s {v0}. Look again.', { v0: missed })
        : (block.hint ?? tr('Play the lit note on your keyboard, or click the keys below.'));

  return (
    <div className={styles['playCheck']} data-done={done || undefined} data-waiting={!active || undefined}>
      <p className={styles['text']}>{renderMd(block.ask)}</p>
      <div className={styles['staffCard']}>
        <StaffSnippet
          staff={staff}
          keyContext={key}
          highlightIndex={listening ? next : -1}
          states={states}
          scale={CARD_SCALE}
          showTimeSignature={!!block.beats}
          maxWidth={cardWidth(staff)}
        />
      </div>
      <div className={styles['demoRow']}>
        <span className={styles['checkMark']} aria-hidden>
          {done ? <Icon name="check" size={18} /> : null}
        </span>
        <span className={styles['caption']} role="status" data-missed={(listening && !!missed) || undefined}>
          {status}
        </span>
        {timed.length > 1 && (
          <span className={`${styles['checkCount']} tabular`}>
            {Math.min(next, timed.length)} / {timed.length}
          </span>
        )}
        {block.listen && (
          <Button variant="ghost" onClick={hear}>
            <Icon name="play" size={16} />
            {tr('Hear it')}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ExplainBlockView({
  block,
  active = true,
  onSatisfied,
  registerOffer,
}: {
  block: ExplainBlock;
  active?: boolean;
  onSatisfied?: () => void;
  registerOffer?: (handler: ((midi: number) => void) | null) => void;
}) {
  if (block.kind === 'text') return <p className={styles['text']}>{renderMd(block.md)}</p>;
  if (block.kind === 'keyboardDemo') return <KeyboardDemoBlock block={block} />;
  if (block.kind === 'progressionCard') return <ProgressionCardBlock block={block} />;
  if (block.kind === 'circleOfFifths') return <CircleOfFifthsBlock block={block} />;
  if (block.kind === 'playCheck') {
    return (
      <PlayCheckBlock
        block={block}
        active={active}
        onSatisfied={onSatisfied ?? (() => {})}
        registerOffer={registerOffer ?? (() => {})}
      />
    );
  }
  if (block.kind === 'staffCheck') {
    return (
      <StaffCheckBlock
        block={block}
        active={active}
        onSatisfied={onSatisfied ?? (() => {})}
        registerOffer={registerOffer ?? (() => {})}
      />
    );
  }
  return <EarCheckBlock block={block} />;
}
