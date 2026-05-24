# oscar.stomberg.us

Personal engineering portfolio built with Astro, deployed to Cloudflare Workers.

## Tech Stack

- **Framework**: Astro 6 with `@astrojs/cloudflare` (Workers + Static Assets); every page is prerendered at build time
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`) + `@tailwindcss/typography`
- **Fonts**: `@fontsource-variable/source-serif-4`, `@fontsource-variable/source-sans-3`
- **Icons**: `astro-icon` with the Lucide icon set
- **Language**: TypeScript throughout
- **Content**: Markdown files in a typed Astro content collection
- **Deployment**: Cloudflare Workers via GitHub integration, custom domain `oscar.stomberg.us`

## Project Structure

```
src/
├── content.config.ts           # Content collection schema (Zod)
├── content/
│   └── projects/               # One .md file per project
├── components/
│   ├── Navbar.astro            # Top nav with view-transition names
│   ├── FeaturedCard.astro      # Homepage featured-project tile
│   ├── TimelineEntry.astro     # Timeline row on /projects
│   ├── Tag.astro               # Filled tag pill
│   ├── ProjectLinks.astro      # Shared GitHub/Live link row
│   ├── PersonalLinks.astro     # GitHub/LinkedIn/Email/Resume row
│   ├── Footer.astro            # Site-wide footer
│   └── DarkModeToggle.astro    # Fixed dark/light mode toggle button
├── layouts/
│   └── Layout.astro            # Shared HTML head + ClientRouter
├── pages/
│   ├── index.astro             # Home: name, tagline, featured tiles
│   ├── projects.astro          # Reverse-chronological timeline
│   └── projects/[slug].astro   # Dynamic project detail page
├── lib/
│   ├── dates.ts                # formatDateRange helper
│   └── thumbnails.ts           # thumbnailPath(slug) helper
└── styles/
    └── global.css              # Tailwind import, theme tokens, prose-paper utility
public/
└── thumbnails/                 # Project thumbnail images
```

## Commands

```sh
npm install              # Install dependencies
npm run dev              # Dev server at localhost:4321 (plain Astro/Vite, HMR)
npm run build            # Build to ./dist/ (runs the Cloudflare adapter)
npm run preview          # Build + wrangler dev — mirrors production
npm run deploy           # Build + wrangler deploy (usually unused; push to GitHub instead)
npm run generate-types   # Regenerate worker-configuration.d.ts from wrangler.jsonc
npx astro check          # Type-check .astro + .tsx files
```

## Local dev vs. production

`astro.config.mjs` conditionally loads the Cloudflare adapter only when *not* running `astro dev`. Reason: the adapter routes SSR through Vite's workerd-simulating runner in dev, which currently crashes on CJS deps in the iconify subtree (upstream issue with the adapter's dev pre-compilation). So:

- `npm run dev` runs in plain Node and gives you HMR for fast iteration.
- `npm run preview` builds with the adapter and serves via real `wrangler dev` — use this to catch anything that diverges from production before pushing.
- `git push` triggers Cloudflare's GitHub integration to build and deploy.

## Wrangler configuration

`wrangler.jsonc` at the project root only carries values the adapter can't know: worker `name`, `compatibility_date`, `compatibility_flags`, and `observability`. Do **not** add `main` or an `assets` binding here — the adapter generates a complete `dist/server/wrangler.json` at build time and would conflict with manual values.