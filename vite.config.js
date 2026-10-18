import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps every asset reference relative so the site can be
// hosted from a sub-path (e.g. /portfolio/) without rewrites.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2019',
    assetsInlineLimit: 2048,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep webfonts under dist/fonts/ with their original (predictable)
        // names so index.html can preload them at runtime under any base.
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.woff2')
            ? 'fonts/[name][extname]'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
