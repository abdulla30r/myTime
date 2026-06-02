import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/rams-api': {
        target: 'https://rumytechnologies.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rams-api/, '/rams'),
        secure: true,
      },
      '/td-api-v11': {
        target: 'https://api2.timedoctor.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/td-api-v11/, '/api/1.1'),
        secure: true,
      },
      '/td-api': {
        target: 'https://api2.timedoctor.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/td-api/, '/api/1.0'),
        secure: true,
      },
      // ── World Cup 2026: football-data.org (token from FD_TOKEN env, else client header) ──
      '/football-api': {
        target: 'https://api.football-data.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/football-api/, '/v4'),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const t = process.env.FD_TOKEN;
            if (t) proxyReq.setHeader('X-Auth-Token', t);
          });
        },
      },
      // ── World Cup 2026: API-Football (key from APIFOOTBALL_KEY env, else client header) ──
      '/apifootball-api': {
        target: 'https://v3.football.api-sports.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apifootball-api/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const k = process.env.APIFOOTBALL_KEY;
            if (k) proxyReq.setHeader('x-apisports-key', k);
          });
        },
      },
    },
  },
})
