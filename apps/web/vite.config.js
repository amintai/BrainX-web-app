import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(import.meta.dirname, '../..');
  // Load ALL root env vars (not just VITE_-prefixed) so we can compare the
  // public VITE_SUPABASE_URL against the backend's SUPABASE_URL below.
  const env = loadEnv(mode, envDir, '');

  if (env.VITE_SUPABASE_URL && env.SUPABASE_URL && env.VITE_SUPABASE_URL !== env.SUPABASE_URL) {
    throw new Error(
      `Config error: VITE_SUPABASE_URL ("${env.VITE_SUPABASE_URL}") does not match ` +
        `SUPABASE_URL ("${env.SUPABASE_URL}"). The frontend and backend must point at the same ` +
        'Supabase project, or every access token will be rejected with a confusing 401 later. ' +
        'Fix .env / .env.local at the repo root.',
    );
  }

  return {
    envDir,
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      env: {
        VITE_API_URL: 'http://localhost:3000',
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    },
  };
});
