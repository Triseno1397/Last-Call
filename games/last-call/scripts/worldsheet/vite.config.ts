import { defineConfig } from 'vite';
export default defineConfig({
  root: '/home/user/Triseno-Systems-Website/games/last-call',
  resolve: { alias: { '@': '/home/user/Triseno-Systems-Website/games/last-call/src' } },
  logLevel: 'error',
  build: {
    outDir: '/tmp/claude-0/-home-user-Triseno-Systems-Website/3a937497-633d-54c8-bdc7-ab267f3b7d32/scratchpad/worldsheet',
    emptyOutDir: true,
    rollupOptions: {
      input: '/home/user/Triseno-Systems-Website/games/last-call/scripts/worldsheet/entry.ts',
      output: { format: 'iife', entryFileNames: 'worldsheet.js', inlineDynamicImports: true },
    },
  },
});
