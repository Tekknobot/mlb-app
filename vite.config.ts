import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    proxy: {
      // ✅ DEV: /api → https://api.balldontlie.io/mlb/v1/...
      '/api': {
        target: 'https://api.balldontlie.io',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, '/mlb/v1'),
      },
    },
  },
  preview: {
    port: 4173,
  },
})
