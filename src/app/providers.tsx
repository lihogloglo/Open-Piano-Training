import { PracticeTime } from './PracticeTime';
import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { ToastViewport } from '@/ui/Toast';
import { Button } from '@/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { useMidiStore } from '@/store/midiStore';
import { ensureSamplerLoaded, getSamplerStatus, setMuted } from '@/audio/sampler';

/**
 * MIDI must exist on every route (lesson/drill screens render without the
 * AppShell). Onboarded users already granted access once; init silently.
 */
function MidiBoot() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  const init = useMidiStore((s) => s.init);
  useEffect(() => {
    if (onboarded) void init();
  }, [onboarded, init]);
  return null;
}

/** Keep the incoming-key echo setting in sync after setup and after reload. */
function AudioSettingsSync() {
  const audioEnabled = useSettingsStore((s) => s.audioEnabled);
  useEffect(() => {
    setMuted(!audioEnabled);
    if (audioEnabled && getSamplerStatus().state === 'idle') void ensureSamplerLoaded();
  }, [audioEnabled]);
  return null;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App crash:', error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: 'center', display: 'grid', gap: 16 }}>
            <h2>Something broke. Your progress is safe.</h2>
            <p style={{ color: 'var(--text-2)' }}>
              Everything you've done is stored on this device. Reloading usually fixes it.
            </p>
            <pre
              style={{
                textAlign: 'left',
                overflow: 'auto',
                background: 'var(--surface-2)',
                padding: 12,
                borderRadius: 10,
                fontSize: 12,
                userSelect: 'all',
              }}
            >
              {String(this.state.error.stack ?? this.state.error.message)}
            </pre>
            <div>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <PracticeTime />
      <MidiBoot />
      <AudioSettingsSync />
      {children}
      <ToastViewport />
    </ErrorBoundary>
  );
}
