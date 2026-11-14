// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://herodigital.com.au',
  trailingSlash: 'always',
  output: 'static',
  vite: {
    envPrefix: ['PUBLIC_', 'SANITY_'],
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/audit'),
    }),
  ],
});
