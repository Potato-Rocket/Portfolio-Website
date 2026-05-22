# CLAUDE.md — oscar.stomberg.us Portfolio

Personal engineering portfolio for Oscar Stomberg, Robotics Engineering student at WPI. See [README.md](README.md) for stack, structure, and commands.

## Workflow

### After editing code
Run the TypeScript checker before considering a chunk of work done:
```sh
npx astro check        # Astro-aware type check (covers .astro + .tsx files)
```
No separate `tsc` script is configured — `astro check` is the right tool here since it understands Astro's component types.

### Using documentation
Always fetch current docs via context7 before working with any library API — Astro, React, Tailwind, and Cloudflare Workers all move fast and training data may be stale. Especially important for:
- Astro content collections schema API
- Astro island directives (`client:load`, `client:visible`, etc.)
- Cloudflare Pages / Wrangler config

### Verifying UI changes
After frontend changes, start the dev server and check the actual browser output — type checking does not catch layout or rendering issues:
```sh
npm run dev            # localhost:4321
```

### Adding a new project
Drop a `.md` file in `src/content/projects/` with the frontmatter schema from the Content Data Model section below. No other files need to change.

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

### Large tiles
- **Selfhosting Infrastructure** — `infrastructure`, `devops`, `linux`, `docker`
- **Hanover Insurance CMS** — `web`, `fullstack`, `react`, `typescript` (NDA: swap branding/screenshots before publishing)
- **Solar System Simulator** — `java`, `graphics`, `physics`, `simulation`

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

- **Header**: Name, tagline, links (GitHub, LinkedIn, resume PDF, email)
- **Tag filter bar**: Filters the grid in-place
- **Project grid**: Variable-size tiles sorted by `priority`; WIP tiles get a subtle badge + dashed border, not a warning banner
- No separate projects page — all tiles on the homepage

## Design Principles

- Clean, professional, not template-generic
- Responsive — mobile is required (recruiters)
- Performance: static HTML + minimal JS
- Dark mode: nice-to-have, not v1

## Project Page Structure

1. Hero: title, status badge (WIP only), thumbnail, one-sentence summary
2. What & why
3. Role & contribution (especially for team projects)
4. Technical details: stack, architecture, decisions, code snippets
5. Outcomes & reflection
6. Links: GitHub, live demo, related projects
7. Where it's going (WIP only)

## Key Decisions

- Content is the hard part. Architecture should make adding a project as simple as dropping a markdown file.
- Tag taxonomy is flat — tags span domain, tech, and skill categories freely.
- The Cloudflare adapter enables SSR but this site is purely static; `output: 'static'` without the adapter is worth considering.
- Full planning rationale in `portfolio-spec.md`.