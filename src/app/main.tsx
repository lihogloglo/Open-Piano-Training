import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@/styles/global.css';
import { router } from './router';
import { Providers } from './providers';
import { initTheme, initMotionPreference } from '@/store/settingsStore';
import { installRunTestBridge } from '@/store/runTestBridge';
import { registerServiceWorker } from './registerSW';

initTheme();
initMotionPreference();
installRunTestBridge();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
