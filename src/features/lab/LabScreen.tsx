import { useEffect, useRef, useState } from 'react';
import { generate } from '@/engine/generators';
import { resolveSeed } from '@/engine/rng';
import type { ExerciseDef, ExerciseInstance, MatchMode, TimingTier } from '@/engine/types';
import { TIER_WINDOWS } from '@/engine/matcher/timing';
import { targetMidis } from '@/engine/matcher/setMatch';
import { useMidiStore } from '@/store/midiStore';
import { useRunStore } from '@/store/runStore';
import { Keyboard, type KeyLabels } from '@/ui/Keyboard';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { playNote, stopNote } from '@/audio/sampler';
import styles from './LabScreen.module.css';

const TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const QUALITIES = ['maj', 'min', 'dim', 'aug', 'maj7', 'm7', '7', 'm7b5', 'dim7'];

function useFps(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

/** Build a fake-MIDI script that plays the instance correctly. */
function perfectScript(instance: ExerciseInstance, bpm: number, leadInMs: number) {
  const beatMs = 60_000 / bpm;
  const spacing = instance.beatsPerTarget ?? 1;
  const notes: { midi: number; at: number; dur: number }[] = [];
  instance.targets.forEach((t, i) => {
    const at = leadInMs + (t.atBeat ?? i * spacing) * beatMs;
    for (const midi of targetMidis(t)) notes.push({ midi, at, dur: beatMs * 0.6 });
  });
  return notes;
}

export function LabScreen() {
  const fps = useFps();
  const [generator, setGenerator] = useState('scale-run');
  const [tonic, setTonic] = useState('D');
  const [quality, setQuality] = useState('maj');
  const [inversion, setInversion] = useState(0);
  const [hand, setHand] = useState<'rh' | 'lh'>('rh');
  const [mode, setMode] = useState<MatchMode>('wait');
  const [bpm, setBpm] = useState(80);
  const [tier, setTier] = useState<TimingTier>('standard');
  const [labels, setLabels] = useState<KeyLabels>('none');
  const [count, setCount] = useState(8);
  const [voiceLead, setVoiceLead] = useState<'free' | 'smooth'>('free');
  const [style, setStyle] = useState<'block' | 'brokenLH'>('block');
  const [voicing, setVoicing] = useState<'triad' | 'shell17' | 'shell13' | 'guidetones'>('triad');
  const [compPattern, setCompPattern] = useState<'straight8' | 'ballad' | 'boomchuck' | 'swing'>(
    'straight8',
  );

  const activeNotes = useMidiStore((s) => s.activeNotes);
  const phase = useRunStore((s) => s.phase);
  const targets = useRunStore((s) => s.targets);
  const judgments = useRunStore((s) => s.judgments);
  const fingerMap = useRunStore((s) => s.fingerMap);
  const targetIndex = useRunStore((s) => s.targetIndex);
  const beatIndex = useRunStore((s) => s.beatIndex);
  const result = useRunStore((s) => s.result);
  const instance = useRunStore((s) => s.instance);
  const startRun = useRunStore((s) => s.startRun);
  const abortRun = useRunStore((s) => s.abortRun);
  const lastInstance = useRef<ExerciseInstance | null>(null);

  useEffect(() => () => abortRun(), [abortRun]);

  const buildDef = (): ExerciseDef => {
    const base = {
      mode,
      bpm,
      timingTier: tier,
      rung: 'keys-lit' as const,
      hand,
      seedPolicy: 'random' as const,
    };
    if (generator === 'scale-run') {
      return { ...base, generator, params: { tonic, scaleType: 'major', hand, direction: 'up' } };
    }
    if (generator === 'five-finger') {
      return { ...base, generator, params: { tonic, quality: 'maj', hand, pattern: 'updown' } };
    }
    if (generator === 'chord-grip') {
      return { ...base, generator, params: { root: tonic, quality, inversion, hand } };
    }
    if (generator === 'grip-interleave') {
      return {
        ...base,
        generator,
        params: {
          roots: ['C', 'F', 'G', 'D'],
          qualities: ['maj', 'min'],
          inversions: [0, 1, 2],
          count,
          hand,
        },
      };
    }
    if (generator === 'progression-play') {
      return {
        ...base,
        generator,
        params: {
          key: { tonic, mode: 'major' },
          roman: ['I', 'V', 'vi', 'IV'],
          beatsPerChord: 4,
          loops: 1,
          voiceLead,
          style,
        },
      };
    }
    if (generator === 'harmonize') {
      return {
        ...base,
        mode: 'wait' as const,
        generator: 'progression-play',
        params: {
          key: { tonic, mode: 'major' },
          roman: ['I', 'IV', 'V', 'I', 'vi', 'IV', 'V', 'I'],
          acceptAlternatives: true,
        },
      };
    }
    if (generator === 'unseen-chart') {
      return {
        ...base,
        generator,
        params: { form: 'aaba', sevenths: true, style, voicing },
      };
    }
    if (generator === 'comp-pattern') {
      return {
        ...base,
        generator: 'progression-play',
        hand: 'both' as const,
        params: {
          key: { tonic, mode: 'major' },
          roman: ['ii7', 'V7', 'Imaj7'],
          beatsPerChord: 4,
          loops: 2,
          style: compPattern,
          voicing,
          ...(compPattern === 'swing' ? { swing: 0.667 } : {}),
        },
      };
    }
    if (generator === 'improv') {
      return {
        ...base,
        mode: 'wait' as const,
        generator,
        params: {
          key: { tonic, mode: 'major' },
          palette: 'pentatonic',
          roman: ['I', 'V', 'vi', 'IV'],
          loops: 1,
          targetDownbeats: true,
        },
      };
    }
    if (generator === 'read-snippet') {
      return {
        ...base,
        generator,
        params: { key: { tonic, mode: 'major' }, clef: hand === 'lh' ? 'bass' : 'treble', bars: 2 },
      };
    }
    if (generator === 'ear-progression') {
      return {
        ...base,
        mode: 'wait' as const,
        generator,
        params: {
          key: { tonic, mode: 'major' },
          pool: [
            ['I', 'IV', 'V', 'I'],
            ['I', 'V', 'vi', 'IV'],
            ['I', 'vi', 'IV', 'V'],
          ],
          count: 2,
        },
      };
    }
    return {
      ...base,
      generator: 'flashcard',
      params: { kind: 'spell', roots: TONICS, qualities: ['maj', 'min', '7'], count },
    };
  };

  const start = () => {
    const def = buildDef();
    const inst = generate(def, resolveSeed(def.seedPolicy));
    lastInstance.current = inst;
    void startRun(inst);
  };

  const playPerfect = () => {
    const inst = lastInstance.current;
    if (!inst || !window.__fakeMidi) return;
    const t0 = useRunStore.getState().anchorT0Perf;
    // Tempo mode: align exactly with the metronome's beat-0 anchor.
    const leadIn = mode === 'tempo' && t0 !== null ? t0 - performance.now() : 300;
    window.__fakeMidi.play(perfectScript(inst, bpm, leadIn));
  };

  const stress = () => {
    if (!window.__fakeMidi) return;
    const notes = Array.from({ length: 150 }, (_, i) => ({
      midi: 36 + ((i * 7) % 48),
      at: i * 33,
      dur: 120,
    }));
    window.__fakeMidi.play(notes);
  };

  const windows = TIER_WINDOWS[tier];

  return (
    <div className={styles['wrap']}>
      <div className={styles['header']}>
        <h1>Lab</h1>
        <span className={styles['fps']} data-low={fps > 0 && fps < 55}>
          {fps} fps
        </span>
      </div>
      <Card>
        <div className={styles['controls']}>
          <label>
            Generator
            <select value={generator} onChange={(e) => setGenerator(e.target.value)}>
              <option value="scale-run">scale-run</option>
              <option value="five-finger">five-finger</option>
              <option value="chord-grip">chord-grip</option>
              <option value="grip-interleave">grip-interleave</option>
              <option value="flashcard">flashcard (spell)</option>
              <option value="progression-play">progression-play</option>
              <option value="harmonize">harmonize (acceptAlternatives)</option>
              <option value="ear-progression">ear-progression</option>
              <option value="comp-pattern">comp-pattern</option>
              <option value="unseen-chart">unseen-chart</option>
              <option value="improv">improv</option>
              <option value="read-snippet">read-snippet</option>
            </select>
          </label>
          {(generator === 'progression-play' || generator === 'unseen-chart') && (
            <>
              {generator === 'progression-play' && (
                <label>
                  Voice leading
                  <select
                    value={voiceLead}
                    onChange={(e) => setVoiceLead(e.target.value as 'free' | 'smooth')}
                  >
                    <option value="free">free</option>
                    <option value="smooth">smooth</option>
                  </select>
                </label>
              )}
              <label>
                Style
                <select value={style} onChange={(e) => setStyle(e.target.value as 'block' | 'brokenLH')}>
                  <option value="block">block</option>
                  <option value="brokenLH">brokenLH</option>
                </select>
              </label>
            </>
          )}
          {(generator === 'comp-pattern' || generator === 'unseen-chart') && (
            <label>
              Voicing
              <select
                value={voicing}
                onChange={(e) => setVoicing(e.target.value as typeof voicing)}
              >
                <option value="triad">triad</option>
                <option value="shell17">shell 1-7</option>
                <option value="shell13">shell 1-3</option>
                <option value="guidetones">guide tones</option>
              </select>
            </label>
          )}
          {generator === 'comp-pattern' && (
            <label>
              Pattern
              <select
                value={compPattern}
                onChange={(e) => setCompPattern(e.target.value as typeof compPattern)}
              >
                <option value="straight8">straight 8ths</option>
                <option value="ballad">ballad</option>
                <option value="boomchuck">boom-chuck</option>
                <option value="swing">swing</option>
              </select>
            </label>
          )}
          <label>
            Tonic/root
            <select value={tonic} onChange={(e) => setTonic(e.target.value)}>
              {TONICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          {generator === 'chord-grip' && (
            <>
              <label>
                Quality
                <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                  {QUALITIES.map((q) => (
                    <option key={q}>{q}</option>
                  ))}
                </select>
              </label>
              <label>
                Inversion
                <select value={inversion} onChange={(e) => setInversion(Number(e.target.value))}>
                  {[0, 1, 2, 3].map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {(generator === 'grip-interleave' || generator === 'flashcard') && (
            <label>
              Count
              <input
                type="number"
                min={2}
                max={30}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>
          )}
          <label>
            Hand
            <select value={hand} onChange={(e) => setHand(e.target.value as 'rh' | 'lh')}>
              <option value="rh">RH</option>
              <option value="lh">LH</option>
            </select>
          </label>
          <label>
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value as MatchMode)}>
              <option value="wait">wait</option>
              <option value="tempo">tempo</option>
            </select>
          </label>
          {mode === 'tempo' && (
            <>
              <label>
                BPM
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                />
              </label>
              <label>
                Tier
                <select value={tier} onChange={(e) => setTier(e.target.value as TimingTier)}>
                  <option value="relaxed">relaxed</option>
                  <option value="standard">standard</option>
                  <option value="strict">strict</option>
                </select>
              </label>
            </>
          )}
          <label>
            Labels
            <select value={labels} onChange={(e) => setLabels(e.target.value as KeyLabels)}>
              <option value="none">none</option>
              <option value="names">names</option>
              <option value="fingers">fingers</option>
            </select>
          </label>
        </div>
        <div className={styles['actions']}>
          <Button variant="primary" onClick={start}>
            Start
          </Button>
          <Button onClick={abortRun}>Abort</Button>
          <Button onClick={playPerfect} disabled={!window.__fakeMidi} title="Requires ?midi=fake">
            ▶ Play perfectly (fake)
          </Button>
          <Button onClick={stress} disabled={!window.__fakeMidi} title="Requires ?midi=fake">
            Stress 30n/s
          </Button>
        </div>
      </Card>

      <div className={styles['status']}>
        <span>
          phase: <strong>{phase}</strong>
        </span>
        <span>
          target: <strong className="tabular">{targetIndex + 1}</strong>/{instance?.targets.length ?? '–'}
        </span>
        <span>
          beat: <strong className="tabular">{beatIndex ?? '–'}</strong>
        </span>
        {mode === 'tempo' && (
          <span>
            windows ±{windows.perfect}/{windows.good}/{windows.outer}ms
          </span>
        )}
        {instance && (
          <span className={styles['promptLine']}>
            {instance.prompt.perTarget?.[targetIndex]?.label ?? instance.prompt.title}
          </span>
        )}
      </div>

      <Keyboard
        range={[36, 96]}
        pressed={activeNotes}
        targets={targets}
        judgments={judgments}
        fingerMap={fingerMap}
        labels={labels}
        onKeyDown={(m) => playNote(m)}
        onKeyUp={(m) => stopNote(m)}
      />

      {result && (
        <Card>
          <h3>
            Result — score {(result.score * 100).toFixed(0)}% · {'★'.repeat(result.stars) || '—'}{' '}
            {result.passed ? '· passed' : '· not yet'}
          </h3>
          <pre className={styles['dump']}>
            {JSON.stringify(
              {
                pitch: result.pitchAccuracy,
                timing: result.timingAccuracy,
                judgments: result.judgments,
              },
              null,
              1,
            )}
          </pre>
        </Card>
      )}
    </div>
  );
}
