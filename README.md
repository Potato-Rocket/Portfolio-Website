# oscar.stomberg.us

Personal engineering portfolio built with Astro, deployed to Cloudflare Pages.

## Tech Stack

- **Framework**: Astro 6, fully static output
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`) + `@tailwindcss/typography`
- **Fonts**: `@fontsource-variable/source-serif-4`, `@fontsource-variable/source-sans-3`
- **Icons**: `astro-icon` with the Lucide icon set
- **Language**: TypeScript throughout
- **Content**: Markdown files in a typed Astro content collection
- **Deployment**: Cloudflare Pages, custom domain `oscar.stomberg.us`

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
│   └── ProjectLinks.astro      # Shared GitHub/Live link row
├── layouts/
│   └── Layout.astro            # Shared HTML head + ClientRouter
├── pages/
│   ├── index.astro             # Home: name, tagline, featured tiles
│   ├── projects.astro          # Reverse-chronological timeline
│   └── projects/[slug].astro   # Dynamic project detail page
├── lib/
│   └── dates.ts                # formatDateRange helper
└── styles/
    └── global.css              # Tailwind import, theme tokens, prose-paper utility
public/
└── thumbnails/                 # Project thumbnail images
```

## Commands

```sh
npm install          # Install dependencies
npm run dev          # Dev server at localhost:4321
npm run build        # Build to ./dist/
npm run preview      # Preview built output
npx astro check      # Type-check .astro + .tsx files
```