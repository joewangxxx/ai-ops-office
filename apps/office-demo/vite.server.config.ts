import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: false,
    outDir: 'dist-server',
    rollupOptions: {
      input: resolve(import.meta.dirname, 'server/main.ts'),
      output: { entryFileNames: 'main.js', format: 'es' },
    },
    ssr: true,
    target: 'node20',
  },
});
