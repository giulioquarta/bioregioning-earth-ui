import { defineConfig } from 'astro/config';

const SITE_URL = 'https://giulioquarta.github.io';

export default defineConfig({
  site: SITE_URL,
  base: '/bioregioning-earth-ui',
  outDir: './dist',
  srcDir: './src',
});
