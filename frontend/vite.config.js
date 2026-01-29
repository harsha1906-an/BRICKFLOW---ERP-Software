import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ['deedra-unsocializable-atomistically.ngrok-free.dev', 'all'],
    host: true,
    port: 5173,
    strictPort: true,
  },
})
