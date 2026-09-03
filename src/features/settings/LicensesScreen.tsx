import { useNavigate } from 'react-router';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { APP_NAME } from '@/app/brand';
import styles from './SettingsScreen.module.css';

interface Credit {
  name: string;
  version: string;
  license: string;
  url: string;
  what: string;
}

/**
 * Attribution page (05 §Settings). Required by the terms of the font and
 * sample sets, and simply the right thing to do for the rest.
 */
const CREDITS: readonly Credit[] = [
  {
    name: 'React',
    version: '19.2',
    license: 'MIT',
    url: 'https://react.dev/',
    what: 'The interface layer.',
  },
  {
    name: 'React Router',
    version: '8.3',
    license: 'MIT',
    url: 'https://reactrouter.com/',
    what: 'Screen routing.',
  },
  {
    name: 'Zustand',
    version: '5.0',
    license: 'MIT',
    url: 'https://github.com/pmndrs/zustand',
    what: 'MIDI and exercise-run state.',
  },
  {
    name: 'Tonal',
    version: '6.4',
    license: 'MIT',
    url: 'https://github.com/tonaljs/tonal',
    what: 'Scale, chord and interval theory.',
  },
  {
    name: 'smplr',
    version: '1.0',
    license: 'MIT',
    url: 'https://github.com/danigb/smplr',
    what: 'Sampled piano playback.',
  },
  {
    name: 'WEBMIDI.js',
    version: '3.1',
    license: 'Apache-2.0',
    url: 'https://webmidijs.org',
    what: 'Talking to your keyboard.',
  },
  {
    name: 'Dexie.js',
    version: '4.4',
    license: 'Apache-2.0',
    url: 'https://dexie.org',
    what: 'On-device progress storage.',
  },
  {
    name: 'ts-fsrs',
    version: '5.4',
    license: 'MIT',
    url: 'https://github.com/open-spaced-repetition/ts-fsrs',
    what: 'The spaced-repetition scheduler behind your reviews.',
  },
  {
    name: 'Zod',
    version: '4.5',
    license: 'MIT',
    url: 'https://zod.dev',
    what: 'Curriculum and exercise validation.',
  },
  {
    name: 'Geist',
    version: '1.5',
    license: 'SIL Open Font License 1.1',
    url: 'https://fontsource.org/fonts/geist',
    what: 'The typeface, by Vercel.',
  },
  {
    name: 'Geist Mono',
    version: '1.5',
    license: 'SIL Open Font License 1.1',
    url: 'https://fontsource.org/fonts/geist-mono',
    what: 'The monospace face, for tempos, counts and roman numerals.',
  },
  {
    name: 'Phosphor Icons',
    version: '2.1',
    license: 'MIT',
    url: 'https://phosphoricons.com',
    what: 'Every icon in the interface.',
  },
  {
    name: 'Splendid Grand Piano',
    version: '',
    license: 'CC-BY 3.0',
    url: 'https://github.com/sfzinstruments/SplendidGrandPiano',
    what: 'The piano samples you hear, via smplr.',
  },
];

export function LicensesScreen() {
  const navigate = useNavigate();
  return (
    <div className={styles['wrap']}>
      <h1>Licenses &amp; credits</h1>
      <p className={styles['note']}>
        {APP_NAME} is built on open source. These are the projects it depends on, and the terms they are
        offered under.
      </p>
      <Card>
        <ul className={styles['creditList']}>
          {CREDITS.map((c) => (
            <li key={c.name} className={styles['credit']}>
              <div>
                <a href={c.url} target="_blank" rel="noreferrer noopener">
                  {c.name}
                </a>{' '}
                <span className={styles['note']}>{c.version}</span>
                <p className={styles['note']}>{c.what}</p>
              </div>
              <span className={styles['licenseTag']}>{c.license}</span>
            </li>
          ))}
        </ul>
      </Card>
      <p className={styles['note']}>
        Songs in {APP_NAME} are original charts written for this app. Style references name genres and eras,
        never a specific artist&apos;s recording.
      </p>
      <Button onClick={() => void navigate('/settings')}>Back to settings</Button>
    </div>
  );
}
