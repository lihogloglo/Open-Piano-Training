import { useSyncExternalStore } from 'react';
import { unlockAudio } from '@/audio/clock';
import { ensureSamplerLoaded, getSamplerStatus, subscribeSampler, setMuted, playNote } from '@/audio/sampler';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/ui/Button';
import styles from './panels.module.css';

export function SoundPanel() {
  const sampler = useSyncExternalStore(subscribeSampler, getSamplerStatus);
  const audioEnabled = useSettingsStore((s) => s.audioEnabled);
  const setAudioEnabled = useSettingsStore((s) => s.setAudioEnabled);

  const enable = async () => {
    setAudioEnabled(true);
    setMuted(false);
    await unlockAudio();
    await ensureSamplerLoaded();
    playNote(60);
    setTimeout(() => playNote(64), 180);
    setTimeout(() => playNote(67), 360);
  };

  const useOwnSound = () => {
    setAudioEnabled(false);
    setMuted(true);
  };

  return (
    <div className={styles['panel']}>
      <div className={styles['soundRow']}>
        <Button variant={audioEnabled ? 'primary' : 'secondary'} onClick={() => void enable()}>
          {sampler.state === 'ready' && audioEnabled ? 'Sound is on ✓' : 'Enable sound'}
        </Button>
        <Button variant={!audioEnabled ? 'primary' : 'ghost'} onClick={useOwnSound}>
          My piano makes its own sound
        </Button>
      </div>
      {sampler.state === 'loading' && (
        <p className={styles['hint']}>Loading piano… {Math.round(sampler.progress * 100)}%</p>
      )}
      {sampler.state === 'error' && (
        <p className={styles['hint']} data-tone="err">
          The piano samples didn't load — check your connection and try again. Everything else still works.
        </p>
      )}
    </div>
  );
}
