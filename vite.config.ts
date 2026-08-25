import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    proxy: {
      // No key/login: local dev proxy for MLB StatsAPI.
      '/mlb-api': {
        target: 'https://statsapi.mlb.com',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/mlb-api/, '/api'),
      },
    },
  },
  preview: {
    port: 4173,
  },
})
