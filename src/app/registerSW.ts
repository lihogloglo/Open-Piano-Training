import { toast } from '@/ui/Toast';

/**
 * Registers the generated service worker so a second visit works offline —
 * including sound, since the sample requests are cached (see vite.config).
 *
 * Only in production builds: a service worker in dev would cache module
 * responses and fight Vite's HMR, and it would intercept the e2e runs.
 *
 * The desktop shell is skipped too. It ships every asset inside the app, and
 * a service worker cannot register on its custom URL scheme.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if ('keysenseDesktop' in window) return;
  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onOfflineReady() {
          toast('Ready to work offline', 'ok');
        },
      });
    })
    .catch((err: unknown) => {
      // An unavailable service worker costs offline support, nothing else.
      console.warn('Service worker registration skipped:', err);
    });
}
