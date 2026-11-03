import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Permite compartir el dev server por túnel (cloudflared / ngrok)
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'],
    // En dev, /api → backend en :3000 (sin CORS)
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
