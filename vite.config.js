import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const uiPort = Number(process.env.AGENT_BOARD_UI_PORT || 5173);
const apiPort = Number(process.env.AGENT_BOARD_API_PORT || 5174);

export default defineConfig({
  plugins: [react()],
  server: {
    port: uiPort,
    open: true,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
