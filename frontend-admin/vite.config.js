import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3001, proxy: { '/api': 'http://localhost:5001' } },
  // Only add base if your site is not at the domain root
  // base: '/',
})