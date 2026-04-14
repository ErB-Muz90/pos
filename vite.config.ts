import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    return {
      server: {
        port: 3006,
        host: '0.0.0.0',
        // Serve /admin/* as static files — do NOT fall through to SPA index.html
        fs: { strict: false },
      },
      plugins: [
        react(),
        {
          name: 'admin-no-spa-fallback',
          configureServer(server) {
            // Return 404 for /admin paths not found as static files
            // so Vite doesn't fall back to index.html for them
            server.middlewares.use((req, res, next) => {
              if (req.url?.startsWith('/admin') && !req.url.includes('.')) {
                // redirect bare /admin or /admin/ to /admin/index.html
                res.writeHead(302, { Location: '/admin/index.html' });
                res.end();
                return;
              }
              // /super-admin/* falls through to SPA index.html
              next();
            });
          },
        },
      ],
      build: {
        // Optimize for Netlify
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              charts: ['recharts'],
              utils: ['jspdf', 'html2canvas', 'jsbarcode', 'qrcode']
            }
          }
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000
      },
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Netlify-specific optimizations
      base: './',
      publicDir: 'public'
    };
});
