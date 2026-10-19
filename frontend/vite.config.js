import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [
      'cubistic-faceless-danika.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.app',
      '.ngrok-free.app',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
              if (res.writeHead && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Backend server is starting up...', status: 'starting' }));
              }
              return;
            }
            console.error('[vite-proxy-error]', err);
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
        }
      }
    }
  }
})
