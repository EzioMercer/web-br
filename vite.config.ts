import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/**
 * Emits the service worker (src/offline/sw.js) with the list of this build's files, so the game is kept in the
 * browser's cache on the first visit and starts offline after that.
 */
const offline = (): Plugin => ({
  name: 'offline',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter(f => !f.endsWith('.map')).sort();
    const src = readFileSync('src/offline/sw.js', 'utf8');
    const hash = createHash('sha256').update(src);

    // a new version whenever any file changes, so browsers fetch the new service worker and the new files
    for (const f of files) {
      const o = bundle[f];

      hash.update(f).update(o.type === 'chunk' ? o.code : o.source);
    }

    const version = hash.digest('hex').slice(0, 12);
    const manifest = '{ version: \'dev\', files: [] }';

    if (!src.includes(manifest)) {
      this.error('src/offline/sw.js: MANIFEST placeholder not found');
    }

    this.emitFile({
      type: 'asset',
      fileName: 'sw.js',
      source: src.replace(manifest, JSON.stringify({ version, files })),
    });
  },
});

export default defineConfig({
  // GitHub Pages serves the site from https://<user>.github.io/web-br/
  base: '/web-br/',
  plugins: [offline()],
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
