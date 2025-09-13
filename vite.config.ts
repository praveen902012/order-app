import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['better-sqlite3']
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
