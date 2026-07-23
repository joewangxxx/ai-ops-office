import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { officeApiPlugin } from './src/backend/viteOfficeApi';

const appDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), officeApiPlugin()],
  publicDir: resolve(appDirectory, '../../images'),
  server: {
    fs: {
      allow: [resolve(appDirectory, '../..')],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
