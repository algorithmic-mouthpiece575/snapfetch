import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development, proxy `/api` calls to the Express backend to avoid CORS
    // issues and keep relative URLs on the client. Adjust the port if the
    // backend does not listen on 3001.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
