# CLAUDE.md — oscar.stomberg.us Portfolio

## Project Overview

Personal engineering portfolio for Oscar Stomberg, a Robotics Engineering student at WPI. Built with Astro, deployed to Cloudflare Pages at `oscar.stomberg.us`. The site showcases software, hardware, and infrastructure projects with narrative depth that a resume and GitHub profile can't provide.

The portfolio itself is a public project — the repo is on GitHub and the site has its own project entry.

## Tech Stack

- **Framework**: Astro 6 with content collections
- **Interactive components**: React (for tag filter bar, tile grid) via Astro islands (`client:load`)
- **Styling**: Tailwind CSS
- **Language**: TypeScript throughout
- **Deployment**: Cloudflare Pages via Wrangler, custom domain `oscar.stomberg.us`
- **Content**: Markdown/MDX files with typed frontmatter schemas

### Dependencies to add (not yet installed)

- `@astrojs/react` — React integration for interactive islands
- `@astrojs/tailwind` or `@tailwindcss/vite` — Tailwind integration
- `@astrojs/mdx` — MDX support (optional, for embedding components in project pages)

### Static vs SSR note

The Cloudflare adapter (`@astrojs/cloudflare`) is currently installed, which enables SSR. This site is purely static content — consider whether SSR is needed or whether `output: 'static'` with no adapter would be simpler. If staying on Cloudflare Pages with wrangler, the current setup works fine, but nothing here requires server-side rendering.

## Project Structure

```
src/
├── content/
│   ├── config.ts              # Content collection schema definition
│   └── projects/              # One .md or .mdx file per project
│       ├── selfhosting.md
│       ├── hanover-cms.md
│       ├── solar-system-simulator.md
│       └── ...
├── components/
│   ├── ProjectGrid.tsx        # Filterable tile grid (React island)
│   ├── ProjectTile.tsx        # Individual tile, renders at variable sizes
│   ├── TagFilter.tsx          # Tag filter bar
│   └── ...                    # Astro components for layout pieces
├── layouts/
│   ├── BaseLayout.astro       # Shared HTML head, nav, footer
│   └── ProjectLayout.astro    # Project page template (wraps markdown content)
├── pages/
│   ├── index.astro            # Landing page with grid
│   └── projects/
│       └── [...slug].astro    # Dynamic route for individual project pages
└── styles/
    └── global.css
public/
├── resume.pdf
└── thumbnails/                # Project thumbnail images
```

## Content Data Model

Each project is a markdown file in `src/content/projects/`. Frontmatter schema:

```yaml
title: "Selfhosting Infrastructure"
slug: "selfhosting"
summary: "Multi-node home server cluster managed with Ansible, running 15+ containerized services."
status: "complete"           # "complete" | "wip"
tileSize: "large"            # "large" | "medium" | "small"
priority: 1                  # Sort order — lower number = higher on page
tags: ["infrastructure", "devops", "linux", "docker"]
thumbnail: "./thumbnails/selfhosting.png"
links:
  github: "https://github.com/Potato-Rocket/..."
  live: ""
related: ["daily-greeting-generator"]  # Slugs of related projects
date: "2025-01-01"
```

The markdown body is the full project page content, rendered by `ProjectLayout.astro`.

## Project Inventory

### Large tiles (headliners)
- **Selfhosting Infrastructure** — `infrastructure`, `devops`, `linux`, `docker`
- **Hanover Insurance CMS** — `web`, `fullstack`, `react`, `typescript` (NDA: may need to swap branding/sample data before showing screenshots)
- **Solar System Simulator** — `java`, `graphics`, `physics`, `simulation` (has excellent existing docs + screenshots)

### Medium tiles
- **Synthetic Word Generator** — `python`, `data`, `nlp`
- **Daily Greeting Generator** — `python`, `docker`, `homeassistant`, `llm`
- **WPI Class Schedule Importer** — `python`, `tui`, `tools`
- **Plant Datalogger** — `embedded`, `c`, `rp2040`, `hardware` (WIP)
- **FRC Robot Chute** — `cad`, `fabrication`, `laser-cutting`

### Small tiles
- **HA Light Controller** — `embedded`, `homeassistant`, `hardware` (WIP)
- **Subwoofer Build** — `fabrication`, `cnc`, `woodworking` (WIP)
- **Star Map** — `simulation`, `graphics` (WIP, related to Solar System Simulator)
- **Color Palette Extractor** — `python`, `image-processing`
- **Unity Games** — `gamedev`, `unity`, `csharp` (not on GitHub)
- **Slab Flattening Jig** — `cad`, `solidworks`
- **Gridfinity Bins** — `cad`, `3d-printing`, `laser-cutting`
- **This Portfolio** — `web`, `astro`, `typescript`

## Homepage Layout

- **Header**: Name, one-liner tagline, links (GitHub, LinkedIn, resume PDF, email)
- **Tag filter bar**: Filters the grid in-place by tag
- **Project grid**: Variable-size tiles (large/medium/small), sorted by priority, WIP projects have a subtle visual badge — not hidden, not obnoxious
- No separate "projects page" — all tiles live on the homepage grid with the most important ones on top

## Design Principles

- Clean, professional, not template-generic
- WIP tiles: subtle differentiation (muted treatment, small badge, dashed border — not a warning banner)
- Responsive — must work on mobile (recruiters check on phones)
- Dark mode: nice-to-have, not required for v1
- Performance: static HTML + minimal JS = near-perfect Lighthouse scores
- The site itself should demonstrate frontend competence without being over-designed

## Project Page Structure

Each project page follows an inverted pyramid:
1. Hero: title, status badge (if WIP), thumbnail/screenshot/diagram, one-sentence summary
2. What & why: what the project is, what problem it solves
3. Role & contribution: especially for team projects
4. Technical details: stack, architecture, decisions, diagrams, code snippets
5. Outcomes & reflection: what worked, what broke, what was learned
6. Links: GitHub, live demo, related projects
7. Where it's going (WIP only): current state, next steps

## Commands

```sh
npm install          # Install dependencies
npm run dev          # Dev server at localhost:4321
npm run build        # Build to ./dist/
npm run preview      # Build + preview via wrangler dev
npm run deploy       # Build + deploy via wrangler
```

## Key Decisions & Context

- Oscar has React/TypeScript/Tailwind experience from the Hanover CMS project (full-stack soft eng course). Astro is new but the skills carry over.
- The Cloudflare adapter + Wrangler setup is already working for deployment.
- Content is the hard part, not the framework. The architecture should make adding a new project as simple as dropping a markdown file with frontmatter.
- Tag taxonomy is flat (no hierarchy). Tags span domain, tech, and skill categories.
- The portfolio spec document (portfolio-spec.md) has the full planning rationale.
