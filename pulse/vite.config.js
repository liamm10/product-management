import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// GitHub Pages serves a project site at /<repo-name>/, so the base path has to
// match the repo the site is deployed from. In GitHub Actions we read the repo
// name from GITHUB_REPOSITORY ("owner/repo"); locally we fall back to this
// fork's name so `npm run dev` matches the deployed URL.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'product-management';

// Pulse (default) deploys at /<repo>/pulse/.
// The York U Fitness class variant (mode "yorku") deploys to a /yorku/
// subpath alongside it, so both ship from the same GitHub Pages site.
export default defineConfig(({ mode }) => {
  const isYorku = mode === 'yorku';
  return {
    plugins: [react()],
    resolve: {
      // York loads a lighter font set (see src/fonts/yorku.js); Pulse is unchanged.
      alias: {
        'brand-fonts': fileURLToPath(new URL(`./src/fonts/${isYorku ? 'yorku' : 'pulse'}.js`, import.meta.url)),
      },
    },
    base: isYorku ? `/${repo}/pulse/yorku/` : `/${repo}/pulse/`,
    build: {
      outDir: isYorku ? 'dist/pulse/yorku' : 'dist/pulse',
      emptyOutDir: true,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.js'],
    },
  };
});
