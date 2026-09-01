// Minimal mirror of the fake-adapter test hook (src/midi/fakeAdapter.ts).
interface FakeMidiControlsForTests {
  play(script: { midi: number; at: number; dur: number; vel?: number }[]): void;
  pressNow(midi: number, vel?: number): void;
  release(midi: number): void;
  releaseAll(): void;
}

interface Window {
  __fakeMidi?: FakeMidiControlsForTests;
}
