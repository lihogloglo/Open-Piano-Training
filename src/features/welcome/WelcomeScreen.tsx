import { useState } from 'react';
import { useNavigate } from 'react-router';
import { APP_NAME, APP_TAGLINE } from '@/app/brand';
import { Button } from '@/ui/Button';
import { Keyboard } from '@/ui/Keyboard';
import { useSettingsStore } from '@/store/settingsStore';
import { useMidiStore } from '@/store/midiStore';
import { MidiSetupPanel } from '@/features/setup/MidiSetupPanel';
import { SoundPanel } from '@/features/setup/SoundPanel';
import styles from './WelcomeScreen.module.css';

const STEPS = 4;

export function WelcomeScreen() {
  const navigate = useNavigate();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const midiStatus = useMidiStore((s) => s.status);
  const [step, setStep] = useState(0);

  const finish = () => {
    setOnboarded(true);
    void navigate('/practice');
  };

  return (
    <div className={styles['wrap']}>
      <div className={styles['inner']}>
        {step === 0 && (
          <>
            <h1>{APP_NAME}</h1>
            <p className={styles['tagline']}>{APP_TAGLINE}</p>
            <p className={styles['body']}>
              A guided path from zero to fluency: scales, chords and harmony you can actually use, on your own
              MIDI piano, with feedback on every note.
            </p>
            {/* The instrument is the hero image. One chord lit, nothing else,
                so the first thing you see is a C major triad. */}
            <div className={styles['demo']} aria-hidden>
              <Keyboard range={[55, 79]} pressed={new Set([60, 64, 67])} height={96} />
            </div>
            <Button variant="primary" size="l" onClick={() => setStep(1)}>
              Get started
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Connect your keyboard</h2>
            <div className={styles['panelBox']}>
              <MidiSetupPanel />
            </div>
            <div className={styles['actions']}>
              {midiStatus === 'connected' ? (
                <Button variant="primary" size="l" onClick={() => setStep(2)}>
                  Continue
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setStep(2)}>
                  I'll use computer keys for now
                </Button>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Hear yourself</h2>
            <p className={styles['body']}>
              If your piano has speakers, use those, it always sounds best. Otherwise we'll play a warm grand
              piano for every note you press.
            </p>
            <div className={styles['panelBox']}>
              <SoundPanel />
            </div>
            <div className={styles['actions']}>
              <Button variant="primary" size="l" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Where do we begin?</h2>
            <p className={styles['body']}>
              The path starts at the very beginning, finding your way around the keys. Every step earns the
              next one. Already play a little? Take the checkpoints instead: pass one, skip its stage.
            </p>
            <div className={styles['actions']}>
              <Button variant="primary" size="l" onClick={finish}>
                Start from zero
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setOnboarded(true);
                  void navigate('/lesson/s0.cp?placement=1');
                }}
              >
                I know some piano, place me
              </Button>
            </div>
          </>
        )}

        <div className={styles['dots']} aria-label={`Step ${step + 1} of ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={styles['dot']} data-active={i === step} />
          ))}
        </div>
      </div>
    </div>
  );
}
