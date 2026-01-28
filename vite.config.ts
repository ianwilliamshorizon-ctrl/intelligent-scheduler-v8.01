import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Fixes the 404 by ensuring relative paths
  server: {
    port: 9001,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: ['all'],
    cors: true,
    hmr: {
      protocol: 'wss', // Force Secure Web Sockets for the proxy
      clientPort: 443,
    },
    headers: {
      "Content-Security-Policy": "frame-ancestors 'self' https://*.cloudworkstations.dev https://*.idx.google.com;",
    },
  }
});