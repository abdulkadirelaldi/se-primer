import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Gemini anahtarı burada tanımlanmaz: tutor sunucu tarafında çalışır (server.ts).
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '.') } },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
