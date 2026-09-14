import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { offlineApp } from './pwa-plugin.js'
import process from 'node:process'

export default defineConfig({
  base: process.env.PAGES_BASE_PATH || '/',
  plugins: [react(), offlineApp()],
  build: { target: 'safari16' },
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:8000', rewrite: path => path.replace(/^\/api/, '') } },
  },
})

