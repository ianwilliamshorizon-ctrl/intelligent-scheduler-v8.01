
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    terserOptions: {
      compress: {
        // Keep console logs in the production build
        drop_console: false,
      },
    },
  },
  // By removing the `define` property, we allow Vite to handle 
  // environment variables in the standard, secure way. Vite will:
  // 1. Load `.env.production` during `build` and `.env.development` during `dev`.
  // 2. Expose only the variables prefixed with `VITE_` to the client.
})
