import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnvDir = resolve(__dirname, '..', '..')

// https://vite.dev/config/
export default defineConfig({
  envDir: rootEnvDir,
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

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
  },
  define: {
    global: 'window',
  },
})