import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@context': resolve(__dirname, 'src/context')
    }
  },
  
  server: {
    port: 5173,        // Changed from 3000 to 5173
    strictPort: true,
    // Remove proxy or keep for /api routes if you add them later
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild'
  }
});
