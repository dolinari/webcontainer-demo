import { defineConfig } from 'vite';

// base relativa: la build funziona anche in una sottocartella (es. GitHub Pages)
export default defineConfig({ base: './', build: { chunkSizeWarningLimit: 900 } });
