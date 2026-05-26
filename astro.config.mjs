// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

import svelte from '@astrojs/svelte';

import mdx from '@astrojs/mdx';

// The Cloudflare adapter is only needed to build and deploy the worker bundle.
// Loading it for `astro dev` puts SSR through Vite's workerd-simulating runner,
// which currently crashes on CJS deps in the iconify subtree. Skipping it in
// dev gives us a plain Node dev server with HMR; `npm run preview` still
// builds + serves through real wrangler before pushing.
const isDev = process.argv[2] === 'dev';

export default defineConfig({
  site: "https://oscar.stomberg.us",
  adapter: isDev ? undefined : cloudflare({ imageService: 'compile' }),
  integrations: [icon(), svelte(), mdx()],
  vite: { plugins: [tailwindcss()] },
});