// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // English is the source language and lives at the root; Spanish is under /es/.
  site: 'https://espasa.ekdromoi.cl',
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } } })],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: { prefixDefaultLocale: false },
  },
});
