import { copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages serves this site from /kalagram/, not the domain root. This points the image paths written
 * in components there, and adds the files Pages needs: 404.html sends deep links back to the app, and
 * .nojekyll stops Pages processing the build.
 */
function githubPages(base, outDir) {
  return {
    name: 'kalagram-github-pages',
    transform(code, id) {
      if (!/[\\/]src[\\/].*\.jsx$/.test(id)) return null;
      return { code: code.replace(/(["'`])\/images\//g, `$1${base}images/`), map: null };
    },
    closeBundle() {
      copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html'));
      writeFileSync(join(outDir, '.nojekyll'), '');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_DEV_BACKEND || 'http://localhost:8080';
  const proxy = { '/api': backend, '/uploads': backend };
  const isPages = mode === 'pages';
  const base = isPages ? '/kalagram/' : '/';
  const outDir = isPages ? 'dist-pages' : 'dist';

  return {
    base,
    plugins: [react(), ...(isPages ? [githubPages(base, outDir)] : [])],
    server: { port: 5180, proxy },
    // allowedHosts: lets the production preview be shared through a Cloudflare demo tunnel.
    preview: { port: 5180, proxy, allowedHosts: ['.trycloudflare.com'] },
    build: {
      outDir,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
          },
        },
      },
    },
  };
});
