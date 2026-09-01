/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  optimizeDeps: {
    // Pre-bundle lazily-imported deps; otherwise vite discovers them mid-session
    // and force-reloads every connected page (breaks dev flow and e2e runs).
    include: ['react', 'react-dom/client', 'react-router', 'zustand', 'webmidi', 'smplr'],
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
