import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the site from https://<user>.github.io/web-br/
  base: '/web-br/',
  build: {
    rolldownOptions: {
      output: {
        // Keep three.js in its own chunk so it stays cached between game updates.
        codeSplitting: {
          groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }],
        },
      },
    },
    chunkSizeWarningLimit: 650,
  },
});
