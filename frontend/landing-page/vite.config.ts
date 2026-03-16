import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootEnvDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// https://vite.dev/config/
export default defineConfig({
  envDir: rootEnvDir,
  plugins: [react()],
  server: {
    port: 3001,
  }
})
