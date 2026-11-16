import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const { PORT = '3001' } = loadEnv(mode, process.cwd(), '');
  const apiPort = Number(PORT);

  return {
    plugins: [react()],
    server: { proxy: { '/api': `http://localhost:${apiPort}` } }
  };
});
