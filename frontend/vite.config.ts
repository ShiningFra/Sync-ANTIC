import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // Forward /auth, /dossiers, /users, etc. → Spring Boot backend
        '/auth':       { target: apiUrl, changeOrigin: true },
        '/dossiers':   { target: apiUrl, changeOrigin: true },
        '/users':      { target: apiUrl, changeOrigin: true },
        '/antennes':   { target: apiUrl, changeOrigin: true },
        '/categories': { target: apiUrl, changeOrigin: true },
        '/etapes':     { target: apiUrl, changeOrigin: true },
        '/documents':  { target: apiUrl, changeOrigin: true },
        '/files':      { target: apiUrl, changeOrigin: true },
      },
    },
  };
});
