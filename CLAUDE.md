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
After frontend changes, make sure that the site if visually checked thoroughly in a browser. Note: **view transitions only fire on real client-side navigation** between pages, not on hot reload — to verify the navbar morph/crossfade you have to click between `/`, `/projects`, and a project detail page in the running dev server.

### Using documentation
Always fetch current docs via context7 before working with any library API — Astro, Tailwind v4, and the Typography plugin all move fast and training data may be stale. Especially important for:
- Astro content collections schema API
- Astro view-transition / `ClientRouter` directives
- Tailwind v4 `@utility` / `@theme` syntax
- `astro-icon` component API and icon-set imports
- Cloudflare Workers / `@astrojs/cloudflare` adapter / Wrangler config

### Adding a new project
Drop a `.md` file in `src/content/projects/` with the frontmatter schema below. Add a matching `public/thumbnails/<slug>.png` (resolved by `thumbnailPath()` in `src/lib/thumbnails.ts` — no frontmatter field). No other files need to change; the homepage picks up `featured: true` entries and `/projects` picks up everything.

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
- `--breakpoint-xs: 480px` — custom intermediate breakpoint; use `xs:` prefix in Tailwind classes

Dark mode is implemented via `@custom-variant dark (&:where(.dark, .dark *))`. All color tokens have dark overrides in `:root.dark {}`. The toggle is `DarkModeToggle.astro`; preference is stored in `localStorage`.

## Components

- `Layout.astro` — wraps the page in `<html>`, includes `<ClientRouter />` for view transitions. Body is `min-h-screen flex flex-col` with a `flex-1` slot wrapper so `Footer` sticks to the bottom on short pages.
- `Navbar.astro` — top bar. **Not rendered on `/`** (the hero carries the brand there). Uses a 3-column grid (`1fr auto 1fr`) that pins the active item (`Projects` on the index, the project title on detail pages) to the page's horizontal center; preceding items justify-end against it. On detail pages, accepts `isWip` and renders the same `· WIP` suffix used on Featured/Timeline titles — that's where the WIP marker lives for the article page (the article hero itself has no title to attach it to, since the h1 is `sr-only`). The `Icon.svg` monogram in the left cell is the only "home" link — `Home` text was intentionally dropped to avoid two adjacent home affordances. On detail pages, "Projects" sits as a breadcrumb prefix in the left cell. View transitions: `nav-brand` (icon) and `nav-projects` (label) morph between routes. Custom timing splits slide from fade — `::view-transition-group` runs 400ms with `cubic-bezier(0.4, 0, 0.2, 1)` for position morph; `::view-transition-old/new` runs 150ms for the crossfade, so content resolves faster than it slides. Honors `prefers-reduced-motion`.
- `FeaturedCard.astro` — homepage tile. Whole card is one `<a>`; do not nest anchors inside it. Width-agnostic by default; the home page sizes it via `class="w-88 max-w-full"` on each instance inside a `flex flex-wrap justify-center` container, which gives fixed-width cards with an incomplete last row centered (CSS Grid auto-fill can't do the per-row centering). **Trailer-style content**: thumbnail, italic-muted summary lead, date. No tags — tags live on `/projects` and article hero where they aid scanning/context, not on the curated home-page promo.
- `TimelineEntry.astro` — `/projects` row. Borderless by design; the thumbnail does the visual binding, not a wrapper.
- `Tag.astro` — filled tag pill (the one fill in the system).
- `ProjectLinks.astro` — shared GitHub/Live link row with icons. Pass `links={project.data.links}`. Renders nothing if both are absent. Accepts a `class` prop for layout overrides.
- `PersonalLinks.astro` — GitHub / LinkedIn / Email / Resume row. URLs are hard-coded inside the component (single source of truth). Props: `size?: 'sm' | 'lg'` (lg = hero, sm = footer), `class?: string`. External links + the resume PDF open in a new tab; `mailto:` opens in the OS handler.
- `Footer.astro` — site-wide footer, rendered by `Layout.astro` for every page. Top hairline border, centered `PersonalLinks` + copyright line. **Self-suppresses `PersonalLinks` on `/`** since the home hero already carries them at `size="lg"` — only the copyright remains there.
- `DarkModeToggle.astro` — fixed-position button (`bottom-4 right-4`) that toggles `.dark` on `<html>` and persists preference to `localStorage`. Uses `transition:persist` so it survives view transitions. Shows moon in light mode, sun in dark mode.

## Helpers & Assets

- `src/lib/dates.ts` — `formatDateRange(start, end?, ongoing?)` formats project dates as `"Jan 2023"`, `"Jan 2023–May 2024"` (en-dash, no spaces), or `"Since Jan 2023"` for `ongoing` projects. Uses `getUTC*` to avoid local-timezone date drift.
- `src/lib/thumbnails.ts` — `thumbnailPath(slug)` returns the public path for a project thumbnail. Convention is `/thumbnails/<slug>.png`; this is the single place to change if the format/location ever shifts.
- `src/assets/Icon.svg` — "OS" serif monogram, used as the navbar's brand mark via Astro's SVG-component import (`import Icon from "../assets/Icon.svg"; <Icon class="w-8 h-8" />`).
- `resume/resume.tex` → `public/files/Oscar-Stomberg-Resume.pdf` — source of truth is the LaTeX file; run `npm run build-resume` locally to regenerate the PDF and copy it into `public/files/`. The PDF is committed because Cloudflare's build env has no `pdflatex` (no `prebuild` hook). All build artifacts in `resume/` (`.aux`, `.log`, `.out`, `.pdf`, `.synctex.gz`) are gitignored except `resume.tex`.

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
- **Tag taxonomy.** Flat — tags span domain, tech, and skill categories freely. No filter UI yet.