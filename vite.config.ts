/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

const analyze = process.env.ANALYZE === '1' || process.env.ANALYZE === 'true';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  // Para GitHub Pages sin dominio personalizado: '/mapeo-verde/'
  // Para dominio personalizado (mapeoverde.org): '/' (GitHub Pages lo maneja automáticamente)
  // Usamos '/' porque con dominio personalizado GitHub Pages sirve desde la raíz
  base: process.env.GITHUB_ACTIONS && !process.env.CUSTOM_DOMAIN ? '/mapeo-verde/' : '/',
  plugins: [
    react(),
    analyze &&
      visualizer({
        filename: 'build/stats.html',
        open: false,
        gzipSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'figma:asset/0455b28a6febe3461bb9a6a5b2108ae41450da05.png': path.resolve(
        __dirname,
        './src/assets/0455b28a6febe3461bb9a6a5b2108ae41450da05.png',
      ),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    copyPublicDir: true,
  },
  publicDir: 'public',
  server: {
    host: true,
    port: 3000,
    open: true,
    proxy: {
      '/api/calendar': {
        target: 'https://calendar.google.com',
        changeOrigin: true,
        rewrite: (path) => {
          // URL completa del feed iCal del calendario
          const calendarId =
            'bce9da9cb33f280d49d3962f712747a07d9728d2954bac9d0c24db0c08f16470%40group.calendar.google.com';
          return `/calendar/ical/${calendarId}/public/basic.ics`;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Accept', 'text/calendar');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
          });
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
        },
      },
    },
  },
});
