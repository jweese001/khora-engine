import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'

const repoBase = '/khora-engine/'

// https://vite.dev/config/
export default defineConfig({
  base: repoBase,
  plugins: [
    react(),
    glsl()
  ],
  server: {
    host: '0.0.0.0', // Expose to Docker
    port: 5173,
    allowedHosts: ['host.docker.internal']
  }
})
