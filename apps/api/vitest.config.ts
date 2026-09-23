import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/__tests__/**', 'src/server.ts', 'dist/**'],
      thresholds: { lines: 60, functions: 60 },
    },
  },
});
