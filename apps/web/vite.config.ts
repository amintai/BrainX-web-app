import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@routes': path.resolve(__dirname, 'src/routes'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@layouts': path.resolve(__dirname, 'src/layouts'),
      '@brainx/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
