/**
 * Build the whole game into one file you can double-click.
 *
 * The artifact build ships a page plus hashed assets, which needs a server (or
 * the artifact platform) to hold them together. This config instead emits a
 * single classic script and a single stylesheet, which `scripts/build-standalone.mjs`
 * folds into `dist-standalone/last-call.html` — openable straight from disk at
 * `file://`, no install and no local server. Classic `iife` output matters:
 * browsers refuse to load ES modules from a `file://` origin.
 */
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist-standalone',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'bundle.js',
        assetFileNames: 'bundle.[ext]',
      },
    },
  },
});
