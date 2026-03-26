import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // source maps для Sentry (стек в Issues); в бандле ссылка на .map не вставляется
    sourcemap: 'hidden',
  },
})
