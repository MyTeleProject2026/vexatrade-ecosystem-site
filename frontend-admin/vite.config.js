import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3001, proxy: { '/api': 'http://localhost:5001' } },
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Keep the _redirects file as-is in the root of dist
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === '_redirects') return '_redirects';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
