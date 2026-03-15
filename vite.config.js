import { defineConfig } from 'vite'

export default defineConfig({
  base: '/graphdata_V2/',
  optimizeDeps: {
    include: ['3d-force-graph']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})