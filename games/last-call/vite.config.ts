import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// @ts-expect-error -- plain JS server module, typed by its own JSDoc
import { dialoguePlugin } from './server/dialogueMiddleware.mjs';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), dialoguePlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, host: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
