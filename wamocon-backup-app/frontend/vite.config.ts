import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    // Dev proxy: forwards /api calls to local backend
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
