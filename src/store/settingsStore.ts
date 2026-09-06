import { readPreferences } from '@/progress/preferences';
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
  setTheme(theme: ThemeSetting): void;
  setOnboarded(v: boolean): void;
  setDeviceId(id: string | null): void;
  setAudioEnabled(v: boolean): void;
  setSidebarExpanded(v: boolean): void;
  setLatencyOffsetMs(ms: number): void;
  setReadStrandEnabled(v: boolean): void;
  setReducedMotion(v: boolean): void;
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
