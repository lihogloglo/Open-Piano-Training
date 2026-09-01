import { useNavigate } from 'react-router';
import { APP_NAME, APP_TAGLINE } from '@/app/brand';
import { Button } from '@/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import styles from './WelcomeScreen.module.css';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);

  return (
    <div className={styles['wrap']}>
      <div className={styles['inner']}>
        <h1>{APP_NAME}</h1>
        <p className={styles['tagline']}>{APP_TAGLINE}</p>
        <Button
          variant="primary"
          size="l"
          onClick={() => {
            // Full onboarding wizard arrives in Phase 1; for now, straight in.
            setOnboarded(true);
            void navigate('/practice');
          }}
        >
          Get started
        </Button>
      </div>
    </div>
  );
}
