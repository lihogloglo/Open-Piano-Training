import { createBrowserRouter, Navigate, useLocation } from 'react-router';
import { AppShell } from './AppShell';
import { useSettingsStore } from '@/store/settingsStore';
import { WelcomeScreen } from '@/features/welcome/WelcomeScreen';
import { SetupScreen } from '@/features/setup/SetupScreen';
import { TodayScreen } from '@/features/practice/TodayScreen';
import { PathScreen } from '@/features/path/PathScreen';
import { SongsScreen } from '@/features/songs/SongsScreen';
import { SandboxScreen } from '@/features/sandbox/SandboxScreen';
import { ProgressScreen } from '@/features/progress/ProgressScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { Placeholder } from '@/features/shared/Placeholder';
import { LabScreen } from '@/features/lab/LabScreen';
import { LessonPlayer } from '@/features/lesson/LessonPlayer';
import { DrillPlayer } from '@/features/drill/DrillPlayer';

function RootRedirect() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  // Preserve the query string (?midi=fake selects the test adapter).
  const { search } = useLocation();
  return <Navigate to={{ pathname: onboarded ? '/practice' : '/welcome', search }} replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/welcome', element: <WelcomeScreen /> },
  // Focus-mode routes render without the sidebar shell.
  {
    path: '/lesson/:unitId',
    element: <LessonPlayer />,
  },
  {
    path: '/drill/:sessionId/:blockIdx',
    element: <DrillPlayer />,
  },
  {
    path: '/rating/:strand',
    element: <Placeholder title="Rating challenge" note="Arrives in Phase 7." />,
  },
  {
    path: '/songs/:songId',
    element: <Placeholder title="Song player" note="Arrives in Phase 5." />,
  },
  {
    element: <AppShell />,
    children: [
      { path: '/setup', element: <SetupScreen /> },
      { path: '/lab', element: <LabScreen /> },
      { path: '/practice', element: <TodayScreen /> },
      { path: '/path', element: <PathScreen /> },
      { path: '/songs', element: <SongsScreen /> },
      { path: '/sandbox', element: <SandboxScreen /> },
      { path: '/progress', element: <ProgressScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
