/// <reference types="vitest/config" />
import { defineConfig, type Plugin, type Connect } from 'vite';
import { createReadStream } from 'node:fs';
import { join, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

/** Serve encoded sharp-note filenames before Vite treats # as a URL fragment. */
function pianoSamples(): Plugin {
  const serve =
    (directory: string): Connect.NextHandleFunction =>
    (req, res, next) => {
      let pathname: string;
      try {
        pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
      } catch {
        next();
        return;
      }
      const match = /^\/samples\/splendid-grand-piano\/([A-Za-z]{2} [A-G]#?-?\d+\.ogg)$/.exec(pathname);
      if (!match) {
        next();
        return;
      }
      const file = join(directory, 'samples', 'splendid-grand-piano', match[1]!);
      res.setHeader('Content-Type', 'audio/ogg');
      createReadStream(file)
        .on('error', () => {
          res.statusCode = 404;
          res.end();
        })
        .pipe(res);
    };
  return {
    name: 'piano-samples',
    configureServer(server) {
      server.middlewares.use(serve(server.config.publicDir));
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve(resolve(server.config.root, server.config.build.outDir)));
    },
  };
}

export default defineConfig({
  plugins: [
    pianoSamples(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Keysense',
        short_name: 'Keysense',
        description: 'Understand the keyboard. Play anything.',
        theme_color: '#0b0d0e',
        background_color: '#0b0d0e',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        categories: ['education', 'music'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Piano samples are large and immutable: cache-first, kept for a year
        // so a second visit has sound with no network at all.
        runtimeCaching: [
          {
            // Matches the vendored copy under /samples/ and smplr's own host
            // alike, so either source survives an offline reload.
            urlPattern: /\/(samples|soundfonts)\/.*\.(mp3|ogg|wav|m4a)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'keysense-samples',
              expiration: { maxEntries: 512, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  optimizeDeps: {
    // Pre-bundle lazily-imported deps; otherwise vite discovers them mid-session
    // and force-reloads every connected page (breaks dev flow and e2e runs).
    include: ['react', 'react-dom/client', 'react-router', 'zustand', 'webmidi', 'smplr'],
  },
  build: {
    // VexFlow is ~1.1 MB and deliberately lazy (notation strand only), so the
    // default 500 kB warning fires on a chunk that is working as intended.
    // `npm run check:bundle` is the real guard: it enforces the eager-bundle
    // budget from 08-build-order and fails the build if vexflow stops being
    // its own chunk.
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        // Keep the music-theory layer out of the boot path's critical chunk:
        // tonal is only needed once an exercise is generated.
        codeSplitting: {
          groups: [
            { name: 'theory', test: /node_modules[\\/]@?tonal/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'db', test: /node_modules[\\/](dexie|ts-fsrs)/ },
          ],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/theory/**', 'src/engine/**', 'src/progress/**'],
    },
  },
});
