import { useEffect } from 'react';
import { useMidiStore } from '@/store/midiStore';
import { Keyboard } from '@/ui/Keyboard';
import { playNote, stopNote } from '@/audio/sampler';
import styles from './panels.module.css';

const isFirefox = navigator.userAgent.includes('Firefox');

export function MidiSetupPanel() {
  const status = useMidiStore((s) => s.status);
  const devices = useMidiStore((s) => s.devices);
  const selectedId = useMidiStore((s) => s.selectedId);
  const select = useMidiStore((s) => s.select);
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const lastEventAt = useMidiStore((s) => s.lastEventAt);
  const init = useMidiStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  const heard = lastEventAt !== null;

  return (
    <div className={styles['panel']}>
      {status === 'unsupported' && (
        <div className={styles['notice']} data-tone="err">
          <strong>This browser can't talk to MIDI keyboards.</strong>
          <p>
            Safari and iOS don't support Web MIDI. Use <strong>Chrome</strong>, <strong>Edge</strong> or{' '}
            <strong>Firefox</strong> on a desktop. You can still explore with your computer keys below.
          </p>
        </div>
      )}
      {status === 'denied' && (
        <div className={styles['notice']} data-tone="warn">
          <strong>MIDI access was declined.</strong>
          <p>Allow MIDI access for this site in your browser's permission settings, then reload.</p>
        </div>
      )}
      {isFirefox && status !== 'unsupported' && (
        <p className={styles['hint']}>
          Firefox asks you to approve a small site permission add-on the first time. That's normal.
        </p>
      )}

      {(status === 'connected' || status === 'no-device') && (
        <div className={styles['devices']}>
          {devices.length === 0 ? (
            <p className={styles['hint']}>
              No keyboard detected yet. Plug it in and switch it on, and it'll appear here by itself.
            </p>
          ) : (
            <div role="radiogroup" aria-label="MIDI device" className={styles['deviceList']}>
              <label className={styles['device']}>
                <input
                  type="radio"
                  name="midi-device"
                  checked={selectedId === null}
                  onChange={() => select(null)}
                />
                All devices
              </label>
              {devices.map((d) => (
                <label key={d.id} className={styles['device']}>
                  <input
                    type="radio"
                    name="midi-device"
                    checked={selectedId === d.id}
                    onChange={() => select(d.id)}
                  />
                  {d.name || d.manufacturer || 'MIDI device'}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles['listen']}>
        <Keyboard
          range={[48, 84]}
          pressed={activeNotes}
          height={120}
          onKeyDown={(m) => playNote(m)}
          onKeyUp={(m) => stopNote(m)}
        />
        <p className={styles['hearYou']} data-heard={heard}>
          {heard ? '✓ We hear you!' : 'Play any key. It should light up here.'}
        </p>
        <p className={styles['hint']}>
          No keyboard handy? Your computer keys work too: <kbd>A</kbd> to <kbd>K</kbd> play notes,{' '}
          <kbd>W</kbd>/<kbd>E</kbd>/<kbd>T</kbd>/<kbd>Y</kbd>/<kbd>U</kbd> the black keys, <kbd>Z</kbd>/
          <kbd>X</kbd> shift octaves.
        </p>
      </div>
    </div>
  );
}
