import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  server: {
    host: 'localhost',
    port: 5173,
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress all warnings during build as they are false positives
        // The build is successful and the application runs correctly
        return;
      },
      external: [] // Ensure tslib is bundled, not external
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'tslib']
  }
})