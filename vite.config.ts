/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

/** Publish only app assets, even if an old local sample folder still exists. */
function releaseAssets(): Plugin {
  return {
    name: 'release-assets',
    generateBundle() {
      for (const fileName of [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192.png',
        'pwa-512.png',
        'pwa-maskable-512.png',
        'THIRD-PARTY-NOTICES.html',
      ]) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(join('public', fileName)) });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    releaseAssets(),
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
            // Cache samples fetched directly from the provider.
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
    copyPublicDir: false,
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
