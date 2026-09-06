import type { MidiEvent } from '@/midi/types';
import { getAudioContext, audioContextState } from './clock';

export interface SamplerStatus {
  state: 'idle' | 'loading' | 'ready' | 'error';
  /** 0..1 */
  progress: number;
}

type PianoInstrument = {
  start(event: { note: number; velocity?: number }): unknown;
  stop(target?: number): void;
  setCC(cc: number, value: number): void;
  ready: Promise<void>;
};

let piano: PianoInstrument | null = null;
let masterGain: GainNode | null = null;
let muted = false;
let status: SamplerStatus = { state: 'idle', progress: 0 };
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setStatus(next: SamplerStatus): void {
  status = next;
  for (const cb of listeners) cb();
}

export function getSamplerStatus(): SamplerStatus {
  return status;
}

export function subscribeSampler(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setMasterVolume(v: number): void {
  if (masterGain) masterGain.gain.value = v;
}

export function setMuted(m: boolean): void {
  muted = m;
  if (m) {
    piano?.setCC(64, 0);
    piano?.stop();
  }
}

/**
 * Where the piano samples come from. `scripts/fetch-samples.mjs` writes them
 * under `public/samples/`, which the desktop build ships so the app has sound
 * with no network. If that copy is absent we fall back to smplr's own host, so
 * a bare checkout still makes noise.
 */
const LOCAL_SAMPLES = '/samples/splendid-grand-piano';

async function localSampleBaseUrl(): Promise<string | undefined> {
  try {
    // GET also works through the offline sample cache. A HEAD probe would miss it.
    const res = await fetch(`${LOCAL_SAMPLES}/FF%20A0.ogg`);
    return res.ok ? new URL(LOCAL_SAMPLES, location.href).href : undefined;
  } catch {
    return undefined;
  }
}

async function loadSampler(): Promise<void> {
  setStatus({ state: 'loading', progress: 0 });
  try {
    const ctx = getAudioContext();
    masterGain?.disconnect();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(ctx.destination);
    const { SplendidGrandPiano } = await import('smplr');
    const baseUrl = await localSampleBaseUrl();
    const instrument = SplendidGrandPiano(ctx, {
      ...(baseUrl ? { baseUrl } : {}),
      destination: masterGain,
      onLoadProgress: (p: { loaded: number; total: number }) => {
        setStatus({ state: 'loading', progress: p.total > 0 ? p.loaded / p.total : 0 });
      },
    });
    await instrument.ready;
    piano = instrument as unknown as PianoInstrument;
    setStatus({ state: 'ready', progress: 1 });
  } catch (err) {
    console.error('Sampler load failed:', err);
    setStatus({ state: 'error', progress: 0 });
  }
}

/** Idempotent; every caller waits for the same active sample load. */
export function ensureSamplerLoaded(): Promise<void> {
  if (status.state === 'ready') return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = loadSampler().finally(() => {
    loadPromise = null;
  });
  return loadPromise;
}

/**
 * Live echo of an incoming MIDI event. Direct call — never queue through a
 * scheduler; latency is the whole point.
 */
export function echo(e: MidiEvent): void {
  if (!piano || muted || audioContextState() !== 'running') return;
  if (e.kind === 'pedal') {
    piano.setCC(64, e.value);
  } else if (e.kind === 'noteon') {
    piano.start({ note: e.midi, velocity: Math.round(e.velocity * 127) });
  } else {
    piano.stop(e.midi);
  }
}

/** Programmatic playback (demos, previews). */
export function playNote(midi: number, velocity = 0.8): void {
  if (!piano || audioContextState() !== 'running') return;
  piano.start({ note: midi, velocity: Math.round(velocity * 127) });
}

export function stopNote(midi: number): void {
  piano?.stop(midi);
}
