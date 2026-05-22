# oscar.stomberg.us

Personal engineering portfolio built with Astro, deployed to Cloudflare Pages.

## Tech Stack

- **Framework**: Astro 6 with content collections
- **Interactive components**: React (tag filter bar, tile grid) via Astro islands (`client:load`)
- **Styling**: Tailwind CSS
- **Language**: TypeScript throughout
- **Deployment**: Cloudflare Pages via Wrangler, custom domain `oscar.stomberg.us`
- **Content**: Markdown/MDX files with typed frontmatter schemas

### Dependencies not yet installed

- `@astrojs/react` — React integration for interactive islands
- `@astrojs/tailwind` or `@tailwindcss/vite` — Tailwind integration
- `@astrojs/mdx` — MDX support (optional, for embedding components in project pages)

## Project Structure

```
src/
├── content/
│   ├── config.ts              # Content collection schema
│   └── projects/              # One .md or .mdx file per project
├── components/
│   ├── ProjectGrid.tsx        # Filterable tile grid (React island)
│   ├── ProjectTile.tsx        # Individual tile, variable sizes
│   ├── TagFilter.tsx          # Tag filter bar
│   └── ...                    # Astro components for layout pieces
├── layouts/
│   ├── BaseLayout.astro       # Shared HTML head, nav, footer
│   └── ProjectLayout.astro    # Project page template
├── pages/
│   ├── index.astro            # Landing page with grid
│   └── projects/
│       └── [...slug].astro    # Dynamic route for project pages
└── styles/
    └── global.css
public/
├── resume.pdf
└── thumbnails/                # Project thumbnail images
```

## Commands

```sh
npm install          # Install dependencies
npm run dev          # Dev server at localhost:4321
npm run build        # Build to ./dist/
npm run preview      # Build + preview via wrangler dev
npm run deploy       # Build + deploy via wrangler
```