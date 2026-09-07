import { readPreferences } from '@/progress/preferences';
import { setTouristMode } from '@/progress/tourist';
import { create } from 'zustand';

export type ThemeSetting = 'dark' | 'light' | 'system';

interface SettingsState {
  theme: ThemeSetting;
  onboarded: boolean;
  deviceId: string | null;
  audioEnabled: boolean;
  masterVolume: number;
  metronomeVolume: number;
  dailyMinutes: number;
  latencyOffsetMs: number;
  sidebarExpanded: boolean;
  /** Opt-in notation strand (08): adds read-snippet drills and the read rating. */
  readStrandEnabled: boolean;
  /** Honour the OS reduced-motion preference, or force it on. */
  reducedMotion: boolean;
  largePractice: boolean;
  creativeFocus: 'melody' | 'rhythm' | 'harmony';
  /** Tourist mode: every unit opens, every step skips, nothing is recorded. */
  tourist: boolean;
  setTheme(theme: ThemeSetting): void;
  setOnboarded(v: boolean): void;
  setDeviceId(id: string | null): void;
  setAudioEnabled(v: boolean): void;
  setSidebarExpanded(v: boolean): void;
  setLatencyOffsetMs(ms: number): void;
  setReadStrandEnabled(v: boolean): void;
  setReducedMotion(v: boolean): void;
  setTourist(v: boolean): void;
}

const LS_KEY = 'ks.settings.v1';

interface PersistedSettings {
  theme: ThemeSetting;
  onboarded: boolean;
  deviceId: string | null;
  audioEnabled: boolean;
  masterVolume: number;
  metronomeVolume: number;
  dailyMinutes: number;
  latencyOffsetMs: number;
  sidebarExpanded: boolean;
  /** Opt-in notation strand (08): adds read-snippet drills and the read rating. */
  readStrandEnabled: boolean;
  /** Honour the OS reduced-motion preference, or force it on. */
  reducedMotion: boolean;
  largePractice: boolean;
  creativeFocus: 'melody' | 'rhythm' | 'harmony';
  /** Tourist mode: every unit opens, every step skips, nothing is recorded. */
  tourist: boolean;
}

const defaults: PersistedSettings = {
  theme: 'dark',
  onboarded: false,
  deviceId: null,
  audioEnabled: true,
  masterVolume: 0.8,
  metronomeVolume: 0.7,
  dailyMinutes: 20,
  latencyOffsetMs: 0,
  sidebarExpanded: true,
  readStrandEnabled: false,
  reducedMotion: false,
  largePractice: false,
  creativeFocus: 'melody',
  tourist: false,
};

function load(): PersistedSettings {
  return Object.assign({}, defaults, readPreferences());
}

function persist(state: SettingsState): void {
  const { theme, onboarded, deviceId, audioEnabled, masterVolume, metronomeVolume } = state;
  const { dailyMinutes, latencyOffsetMs, sidebarExpanded } = state;
  const { readStrandEnabled, reducedMotion } = state;
  const data: PersistedSettings = {
    theme,
    onboarded,
    deviceId,
    audioEnabled,
    masterVolume,
    metronomeVolume,
    dailyMinutes,
    latencyOffsetMs,
    sidebarExpanded,
    readStrandEnabled,
    reducedMotion,
    largePractice: state.largePractice,
    creativeFocus: state.creativeFocus,
    tourist: state.tourist,
  };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* quota/private mode: settings just won't persist */
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...load(),
  setTheme: (theme) => set({ theme }),
  setOnboarded: (onboarded) => set({ onboarded }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setSidebarExpanded: (sidebarExpanded) => set({ sidebarExpanded }),
  setLatencyOffsetMs: (latencyOffsetMs) => set({ latencyOffsetMs }),
  setReadStrandEnabled: (readStrandEnabled) => set({ readStrandEnabled }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setTourist: (tourist) => set({ tourist }),
}));

useSettingsStore.subscribe((state) => persist(state));

/** Applies data-theme to <html> and keeps it in sync with settings + OS preference. */
export function initTheme(): void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    const { theme } = useSettingsStore.getState();
    const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset['theme'] = resolved;
  };
  apply();
  media.addEventListener('change', apply);
  useSettingsStore.subscribe(apply);
}

/**
 * Mirrors the reduced-motion preference onto <html> so CSS can honour a user
 * who wants stillness even when the OS is not set that way. The OS preference
 * still wins on its own through the media query.
 */
export function initMotionPreference(): void {
  const apply = (): void => {
    const { reducedMotion, largePractice } = useSettingsStore.getState();
    document.documentElement.dataset['largePractice'] = String(largePractice);
    if (reducedMotion) document.documentElement.dataset['reducedMotion'] = 'true';
    else delete document.documentElement.dataset['reducedMotion'];
  };
  apply();
  useSettingsStore.subscribe(apply);
}

/**
 * Keeps the progress layer's tourist flag in step with the setting, and lets a
 * `?tourist=1` link turn the mode on. The link writes the setting like any
 * other switch, so the mode stays visible in Settings and the learner can turn
 * it off there.
 */
export function initTouristMode(): void {
  const store = useSettingsStore.getState();
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('tourist');
  if (fromUrl !== null && fromUrl !== '0') store.setTourist(true);
  setTouristMode(useSettingsStore.getState().tourist);
  useSettingsStore.subscribe((state) => setTouristMode(state.tourist));
}
