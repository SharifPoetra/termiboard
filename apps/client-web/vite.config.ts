import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              test: /node_modules\/(react|react-dom|react-router-dom)/,
              name: 'react-vendor',
            },
            {
              test: /node_modules\/@dnd-kit/,
              name: 'dnd-kit',
            },
            {
              test: /node_modules\/lucide-react/,
              name: 'lucide',
            },
          ],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    forwardConsole: {
      unhandledErrors: true,
      logLevels: ['log', 'warn', 'error'],
    },
  },
});
