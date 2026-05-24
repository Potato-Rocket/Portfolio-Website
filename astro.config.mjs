// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()]
  }
});
