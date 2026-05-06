import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnvDir = resolve(__dirname, '..', '..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  envDir: rootEnvDir,
  base: mode === 'production' ? '/_app/' : '/',
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
    proxy: {
      // Tenant-prefixed API routes: /{tenant}/api/...
      '^/[^/]+/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
      // Tenant-prefixed WebSocket routes: /{tenant}/ws/...
      '^/[^/]+/ws': {
        target: 'ws://localhost:80',
        ws: true,
        changeOrigin: true,
      },
      // Fallback for plain /api routes
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
      // Fallback for plain /ws routes
      '/ws': {
        target: 'ws://localhost:80',
        ws: true,
      }
    }
  },
  define: {
    global: 'window',
  }
}))
