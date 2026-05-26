# oscar.stomberg.us

Personal engineering portfolio built with Astro, deployed to Cloudflare Workers.

## Tech Stack

- **Framework**: Astro 6 with `@astrojs/cloudflare` (Workers + Static Assets); every page is prerendered at build time
- **Interactive islands**: `@astrojs/svelte` (Svelte 5 with runes) for the timeline tag filter and a few shared interactive components; `@iconify/svelte` for icons inside Svelte
- **Content**: `@astrojs/mdx` so project bodies can be `.md` or `.mdx` (MDX needed for embedded components like `YouTube`)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`) + `@tailwindcss/typography`
- **Fonts**: `@fontsource-variable/source-serif-4`, `@fontsource-variable/source-sans-3`
- **Icons**: `astro-icon` with the Lucide icon set (Astro side); `@iconify/svelte` (Svelte side)
- **Language**: TypeScript throughout
- **Deployment**: Cloudflare Workers via GitHub integration, custom domain `oscar.stomberg.us`

## Project Structure

```
src/
├── content.config.ts           # Content collection schema (Zod)
├── content/
│   └── projects/               # One .md or .mdx file per project
├── components/
│   ├── Navbar.astro            # Top nav with view-transition names
│   ├── FeaturedCard.astro      # Homepage featured-project tile
│   ├── RelatedCard.astro       # Related-projects card on detail pages
│   ├── ProjectsTimeline.svelte # /projects timeline + tag filter island
│   ├── ProjectThumbnail.astro  # Static thumbnail (cards, detail header)
│   ├── ProjectThumbnail.svelte # Reactive thumbnail (used inside the timeline island)
│   ├── TagPill.astro           # Static tag pill (link form)
│   ├── TagPill.svelte          # Interactive tag pill (button form, used by the filter)
│   ├── ProjectLinks.astro      # Shared GitHub/Live link row
│   ├── PersonalLinks.astro     # GitHub/LinkedIn/Email/Resume row
│   ├── YouTube.astro           # Lazy YouTube embed for MDX bodies
│   ├── Footer.astro            # Site-wide footer
│   ├── GoToTop.astro           # Fixed scroll-to-top button
│   └── DarkModeToggle.astro    # Fixed dark/light mode toggle button
├── layouts/
│   └── Layout.astro            # Shared HTML head + ClientRouter
├── pages/
│   ├── index.astro             # Home: name, tagline, featured tiles
│   ├── projects.astro          # Reverse-chronological timeline (renders the Svelte island)
│   ├── projects/[slug].astro   # Dynamic project detail page
│   └── gallery.astro           # Justified-rows photo gallery
├── lib/
│   ├── dates.ts                # monthYear / effectiveDate / formatDateRange helpers
│   ├── thumbnails.ts           # findThumbnailPath(slug) helper
│   ├── gallery.ts              # loadGalleryItems + deterministic shuffle
│   └── galleryLayout.ts        # justifiedRows() flexbin layout algorithm
├── data/
│   └── tag-colors.json         # Tag → hue map; synced from project frontmatter
├── assets/
│   ├── Icon.svg                # "OS" monogram (navbar brand)
│   └── <slug>/*.{jpg,png,...}  # Gallery images keyed by project slug
└── styles/
    └── global.css              # Tailwind import, theme tokens, tag colors, prose-paper utility
public/
└── thumbnails/                 # Project thumbnail images (.png or .jpg)
scripts/
└── sync-tags.ts                # Reconcile tag-colors.json with frontmatter tags
```

## Commands

```sh
npm install              # Install dependencies
npm run dev              # Dev server at localhost:4321 (plain Astro/Vite, HMR)
npm run build            # Build to ./dist/ (runs the Cloudflare adapter)
npm run preview          # Build + wrangler dev — mirrors production
npm run deploy           # Build + wrangler deploy (usually unused; push to GitHub instead)
npm run preprocess       # Run scripts/sync-tags.ts to reconcile tag-colors.json with frontmatter
npm run build-resume     # Recompile resume/resume.tex → public/files/Oscar-Stomberg-Resume.pdf
npm run generate-types   # Regenerate worker-configuration.d.ts from wrangler.jsonc
npx astro check          # Type-check .astro + .svelte + .tsx files
```

## Local dev vs. production

`astro.config.mjs` conditionally loads the Cloudflare adapter only when *not* running `astro dev`. Reason: the adapter routes SSR through Vite's workerd-simulating runner in dev, which currently crashes on CJS deps in the iconify subtree (upstream issue with the adapter's dev pre-compilation). So:

- `npm run dev` runs in plain Node and gives you HMR for fast iteration.
- `npm run preview` builds with the adapter and serves via real `wrangler dev` — use this to catch anything that diverges from production before pushing.
- `git push` triggers Cloudflare's GitHub integration to build and deploy.

## Wrangler configuration

`wrangler.jsonc` at the project root only carries values the adapter can't know: worker `name`, `compatibility_date`, `compatibility_flags`, and `observability`. Do **not** add `main` or an `assets` binding here — the adapter generates a complete `dist/server/wrangler.json` at build time and would conflict with manual values.