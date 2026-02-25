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
      '/td-api': {
        target: 'https://api2.timedoctor.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/td-api/, '/api/1.0'),
        secure: true,
      },
    },
  },
})
