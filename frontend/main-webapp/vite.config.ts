import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootEnvDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  envDir: rootEnvDir,
  base: mode === 'production' ? '/_app/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', 
        changeOrigin: true,
        secure: false,
      },
      
      // Configuration for WebSocket
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      }
    }
  }
}))
