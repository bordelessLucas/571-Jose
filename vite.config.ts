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
      '/api/cash/closing': {
        target:
          process.env.VITE_CASH_CLOSING_FUNCTION_ORIGIN ??
          'https://southamerica-east1-jose-7db7c.cloudfunctions.net',
        changeOrigin: true,
        rewrite: () => '/cashClosing',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
})
