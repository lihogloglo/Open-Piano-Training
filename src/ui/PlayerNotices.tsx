import { useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { getSamplerStatus, subscribeSampler } from '@/audio/sampler';
import { useMidiStore } from '@/store/midiStore';
import styles from './PlayerNotices.module.css';

/**
 * The two things that silently break a practice screen (05 §Empty/edge states):
 * no keyboard connected, and the piano samples still downloading. Both are
 * shown in every player, because "I pressed a key and nothing happened" is the
 * worst possible first impression.
 */
export function PlayerNotices() {
  const midiStatus = useMidiStore((s) => s.status);
  const sampler = useSyncExternalStore(subscribeSampler, getSamplerStatus, getSamplerStatus);

  const noDevice = midiStatus === 'no-device' || midiStatus === 'unsupported' || midiStatus === 'denied';

  return (
    <>
      {noDevice && (
        <div className={styles['notice']} role="status">
          <span>
            {midiStatus === 'denied'
              ? 'MIDI access is blocked in this browser.'
              : midiStatus === 'unsupported'
                ? "This browser can't talk to MIDI keyboards."
                : 'No keyboard connected.'}{' '}
            You can play with your computer keys: <kbd>A</kbd> to <kbd>K</kbd> for white notes, <kbd>W</kbd>/
            <kbd>E</kbd>/<kbd>T</kbd>/<kbd>Y</kbd>/<kbd>U</kbd> for black.
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
            The piano samples didn&apos;t load. Everything still works, you just won&apos;t hear the app play
            along. Check your connection and reload.
          </span>
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
