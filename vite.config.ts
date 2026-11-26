import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: '/radio/',
    plugins: [
      react(),
      tailwindcss(),
      // Serves both '/' and '/radio/' in development without blank screen or redirect loops
      {
        name: 'serve-root-and-radio-subpath',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url === '/' || req.url === '/index.html') {
              req.url = '/radio/';
            }
            next();
          });
        },
      },
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      // Mirrors compiled dist/assets into dist/radio/assets (and index.html into dist/radio/)
      // so both direct domain deployments and /radio/ subpath deployments resolve assets without 404.
      {
        name: 'mirror-radio-subpath-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const compiledAssetsDir = path.resolve(distDir, 'assets');
          const radioDir = path.resolve(distDir, 'radio');
          const radioAssetsDir = path.resolve(radioDir, 'assets');

          if (fs.existsSync(compiledAssetsDir)) {
            fs.mkdirSync(radioAssetsDir, {recursive: true});
            fs.cpSync(compiledAssetsDir, radioAssetsDir, {recursive: true, force: true});
          }

          const indexHtml = path.resolve(distDir, 'index.html');
          if (fs.existsSync(indexHtml)) {
            fs.mkdirSync(radioDir, {recursive: true});
            fs.cpSync(indexHtml, path.resolve(radioDir, 'index.html'), {force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
