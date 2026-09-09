import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'release', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, parserOptions: { tsconfigRootDir: import.meta.dirname } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    // Dependency direction: pure layers must not import browser-coupled or upward layers.
    files: ['src/theory/**', 'src/engine/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react-router'], message: 'Pure layer: no React.' },
            {
              group: ['@/store/*', '@/features/*', '@/ui/*', '@/app/*'],
              message: 'No upward imports from pure layers.',
            },
            { group: ['@/midi/*', '@/audio/*'], message: 'theory/engine must stay browser-free.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/progress/**'],
    ignores: ['src/progress/db.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react-router'], message: 'Pure layer: no React.' },
            {
              group: ['@/store/*', '@/features/*', '@/ui/*', '@/app/*'],
              message: 'No upward imports from pure layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['@/features/*', '@/app/*'], message: 'ui/ must not import features or app.' }],
        },
      ],
    },
  },
);
