import { defineConfig } from 'vite'

export default defineConfig({
  base: '/graphdata/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})