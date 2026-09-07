import { unlockAudio } from '@/audio/clock';
import { Button } from './Button';
import { useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { getSamplerStatus, subscribeSampler, ensureSamplerLoaded } from '@/audio/sampler';
import { useMidiStore } from '@/store/midiStore';
import { useSettingsStore } from '@/store/settingsStore';
import styles from './PlayerNotices.module.css';

/**
 * The two things that silently break a practice screen (05 §Empty/edge states):
 * no keyboard connected, and the piano samples still downloading. Both are
 * shown in every player, because "I pressed a key and nothing happened" is the
 * worst possible first impression.
 */
export function PlayerNotices() {
  const tourist = useSettingsStore((s) => s.tourist);
  const midiStatus = useMidiStore((s) => s.status);
  const computerBase = useMidiStore((s) => s.computerBase);
  const sampler = useSyncExternalStore(subscribeSampler, getSamplerStatus, getSamplerStatus);

  const noDevice = midiStatus === 'no-device' || midiStatus === 'unsupported' || midiStatus === 'denied';

  return (
    <>
      {tourist && (
        <div
          className={`${styles['notice']} ${styles['tourist']}`}
          role="status"
          data-testid="tourist-notice"
        >
          <span>Tourist mode is on. Play as much as you like. Nothing here is recorded.</span>
          <Link to="/settings" className={styles['link']}>
            Turn off
          </Link>
        </div>
      )}
      {noDevice && (
        <div className={`${styles['notice']} ${styles['inputMode']}`} role="status">
          <span>
            Computer keyboard active: <kbd>A</kbd> to <kbd>K</kbd> for white notes, <kbd>W</kbd>/<kbd>E</kbd>/
            <kbd>T</kbd>/<kbd>Y</kbd>/<kbd>U</kbd> for black. Z/X shift octaves. A starts at C
            {Math.floor(computerBase / 12) - 1}.
          </span>
          <Link to="/setup" className={styles['link']}>
            Set up
          </Link>
        </div>
      )}
      {sampler.state === 'loading' && (
        <div className={styles['pill']} role="status">
          <span className={styles['spinner']} aria-hidden />
          Loading piano sounds… {Math.round(sampler.progress * 100)}%
        </div>
      )}
      {sampler.state === 'error' && (
        <div className={styles['notice']} role="status">
          <span>
            The piano sounds did not load. You can use your keyboard's own sound for note practice. Listening
            tasks need the app sound.
          </span>
          <Button onClick={() => void unlockAudio().then(ensureSamplerLoaded)}>Retry audio</Button>
        </div>
      )}
    </>
  );
}

/** True while the app cannot make sound yet — transports disable on this. */
export function useSamplerLoading(): boolean {
  const sampler = useSyncExternalStore(subscribeSampler, getSamplerStatus, getSamplerStatus);
  return sampler.state === 'loading';
}
