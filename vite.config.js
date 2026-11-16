import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In local development the React app (5173) proxies /api to the Express dev server (3001).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
