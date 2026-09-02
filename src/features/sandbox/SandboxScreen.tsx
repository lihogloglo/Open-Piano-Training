import { useCallback, useEffect, useRef, useState } from 'react';
import { detectChord, buildChord, type DetectedChord } from '@/theory/chords';
import { diatonicTriads, type KeyContext } from '@/theory/keys';
import { namePc, midiToPcName } from '@/theory/notes';
import { PROGRESSION_CATALOG, progressionChords, type RomanChord } from '@/theory/progressions';
import { startMetronome, stopMetronome, onBeat } from '@/audio/metronome';
import { unlockAudio } from '@/audio/clock';
import { playNote, stopNote } from '@/audio/sampler';
import { useMidiStore } from '@/store/midiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Keyboard } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import styles from './SandboxScreen.module.css';

const TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const INVERSION_LABEL = ['root position', '1st inversion', '2nd inversion', '3rd inversion'];

type Tab = 'explorer' | 'drone' | 'looper';

export function SandboxScreen() {
  const [tab, setTab] = useState<Tab>('explorer');
  return (
    <div className={styles['wrap']}>
      <h1>Sandbox</h1>
      <div className={styles['tabs']} role="tablist">
        {(
          [
            ['explorer', 'Chord explorer'],
            ['drone', 'Drone improv'],
            ['looper', 'Progression looper'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={styles['tab']}
            data-active={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'explorer' && <ChordExplorer />}
      {tab === 'drone' && <DroneImprov />}
      {tab === 'looper' && <ProgressionLooper />}
    </div>
  );
}

/** Roman numeral of a detected chord inside a major key, or null if chromatic. */
function romanInKey(chord: DetectedChord, tonic: string): string | null {
  const triad = diatonicTriads({ tonic, mode: 'major' }).find(
    (t) => namePc(t.root) === namePc(chord.root) && t.quality === chord.quality,
  );
  return triad?.roman ?? null;
}

interface HistoryEntry {
  chord: DetectedChord;
  midis: number[];
}

function ChordExplorer() {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const [keyTonic, setKeyTonic] = useState('C');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const lastSymbol = useRef('');
  const replayTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const detected = activeNotes.size >= 3 ? detectChord([...activeNotes]) : null;

  useEffect(() => {
    if (!detected) {
      if (activeNotes.size === 0) lastSymbol.current = '';
      return;
    }
    const stamp = `${detected.symbol}@${detected.inversion}`;
    if (stamp === lastSymbol.current) return;
    lastSymbol.current = stamp;
    const midis = [...activeNotes].sort((a, b) => a - b);
    setHistory((h) => [{ chord: detected, midis }, ...h].slice(0, 8));
  }, [detected, activeNotes]);

  useEffect(
    () => () => {
      for (const t of replayTimers.current) clearTimeout(t);
    },
    [],
  );

  const replay = (entry: HistoryEntry) => {
    void unlockAudio().then(() => {
      for (const m of entry.midis) playNote(m, 0.7);
      replayTimers.current.push(setTimeout(() => entry.midis.forEach((m) => stopNote(m)), 1100));
    });
  };

  const roman = detected ? romanInKey(detected, keyTonic) : null;
  const spelling = detected
    ? buildChord({ root: detected.root, quality: detected.quality, inversion: 0 }, 60)
        .map((m) => midiToPcName(m, { tonic: detected.root, mode: 'major' }))
        .join(' – ')
    : '';

  return (
    <>
      <Card>
        <div className={styles['readout']}>
          <div>
            <div className={styles['bigSymbol']}>
              {detected ? detected.symbol : activeNotes.size > 0 ? '…' : 'Play something'}
            </div>
            {detected && (
              <div className={styles['detail']}>
                {spelling} · {INVERSION_LABEL[detected.inversion]}
                {roman && (
                  <>
                    {' · '}
                    <strong>{roman}</strong> in {keyTonic}
                  </>
                )}
              </div>
            )}
          </div>
          <label className={styles['keyPick']}>
            Key lens
            <select value={keyTonic} onChange={(e) => setKeyTonic(e.target.value)} aria-label="Key">
              {TONICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        {history.length > 0 && (
          <div className={styles['history']} aria-label="Last chords">
            {history.map((h, i) => (
              <button key={i} className={styles['historyChip']} onClick={() => replay(h)} title="Replay">
                {h.chord.symbol}
                {h.chord.inversion > 0 && <span className={styles['inv']}> ·{h.chord.inversion}</span>}
              </button>
            ))}
          </div>
        )}
      </Card>
      <Keyboard
        range={[36, 96]}
        pressed={activeNotes}
        labels="names"
        onKeyDown={(m) => playNote(m)}
        onKeyUp={(m) => stopNote(m)}
      />
    </>
  );
}

const RETRIGGER_MS = 6000;

function DroneImprov() {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const [tonic, setTonic] = useState('C');
  const [degrees, setDegrees] = useState<number[]>([1, 2, 3, 4, 5]);
  const [droneOn, setDroneOn] = useState(false);
  const droneNotes = useRef<number[]>([]);
  const retrigger = useRef<ReturnType<typeof setInterval>>(undefined);

  const stopDrone = useCallback(() => {
    clearInterval(retrigger.current);
    for (const m of droneNotes.current) stopNote(m);
    droneNotes.current = [];
  }, []);

  const startDrone = useCallback(
    (t: string) => {
      stopDrone();
      const pc = namePc(t) ?? 0;
      const root = 36 + pc;
      const notes = [root, root + 7]; // root + fifth pad
      droneNotes.current = notes;
      const sound = () => notes.forEach((m) => playNote(m, 0.35));
      void unlockAudio().then(() => {
        sound();
        retrigger.current = setInterval(sound, RETRIGGER_MS);
      });
    },
    [stopDrone],
  );

  useEffect(() => {
    if (droneOn) startDrone(tonic);
    else stopDrone();
    return stopDrone;
  }, [droneOn, tonic, startDrone, stopDrone]);

  const toggleDegree = (d: number) =>
    setDegrees((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  return (
    <>
      <Card>
        <div className={styles['controlsRow']}>
          <label>
            Key
            <select value={tonic} onChange={(e) => setTonic(e.target.value)} aria-label="Drone key">
              {TONICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className={styles['palette']} aria-label="Degree palette">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <button
                key={d}
                className={styles['degreeToggle']}
                data-degree={d}
                data-on={degrees.includes(d)}
                onClick={() => toggleDegree(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <Button variant={droneOn ? 'primary' : 'secondary'} onClick={() => setDroneOn((v) => !v)}>
            {droneOn ? '◼ Stop drone' : '▶ Start drone'}
          </Button>
        </div>
        <p className={styles['hint']}>
          The pad holds home for you. Wander the tinted notes, come back to 1, leave again. No wrong notes —
          only stories.
        </p>
      </Card>
      <Keyboard
        range={[48, 84]}
        pressed={activeNotes}
        degreeTint={{ tonic, degrees }}
        labels="degrees"
        onKeyDown={(m) => playNote(m)}
        onKeyUp={(m) => stopNote(m)}
      />
    </>
  );
}

const ROMAN_CHIPS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

function ProgressionLooper() {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const metronomeVolume = useSettingsStore((s) => s.metronomeVolume);
  const [tonic, setTonic] = useState('C');
  const [romans, setRomans] = useState<string[]>(['I', 'V', 'vi', 'IV']);
  const [bpm, setBpm] = useState(76);
  const [pattern, setPattern] = useState<'block' | 'broken'>('block');
  const [running, setRunning] = useState(false);
  const [barIdx, setBarIdx] = useState(-1);
  const [loopChords, setLoopChords] = useState<RomanChord[]>([]);
  const chordsRef = useRef<RomanChord[]>([]);
  const soundingRef = useRef<number[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  const stopLoop = useCallback(() => {
    stopMetronome();
    unsubRef.current?.();
    unsubRef.current = null;
    for (const m of soundingRef.current) stopNote(m);
    soundingRef.current = [];
    setBarIdx(-1);
    setRunning(false);
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  const startLoop = useCallback(() => {
    stopLoop();
    if (romans.length === 0) return;
    const key: KeyContext = { tonic, mode: 'major' };
    chordsRef.current = progressionChords(romans, key);
    setLoopChords(chordsRef.current);
    void unlockAudio().then(() => {
      startMetronome({ bpm, volume: metronomeVolume * 0.6, countInBars: 0 });
      unsubRef.current = onBeat((beat) => {
        if (beat.beatIndex < 0) return;
        const bar = beat.bar % chordsRef.current.length;
        const chord = chordsRef.current[bar];
        if (!chord) return;
        if (beat.beatInBar === 0) setBarIdx(bar);
        const voicing = buildChord({ root: chord.root, quality: chord.quality, inversion: 0 }, 48);
        const strike = (midis: number[], vel: number) => {
          for (const m of midis) {
            playNote(m, vel);
            soundingRef.current.push(m);
          }
        };
        if (pattern === 'block') {
          if (beat.beatInBar === 0) {
            for (const m of soundingRef.current) stopNote(m);
            soundingRef.current = [];
            strike(voicing, 0.5);
          }
        } else {
          // Broken comp: bass on 1, upper chord tones answering on 2-4.
          const note =
            beat.beatInBar === 0 ? voicing[0] : voicing[(beat.beatInBar - 1) % (voicing.length - 1) + 1];
          if (beat.beatInBar === 0) {
            for (const m of soundingRef.current) stopNote(m);
            soundingRef.current = [];
          }
          if (note !== undefined) strike([note], 0.45);
        }
      });
      setRunning(true);
    });
  }, [stopLoop, romans, tonic, bpm, metronomeVolume, pattern]);

  const currentChord = barIdx >= 0 ? loopChords[barIdx] : undefined;
  const tintDegrees = currentChord
    ? diatonicTriads({ tonic, mode: 'major' })
        .filter((t) => {
          const chordPcSet = buildChord(
            { root: currentChord.root, quality: currentChord.quality, inversion: 0 },
            48,
          ).map((m) => m % 12);
          return chordPcSet.includes(namePc(t.root) ?? -1);
        })
        .map((t) => t.degree)
    : undefined;

  return (
    <>
      <Card>
        <div className={styles['controlsRow']}>
          <label>
            Key
            <select value={tonic} onChange={(e) => setTonic(e.target.value)} aria-label="Looper key">
              {TONICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Preset
            <select
              aria-label="Progression preset"
              value=""
              onChange={(e) => {
                const p = PROGRESSION_CATALOG.find((x) => x.id === e.target.value);
                if (p) setRomans(p.romans);
              }}
            >
              <option value="">choose…</option>
              {PROGRESSION_CATALOG.filter((p) => p.mode === 'major').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.romans.join('–')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pattern
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value as 'block' | 'broken')}
              aria-label="Comp pattern"
            >
              <option value="block">block</option>
              <option value="broken">broken</option>
            </select>
          </label>
          <label>
            BPM
            <input
              type="number"
              min={50}
              max={140}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              aria-label="Tempo"
            />
          </label>
          <Button variant={running ? 'primary' : 'secondary'} onClick={running ? stopLoop : startLoop}>
            {running ? '◼ Stop' : '▶ Loop it'}
          </Button>
        </div>
        <div className={styles['builder']}>
          <div className={styles['loopBar']} aria-label="Current loop">
            {romans.map((r, i) => (
              <button
                key={i}
                className={styles['loopChip']}
                data-current={i === barIdx}
                onClick={() => setRomans((cur) => cur.filter((_, j) => j !== i))}
                title="Remove"
              >
                {r}
              </button>
            ))}
            {romans.length === 0 && <span className={styles['hint']}>Build a loop from the chips below</span>}
          </div>
          <div className={styles['chips']}>
            {ROMAN_CHIPS.map((r) => (
              <button
                key={r}
                className={styles['addChip']}
                onClick={() => setRomans((cur) => (cur.length < 8 ? [...cur, r] : cur))}
              >
                + {r}
              </button>
            ))}
            <Button variant="ghost" onClick={() => setRomans([])}>
              Clear
            </Button>
          </div>
        </div>
      </Card>
      <Keyboard
        range={[48, 84]}
        pressed={activeNotes}
        degreeTint={tintDegrees ? { tonic, degrees: tintDegrees } : { tonic }}
        labels="degrees"
        onKeyDown={(m) => playNote(m)}
        onKeyUp={(m) => stopNote(m)}
      />
    </>
  );
}
