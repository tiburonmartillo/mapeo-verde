/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { handleSemarnatProxy, resolveSemarnatPath, PROXY_MOUNT } from './api/_lib/semarnat-proxy';

const analyze = process.env.ANALYZE === '1' || process.env.ANALYZE === 'true';

/** Sirve en dev las funciones serverless de `api/` que en Vercel ejecuta el runtime.
 *  Vite no las conoce, así que sin esto `/api/semarnat-proxy/*` devuelve 404. */
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-proxy',
    configureServer(server) {
      server.middlewares.use(PROXY_MOUNT, async (req, res, next) => {
        if (req.method !== 'POST') return next();
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const raw = Buffer.concat(chunks).toString('utf-8');
          let body: unknown = raw;
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = raw;
          }

          const fullPath = (req.originalUrl || req.url || '').split('?')[0];
          const result = await handleSemarnatProxy(resolveSemarnatPath(fullPath), body);

          res.statusCode = result.status;
          if (result.kind === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="documento.pdf"');
            res.end(result.data);
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.data));
          }
        } catch (err) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }));
        }
      });
    },
  };
}

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
    apiDevPlugin(),
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
  optimizeDeps: {
    include: [],
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
