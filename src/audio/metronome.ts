import { audioToPerf, getAudioContext } from './clock';

export interface BeatInfo {
  /** Bar index from 0; negative during count-in. */
  bar: number;
  beatInBar: number;
  /** Beat index from 0 at the first post-count-in beat; negative during count-in. */
  beatIndex: number;
  tAudio: number;
  tPerf: number;
}

export interface MetronomeStart {
  bpm: number;
  timeSig?: [number, number];
  countInBars?: number;
  volume?: number;
}

export interface MetronomeAnchor {
  /** perf-clock ms of beat 0 (first beat AFTER the count-in). */
  t0Perf: number;
  beatMs: number;
}

type BeatCallback = (beat: BeatInfo) => void;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

let timer: ReturnType<typeof setInterval> | undefined;
let uiTimers: ReturnType<typeof setTimeout>[] = [];
let running = false;
const beatCbs = new Set<BeatCallback>();

export function onBeat(cb: BeatCallback): () => void {
  beatCbs.add(cb);
  return () => beatCbs.delete(cb);
}

export function isRunning(): boolean {
  return running;
}

function click(tAudio: number, accent: boolean, volume: number): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = accent ? 1568 : 1046;
  gain.gain.setValueAtTime(0, tAudio);
  gain.gain.linearRampToValueAtTime(volume, tAudio + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, tAudio + 0.03);
  osc.connect(gain).connect(ctx.destination);
  osc.start(tAudio);
  osc.stop(tAudio + 0.05);
}

/**
 * Starts the click. Returns the anchor for the beat grid — the matcher's
 * expectations and the audible clicks share it by construction.
 */
export function startMetronome(opts: MetronomeStart): MetronomeAnchor {
  stopMetronome();
  const ctx = getAudioContext();
  const [beatsPerBar] = opts.timeSig ?? [4, 4];
  const countInBars = opts.countInBars ?? (opts.bpm < 60 ? 2 : 1);
  const volume = opts.volume ?? 0.5;
  const beatS = 60 / opts.bpm;

  const startAudio = ctx.currentTime + 0.15;
  const countInBeats = countInBars * beatsPerBar;
  const t0Audio = startAudio + countInBeats * beatS;
  const anchor: MetronomeAnchor = { t0Perf: audioToPerf(t0Audio), beatMs: beatS * 1000 };

  let nextBeat = -countInBeats; // beat index; 0 = first post-count-in beat
  running = true;

  const schedule = () => {
    if (!running) return;
    while (true) {
      const tAudio = t0Audio + nextBeat * beatS;
      if (tAudio > ctx.currentTime + SCHEDULE_AHEAD_S) break;
      const beatIndex = nextBeat;
      const bar = Math.floor(beatIndex / beatsPerBar);
      const beatInBar = ((beatIndex % beatsPerBar) + beatsPerBar) % beatsPerBar;
      click(tAudio, beatInBar === 0, volume);
      const tPerf = audioToPerf(tAudio);
      const info: BeatInfo = { bar, beatInBar, beatIndex, tAudio, tPerf };
      // Fire UI/matcher callbacks at the audible moment, not schedule time.
      const delay = Math.max(0, tPerf - performance.now());
      const t = setTimeout(() => {
        for (const cb of beatCbs) cb(info);
      }, delay);
      uiTimers.push(t);
      nextBeat += 1;
    }
  };

  schedule();
  timer = setInterval(schedule, LOOKAHEAD_MS);
  return anchor;
}

export function stopMetronome(): void {
  running = false;
  clearInterval(timer);
  for (const t of uiTimers) clearTimeout(t);
  uiTimers = [];
}
