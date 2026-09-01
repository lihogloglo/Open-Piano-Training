import { Card } from '@/ui/Card';
import { MidiSetupPanel } from './MidiSetupPanel';
import { SoundPanel } from './SoundPanel';
import styles from './SetupScreen.module.css';

export function SetupScreen() {
  return (
    <div className={styles['wrap']}>
      <h1>Setup</h1>
      <Card>
        <h3>Your keyboard</h3>
        <div className={styles['section']}>
          <MidiSetupPanel />
        </div>
      </Card>
      <Card>
        <h3>Sound</h3>
        <div className={styles['section']}>
          <SoundPanel />
        </div>
      </Card>
    </div>
  );
}
