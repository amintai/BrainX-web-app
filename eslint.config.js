import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  vi: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
};

export default [
  {
    ignores: ['**/dist/**', '**/coverage/**', 'supabase/.temp/**', '**/node_modules/**'],
  },
  js.configs.recommended,
  // Browser/JSX workspaces
  {
    files: ['apps/web/**/*.{js,jsx}', 'packages/ui/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // Node workspaces
  {
    files: ['apps/api/**/*.js', 'packages/shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Express error-handling middleware must keep arity 4 (err, req, res, next)
      // even when a trailing parameter like `next` is unused.
      'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^_' }],
    },
  },
  // Vitest-aware test files
  {
    files: ['**/*.test.{js,jsx}', '**/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: vitestGlobals,
    },
  },
  prettierConfig,
];
