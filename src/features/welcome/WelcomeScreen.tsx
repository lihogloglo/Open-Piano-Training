import { LanguageSelect } from '@/ui/LanguageSelect';
import { tr } from '@/i18n';
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
        <LanguageSelect />
        {step === 0 && (
          <>
            <h1>{APP_NAME}</h1>
            <p className={styles['tagline']}>{APP_TAGLINE}</p>
            <p className={styles['body']}>
              {tr(
                'A guided path from zero to fluency: scales, chords and harmony you can actually use, on your own MIDI piano, with feedback on every note.',
              )}
            </p>
            {/* The instrument is the hero image. One chord lit, nothing else,
                so the first thing you see is a C major triad. */}
            <div className={styles['demo']} aria-hidden>
              <Keyboard range={[55, 79]} pressed={new Set([60, 64, 67])} height={96} />
            </div>
            <Button variant="primary" size="l" onClick={() => setStep(1)}>
              {tr('Get started')}
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <h2>{tr('Connect your keyboard')}</h2>
            <div className={styles['panelBox']}>
              <MidiSetupPanel />
            </div>
            <div className={styles['actions']}>
              {midiStatus === 'connected' ? (
                <Button variant="primary" size="l" onClick={() => setStep(2)}>
                  {tr('Continue')}
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setStep(2)}>
                  {tr("I'll use computer keys for now")}
                </Button>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>{tr('Hear yourself')}</h2>
            <p className={styles['body']}>
              {tr(
                "If your piano has speakers, use those, it always sounds best. Otherwise we'll play a warm grand piano for every note you press.",
              )}
            </p>
            <div className={styles['panelBox']}>
              <SoundPanel />
            </div>
            <div className={styles['actions']}>
              <Button variant="primary" size="l" onClick={() => setStep(3)}>
                {tr('Continue')}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>{tr('Where do we begin?')}</h2>
            <p className={styles['body']}>
              {tr(
                'The path starts at the very beginning, finding your way around the keys. Every step earns the next one. Already play a little? Take the checkpoints instead: pass one, skip its stage.',
              )}
            </p>
            <div className={styles['actions']}>
              <Button variant="primary" size="l" onClick={finish}>
                {tr('Start from zero')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setOnboarded(true);
                  void navigate('/lesson/s0.cp?placement=1');
                }}
              >
                {tr('I know some piano, place me')}
              </Button>
            </div>
          </>
        )}

        <div className={styles['dots']} aria-label={tr('Step {v0} of {v1}', { v0: step + 1, v1: STEPS })}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={styles['dot']} data-active={i === step} />
          ))}
        </div>
      </div>
    </div>
  );
}
