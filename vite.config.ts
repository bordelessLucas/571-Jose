import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/focus/emit': {
        target:
          process.env.VITE_FOCUS_NFE_FUNCTION_ORIGIN ??
          'http://127.0.0.1:5001/jose-7db7c/southamerica-east1',
        changeOrigin: true,
        rewrite: () => '/focusFiscal',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
})
