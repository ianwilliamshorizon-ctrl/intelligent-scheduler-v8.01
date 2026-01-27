
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 9002,
    host: '0.0.0.0',
    hmr: {
      protocol: 'wss',
      host: '9000-firebase-intelligent-v801-1769110189607.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev',
      clientPort: 443,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      'core': path.resolve(__dirname, './core'),
    }
  },
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
