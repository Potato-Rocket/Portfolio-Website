# CLAUDE.md — oscar.stomberg.us Portfolio

Personal engineering portfolio for Oscar Stomberg, Robotics Engineering student at WPI. See [README.md](README.md) for stack, structure, and commands. See [ROADMAP.md](ROADMAP.md) for in-flight follow-ups and known improvements.

## Workflow

### After editing code
Run the TypeScript checker before considering a chunk of work done:
```sh
npx astro check        # Astro-aware type check (covers .astro + .tsx files)
```
No separate `tsc` script is configured — `astro check` is the right tool here since it understands Astro's component types.

### Verifying UI changes
After frontend changes, make sure that the site if visually checked thoroughly in a browser.

### Using documentation
Always fetch current docs via context7 before working with any library API — Astro, Tailwind v4, and the Typography plugin all move fast and training data may be stale. Especially important for:
- Astro content collections schema API
- Astro view-transition / `ClientRouter` directives
- Tailwind v4 `@utility` / `@theme` syntax
- Cloudflare Workers / `@astrojs/cloudflare` adapter / Wrangler config

### Adding a new project
Drop a `.md` file in `src/content/projects/` with the frontmatter schema below. No other files need to change; the homepage picks up `featured: true` entries and `/projects` picks up everything.

## Deployment & Config

Deploys via Cloudflare's GitHub integration: pushing to the main branch triggers a build that runs the `@astrojs/cloudflare` adapter (Workers + Static Assets, *not* Pages — the adapter dropped Pages support). Local `wrangler deploy` is rarely needed.

### Dev vs. prod split in `astro.config.mjs`
The Cloudflare adapter is loaded **only when not running `astro dev`**:

```js
const isDev = process.argv[2] === 'dev';
adapter: isDev ? undefined : cloudflare({ imageService: 'compile' }),
```

Reason: in `astro dev`, the adapter routes SSR through Vite 7's workerd-simulating worker runner, which currently crashes with `module is not defined` on CJS deps in the iconify subtree (upstream `@astrojs/cloudflare` SSR pre-compilation issue). Skipping the adapter in dev gives a plain Node dev server with HMR. `npm run preview` still builds + serves through real `wrangler dev` before pushing, so divergence is caught.

If you ever add per-request logic (KV, D1, env bindings, dynamic routes), revisit this — `astro dev` won't simulate Cloudflare bindings, so you'll need `preview` for binding-aware testing.

### `wrangler.jsonc` at project root
Keep it minimal. The adapter generates a complete `dist/server/wrangler.json` at build time and merges your root config into it. Only put values the adapter can't know:
- `name`, `compatibility_date`, `compatibility_flags` (we keep `nodejs_compat` for transitive deps that reach for `node:*` built-ins)
- `observability` (logs + traces enabled, full sampling — fine at portfolio traffic)

Do **not** set `main` or an `assets` binding here. Both were carried over from older Pages-era configs and conflict with the adapter's generated values.

### Image service
`imageService: 'compile'` runs Sharp at build time for prerendered routes — generates WebP/AVIF + srcset for anything imported through Astro's `<Image>` component. No paid Cloudflare Images binding needed. Stay on `'compile'` unless we add SSR routes that need runtime image transforms.

### Generated worker types
`worker-configuration.d.ts` is gitignored. Regenerate via `npm run generate-types` if `wrangler.jsonc` changes in a way that affects bindings.

## Content Data Model

Defined in `src/content.config.ts`. Frontmatter for each project markdown file:

```yaml
title: "Selfhosting Infrastructure"
summary: "Multi-node home server cluster managed with Ansible."
status: "complete"           # "complete" | "wip" | "ongoing"
featured: false              # true → appears on home page
tags: ["infrastructure", "devops", "linux", "docker"]
thumbnail: "/thumbnails/selfhosting.png"   # path under public/
links:
  github: "https://github.com/..."
  live: "https://..."
related: ["daily-greeting-generator"]      # slugs of related projects
startDate: 2025-01-01
endDate: 2025-06-01          # omit if ongoing or single-point
```

The slug is the filename. The markdown body becomes the article content of the detail page.

## Design Language

The site's aesthetic is "lightly aged paper" — restrained, flat, content-forward. Color and visual interest come from project thumbnails, not chrome. Concretely:

- **No fills by default.** UI elements (cards, navbar, hero blocks) sit on the paper background. Tag pills are the explicit exception — they use `bg-rule` intentionally.
- **Hairline borders, never shadows.** Use `border-rule` for ambient lines and `border-rule-strong` for emphasized edges (thumbnails, tag outlines).
- **Sharp corners.** No `rounded-*` classes anywhere.
- **Hover is where visual feedback lives.** Links underline, card borders darken, thumbnails scale slightly. Static elements (tags, the WIP marker) do *not* get hover states.
- **WIP treatment.** Dashed border on the thumbnail + a subtle `· WIP` text marker. No warning banner.

Theme tokens live in `src/styles/global.css` under `@theme`:
- `--color-paper` / `--color-paper-deep` — backgrounds
- `--color-ink` / `--color-ink-muted` — text
- `--color-rule` / `--color-rule-strong` — borders
- `--font-sans` (Source Sans 3) for body, `--font-serif` (Source Serif 4) for headings

## Components

- `Layout.astro` — wraps the page in `<html>`, includes `<ClientRouter />` for view transitions.
- `Navbar.astro` — top bar; on project detail pages renders `Projects / <title>` with a view-transition name so the "Projects" label morphs between routes.
- `FeaturedCard.astro` — homepage tile. Whole card is one `<a>`; do not nest anchors inside it.
- `TimelineEntry.astro` — `/projects` row. Borderless by design; the thumbnail does the visual binding, not a wrapper.
- `Tag.astro` — filled tag pill (the one fill in the system).
- `ProjectLinks.astro` — shared GitHub/Live link row with icons. Pass `links={project.data.links}`. Renders nothing if both are absent. Accepts a `class` prop for layout overrides.

## Article Typography

Markdown bodies on project detail pages render inside `<article class="prose prose-paper">`. The `prose-paper` utility (in `global.css`) overrides Tailwind Typography's color variables with paper/ink tokens and adds two structural overrides: sharp corners on `pre`/`code`/`img`, and a cleaner inline-code treatment (no backtick pseudo-elements, paper-deep tint). Everything else is the Typography plugin's defaults — resist re-styling individual elements unless there's a real reason.

## Page Layouts

- **Home (`/`)** — name + tagline + featured project grid + link to `/projects`. Site-under-construction badge in the corner.
- **Timeline (`/projects`)** — reverse-chronological list keyed by `endDate ?? startDate`. Year labels on the left, hairline timeline rule in the middle, entries on the right. First entry of each new year gets extra top padding.
- **Project detail (`/projects/[slug]`)** — hero (thumbnail, status/date/tags row, `ProjectLinks`, italic summary lead) above a hairline rule, then article body. The `<h1>` is `sr-only` because the navbar already announces the title.

## Project Page Content Structure

Suggested section order for the markdown body of a project page:

1. What & why
2. Role & contribution (especially for team projects)
3. Technical details: stack, architecture, decisions, code snippets
4. Outcomes & reflection
5. Where it's going (WIP only)

Related-project links and external links (GitHub/Live) are surfaced by the page chrome, not the markdown body.

## Project Inventory (aspirational)

Markdown files currently in `src/content/projects/` are mostly stubs with `TODO` bodies. The intended full inventory:

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
- **Color Palette Extractor (ImagePy)** — `python`, `image-processing`
- **Unity Games** — `gamedev`, `unity`, `csharp` (not on GitHub)
- **Slab Flattening Jig** — `cad`, `solidworks`
- **Gridfinity Bins** — `cad`, `3d-printing`, `laser-cutting`
- **This Portfolio** — `web`, `astro`, `typescript`

## Open Decisions

- **`FeaturedCard` nested anchors.** The whole card is currently a single `<a>`. Adding `ProjectLinks` inside it would produce invalid nested anchors. Resolve before reusing `ProjectLinks` in the card.
- **Long/short titles.** Some project titles may need a separate display title vs. nav title; deferred.
- **Dark mode.** Nice-to-have, not v1.
- **Tag taxonomy.** Flat — tags span domain, tech, and skill categories freely. No filter UI yet.