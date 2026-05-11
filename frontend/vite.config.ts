import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const BACKEND_TARGET = process.env.VITE_BACKEND_URL ?? 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': { target: BACKEND_TARGET, changeOrigin: true },
      '/d': { target: BACKEND_TARGET, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
})
