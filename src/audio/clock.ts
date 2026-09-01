let ctx: AudioContext | null = null;
let anchor = { contextTime: 0, performanceTime: 0 };
let anchorTimer: ReturnType<typeof setInterval> | undefined;

function refreshAnchor(): void {
  if (!ctx) return;
  const ts = ctx.getOutputTimestamp?.();
  if (ts && ts.contextTime !== undefined && ts.performanceTime !== undefined) {
    anchor = { contextTime: ts.contextTime, performanceTime: ts.performanceTime };
  } else {
    anchor = { contextTime: ctx.currentTime, performanceTime: performance.now() };
  }
}

export function getAudioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' });
    refreshAnchor();
    // Clocks drift; re-anchor periodically.
    anchorTimer = setInterval(refreshAnchor, 30_000);
  }
  return ctx;
}

export function audioContextState(): AudioContextState | 'uncreated' {
  return ctx?.state ?? 'uncreated';
}

/** Call from a real user gesture only. */
export async function unlockAudio(): Promise<void> {
  const c = getAudioContext();
  if (c.state === 'suspended') await c.resume();
  refreshAnchor();
}

/** perf-clock ms → audio-clock seconds. */
export function perfToAudio(tPerf: number): number {
  return anchor.contextTime + (tPerf - anchor.performanceTime) / 1000;
}

/** audio-clock seconds → perf-clock ms. */
export function audioToPerf(tAudio: number): number {
  return anchor.performanceTime + (tAudio - anchor.contextTime) * 1000;
}

/** Test/teardown helper. */
export function disposeAudio(): void {
  clearInterval(anchorTimer);
  void ctx?.close();
  ctx = null;
}
