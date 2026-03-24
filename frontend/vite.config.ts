import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // En dev, toujours proxifier vers localhost:8080 quel que soit VITE_API_URL
  const backendTarget = 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      extensions: ['.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/auth':       { target: backendTarget, changeOrigin: true },
        '/dossiers':   { target: backendTarget, changeOrigin: true },
        '/users':      { target: backendTarget, changeOrigin: true },
        '/antennes':   { target: backendTarget, changeOrigin: true },
        '/categories': { target: backendTarget, changeOrigin: true },
        '/etapes':     { target: backendTarget, changeOrigin: true },
        '/documents':  { target: backendTarget, changeOrigin: true },
        '/files':      { target: backendTarget, changeOrigin: true },
      },
    },
  };
});
