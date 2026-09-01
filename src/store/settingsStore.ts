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
  setTheme(theme: ThemeSetting): void;
  setOnboarded(v: boolean): void;
  setDeviceId(id: string | null): void;
  setAudioEnabled(v: boolean): void;
  setSidebarExpanded(v: boolean): void;
  setLatencyOffsetMs(ms: number): void;
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
};

function load(): PersistedSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<PersistedSettings>) };
  } catch {
    return defaults;
  }
}

function persist(state: SettingsState): void {
  const { theme, onboarded, deviceId, audioEnabled, masterVolume, metronomeVolume } = state;
  const { dailyMinutes, latencyOffsetMs, sidebarExpanded } = state;
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
