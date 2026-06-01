# CLAUDE.md — oscar.stomberg.us Portfolio

Personal engineering portfolio for Oscar Stomberg, Robotics Engineering student at WPI. See [README.md](README.md) for stack and commands. **Note:** the README's project structure diagram is partially stale — `src/components/mdx/` (YouTube, GreetingDemo, LiveGreeting, GreetingFallback) and `src/assets/thumbnails/` (not `public/thumbnails/`) are not reflected. CLAUDE.md is the authoritative reference for component paths. See [ROADMAP.md](ROADMAP.md) for in-flight follow-ups and known improvements.

## Workflow

### After editing code
Run the TypeScript checker before considering a chunk of work done:
```sh
npx astro check        # Astro-aware type check (covers .astro + .svelte + .tsx files)
```
No separate `tsc` script is configured — `astro check` is the right tool here since it understands Astro's and Svelte's component types via the language servers.

### Verifying UI changes
After frontend changes, make sure that the site if visually checked thoroughly in a browser. Note: **view transitions only fire on real client-side navigation** between pages, not on hot reload — to verify the navbar morph/crossfade you have to click between `/`, `/projects`, and a project detail page in the running dev server.

### Using documentation
Always fetch current docs before working with any library API — Astro, Svelte, Tailwind v4, Cloudflare, and the Typography plugin all move fast and training data may be stale. Prefer the vendor-specific MCP server when one exists; fall back to context7 otherwise.

| Library | Source to query | Especially for |
| --- | --- | --- |
| Astro | `astro-docs` MCP (`https://mcp.docs.astro.build/mcp`) | content collections schema, view-transition / `ClientRouter` directives, `@astrojs/mdx`, `astro-icon`, Astro `<Image>` / image service |
| Svelte | `svelte` MCP (`https://mcp.svelte.dev/mcp`) | Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`), `svelte/reactivity` (`SvelteSet`, `SvelteMap`), `@iconify/svelte`, `@astrojs/svelte` integration |
| Cloudflare | Cloudflare Docs MCP (`https://docs.mcp.cloudflare.com/sse`) | Workers + Static Assets model, `@astrojs/cloudflare` adapter, Wrangler config (`compatibility_flags`, `observability`, bindings) |
| Tailwind | context7 | Tailwind v4 `@utility` / `@theme` / `@custom-variant` syntax, plugin authoring, Typography plugin overrides |

### Adding a new project
1. Drop a `.md` or `.mdx` file in `src/content/projects/` with the frontmatter schema below. Use `.mdx` only when the body imports components (e.g. `YouTube`).
2. Add a matching `src/assets/thumbnails/<slug>.png` or `<slug>.jpg` (resolved by `findThumbnailImage()` / `findThumbnailPath()` in `src/lib/thumbnails.ts` — no frontmatter field). If absent, the thumbnail renders as a diagonal-hatch placeholder.
3. (Optional) Drop gallery images at `src/assets/<slug>/*.{jpg,jpeg,png,webp,avif}`. They're discovered automatically by `loadGalleryItems()` and appear on `/gallery`. They render through Astro's `<Image>`, so Sharp generates responsive srcsets at build time.
4. Run `npm run preprocess` to add any new tags into `src/data/tag-colors.json` (they appear as `null` hues — see [Tag colors](#tag-colors) below to assign one).

The homepage picks up `featured: true` entries; `/projects` picks up everything not marked `hidden: true`; `/gallery` picks up any project (not `hidden`) that has matching `src/assets/<slug>/` images.

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

### Greeting Worker route
A separate `greeting-proxy` Worker (standalone repo at `~/Dropbox/Projects/027 Greeting Demo/`, `wrangler deploy`) runs at `oscar.stomberg.us/api/greeting/*`, sitting in front of the Astro Worker for that path. It runs an hourly cron that pulls from the Cloudflare Tunnel (`demo.oscar.stomberg.us` → Go file server on the home server) and caches metadata in KV and audio/cover art in R2. Visitor requests hit the Worker at the edge; the home server is never exposed directly. `TUNNEL_ORIGIN` is stored as a Wrangler secret. If the cron hasn't run yet today the Worker serves the last cached result (yellow dot in `LiveGreeting.svelte`).

**Caching strategy.** Metadata (`/api/greeting`) is `Cache-Control: no-store` -- it's ~1 KB, always fresh, and acts as the pointer that governs everything downstream. R2 assets (`/api/greeting/audio`, `/api/greeting/cover`) are `Cache-Control: public, max-age=86400, immutable` and the client fetches them with a `?d=${data.date}` query string so each day's content gets its own URL. The Worker doesn't read the param -- it just serves whatever's in R2 under key `audio`/`cover` -- but the unique URL is what lets the browser and Cloudflare edge cache the heavy assets aggressively without ever serving yesterday's bytes on a new day. This is the classic "uncached pointer + immutable content-addressed assets" pattern (like fingerprinted JS bundles). Don't reintroduce caching on the metadata response or the stale-Safari and stale-back-nav bugs come back.

The Go file server source lives at `~/Dropbox/Projects/021 Daily Greeting/demo-server/` (module `greeting-demo`). Both directories are configured as `additionalDirectories` in `.claude/settings.local.json` so Claude can read them directly.

### Contact form route (`/api/contact`)
The contact form on `/about` POSTs to `src/pages/api/contact.ts` -- the site's **only** SSR endpoint (`export const prerender = false`). Unlike the greeting route, this needs **no separate Worker**: the one `prerender = false` route flips the whole deploy from pure static to Workers + Static Assets, and that single route runs SSR inside the Astro Worker while everything else stays prerendered.

**Delivery -- Architecture B (create-in-folder, not real send).** It talks to Fastmail's JMAP API over HTTPS and uses `Email/set` *only* (no `EmailSubmission/set`) to drop the message straight into the `Portfolio` Fastmail folder via `mailboxIds`. `from:` = the visitor (so replying from the folder just works and Fastmail composes the reply as contact@), `to: contact@stomberg.us`. This keeps the token scoped to **Mail only** -- no send scope -- and avoids any raw-MIME header-injection surface (JMAP is structured JSON). Flow: `GET /jmap/session` → `apiUrl` + `accountId` (from `primaryAccounts`), then `Mailbox/get {ids:null}` to resolve the folder id by name, then `Email/set`. The session and mailbox id are cached per isolate (`cachedSession` / `cachedMailboxId`) -- a cold request pays two extra round trips, warm ones don't.

**Runtime env.** Secrets are read via `import { env } from "cloudflare:workers"` (NOT `Astro.locals.runtime`, removed; NOT `import.meta.env`, build-time only). `env` is typed by the gitignored `worker-configuration.d.ts`, so the file casts it (`env as unknown as {...}`) to typecheck before the keys are wired up. Two secrets:
- `FASTMAIL_API_TOKEN` -- Fastmail API token, **Mail scope only**.
- `TURNSTILE_SECRET_KEY` -- the secret half of the Turnstile pair. The **site key is public** and lives in `ContactForm.svelte` (`TURNSTILE_SITE_KEY`).

Set both with `wrangler secret put` for prod. For local `npm run preview`, put them in `.dev.vars` (gitignored); `.dev.vars.example` is the committed template. If `TURNSTILE_SECRET_KEY` is unset the endpoint **skips** captcha verification (logs a warning) so JMAP can be tested in isolation; if `FASTMAIL_API_TOKEN` is unset it returns `send_failed`.

**Spam: Turnstile only.** A honeypot and a timing-trap were both tried and removed (honeypot risked autofill false-positives; the timing-trap relied on a forgeable client timestamp). Turnstile is the sole bot wall now; a CF rate-limit rule is deferred (no-code dashboard add if abuse appears).

**Validation** is shared with the client via `src/lib/contactSchema.ts` (see [Helpers](#helpers--assets)) -- the same zod schema runs on both ends; the server is the authority, the client copy is pure UX. Responses: `{ok:true}` on success; `400 {ok:false,error:"invalid_input",fields:{...}}` on validation failure (per-field zod codes); `403 verification_failed`; `502 send_failed`; `400 bad_request` for unparseable JSON.

**Dev caveat.** This route does **not** run under `npm run dev` (the Cloudflare adapter is skipped there -- see [Dev vs. prod split](#dev-vs-prod-split-in-astroconfigmjs)). Test it with `npm run preview` (real wrangler): outbound `fetch` to `api.fastmail.com` works, secrets load from `.dev.vars`, and a successful submit writes a **real** message into the Fastmail folder. Add `localhost` to the Turnstile widget's allowed hostnames to exercise the captcha locally.

**Public address.** `contact@stomberg.us` is the single permanent public address (form funnel, footer/hero mailto, resume) -- chosen because `.edu` dies after graduation and the address can't be rotated once it's on circulating resumes. The footer/hero mailto (`PersonalLinks.astro`) and the form's error-fallback mailto (`ContactForm.svelte`) are both **obfuscated** so the literal `user@domain` never appears in served HTML or the JS bundle: split into parts and reassembled client-side. In `ContactForm.svelte` the join uses `["contact","stomberg.us"].join("@")` specifically because esbuild constant-folds string concat *and* `String.fromCharCode` back into a literal, but does not fold `Array.join`.

### `wrangler.jsonc` at project root
Keep it minimal. The adapter generates a complete `dist/server/wrangler.json` at build time and merges your root config into it. Only put values the adapter can't know:
- `name`, `compatibility_date`, `compatibility_flags` (we keep `nodejs_compat` for transitive deps that reach for `node:*` built-ins)
- `observability` (logs + traces enabled, full sampling — fine at portfolio traffic)

Do **not** set `main` or an `assets` binding here. Both were carried over from older Pages-era configs and conflict with the adapter's generated values.

### Image service
`imageService: 'compile'` runs Sharp at build time for prerendered routes — generates WebP/AVIF + srcset for anything imported through Astro's `<Image>` component. No paid Cloudflare Images binding needed. Stay on `'compile'` unless we add SSR routes that need runtime image transforms.

### SEO & performance config
- `site: "https://oscar.stomberg.us"` is set in `astro.config.mjs` so `Astro.site` resolves — required for building absolute OG image URLs (`new URL(thumbImage.src, Astro.site).href`).
- `prefetch: { prefetchAll: true, defaultStrategy: "hover" }` — all `<a>` tags get hover-prefetch automatically because `ClientRouter` is active.
- `Layout.astro` props: `title` (auto-suffixed `— Oscar Stomberg`; omit on home page), `description` (falls back to site-wide tagline), `image` (absolute URL for `og:image` / `twitter:image`; omit on non-project pages). Variable font woff2 files are preloaded in `<head>` via `?url` imports from `@fontsource-variable`.

### Generated worker types
`worker-configuration.d.ts` is gitignored. Regenerate via `npm run generate-types` if `wrangler.jsonc` changes in a way that affects bindings.

## Content Data Model

Defined in `src/content.config.ts`. Frontmatter for each project file:

```yaml
title: "Selfhosting Infrastructure"
summary: "Multi-node home server cluster managed with Ansible."
status: "complete"            # "complete" | "wip" | "ongoing"
featured: false               # true → appears on home page
hidden: false                 # true → excluded from /, /projects, /gallery (still builds /projects/<slug>)
tags: ["infrastructure", "devops", "linux", "docker"]
links:
  github: "https://github.com/..."
  live: "https://..."
related: ["daily-greeting-generator"]   # slugs of related projects
periods:                       # at least one entry; ordered chronologically (oldest first)
  - date: 2020-06-17
    label: "Initial development"        # optional
  - date: 2025-11-26
    label: "V4 rewrite"
```

The slug is the filename (without extension). The markdown/MDX body becomes the article content of the detail page.

### `periods` shape and why it's not `startDate`/`endDate`
- A project's "history" is a list of dated events, not a single span. `periods[0].date` is the canonical sort key (`effectiveDate()` in `src/lib/dates.ts`); the *last* entry's date is the end of the rendered range.
- One-shot projects use a single-entry array.
- `formatDateRange(periods, ongoing)` renders `"Jan 2023"`, `"Jan 2023–May 2024"`, or `"Since Jan 2023"` (when `status === "ongoing"`).
- When `periods.length > 1`, the project detail page renders the full list under the thumbnail with each entry's optional `label` — that's the visible "project history" treatment.

## Design Language

The site's aesthetic is "lightly aged paper" — restrained, flat, content-forward. Color and visual interest come from project thumbnails, not chrome. Concretely:

- **No fills by default.** UI elements (cards, navbar, hero blocks) sit on the paper background. Tag pills are the explicit exception — they use a hue-tinted fill (see [Tag colors](#tag-colors)).
- **Hairline borders, never shadows.** Use `border-rule` for ambient lines and `border-rule-strong` for emphasized edges (thumbnails, tag outlines).
- **Sharp corners.** No `rounded-*` classes anywhere.
- **Hover is where visual feedback lives.** Links underline, card borders darken, thumbnails scale slightly. Tags lift on hover (translate-y); the exception is the selected-tag chip strip above the filter input, where pills drop on hover to signal "click to remove". Selection is communicated by *presence in that strip*, not by per-row lift state. The WIP marker is static.
- **WIP treatment.** Dashed border on the thumbnail + a subtle `· WIP` text marker. No warning banner.

Theme tokens live in `src/styles/global.css` under `@theme`:
- `--color-paper` / `--color-paper-deep` — backgrounds
- `--color-ink` / `--color-ink-muted` — text
- `--color-rule` / `--color-rule-strong` — borders
- `--color-success` / `--color-warning` / `--color-error` — status indicators only (the `LiveGreeting` status dot, contact-form field/error states). These are the lone exception to "no color in the chrome" -- they signal state, not decoration. Use the `text-*` / `bg-*` / `border-*` utilities, not raw Tailwind palette colors (e.g. `bg-error`, not `bg-red-500`).
- `--font-sans` (Source Sans 3) for body, `--font-serif` (Source Serif 4) for headings
- `--breakpoint-xs: 480px` — custom intermediate breakpoint; use `xs:` prefix in Tailwind classes

Dark mode is implemented via `@custom-variant dark (&:where(.dark, .dark *))`. All color tokens have dark overrides in `:root.dark {}`. The toggle is `DarkModeToggle.astro`; preference is stored in `localStorage`.

## Components

### Astro vs. Svelte split
Two components exist in both flavors — `TagPill` and `ProjectThumbnail`. The split is intentional: static use sites (detail-page hero, related cards) use the `.astro` form; interactive use sites (the timeline filter island) use the `.svelte` form. Don't gate render branches on optional props inside a single component — keep static and interactive as separate files so the build doesn't ship Svelte runtime to pages that don't need it.

### Astro components
- `Layout.astro` — wraps the page in `<html>`, includes `<ClientRouter />` for view transitions. Renders `Footer`, `GoToTop`, and `DarkModeToggle` for every page. Body is `min-h-screen flex flex-col` with a `flex-1` slot wrapper so `Footer` sticks to the bottom on short pages.
- `Navbar.astro` — top bar. **Not rendered on `/`** (the hero carries the brand there). The `tab` prop is `NavTabId` and the tabs are config-driven from `NAV_TABS` in `src/data/nav.ts` (currently Projects · Gallery · About) -- adding a tab there, plus its `nav-<id>` name to the view-transition selector lists in the `<style>`, is all that's needed. Layout is **one centered `flex flex-wrap` row** (no grid): the brand + every tab as a single cluster, so symmetry is automatic at any width. Index pages render brand + all tabs as siblings (active tab is a bold `aria-current` span, the rest links). Detail pages (`projectTitle` set) render a non-breaking `Home <active-tab> /` breadcrumb prefix, then the bold title (`isWip` adds a `· WIP` suffix, since the article `<h1>` is `sr-only`), then the remaining tabs -- title + remaining tabs wrap naturally (no forced `basis-full`). Each tab keeps a stable `nav-<id>` view-transition name across both modes so it morphs between the bold span and the link on navigation. The brand is the **`Icon.svg` "OS" monogram** rendered as an Astro SVG component (`href="/"`, `aria-label="Home"`, `transition:name="nav-brand"`); it uses `brandClass` (opacity-dip on hover) instead of `linkClass` since underline-on-hover doesn't read on a glyph. View transitions: `::view-transition-group(nav-*)` runs 400ms with `cubic-bezier(0.4, 0, 0.2, 1)` for the position morph; `::view-transition-old/new` runs 150ms for the crossfade; honors `prefers-reduced-motion`. **Mobile-only condense-on-scroll** (< 640px): scrolling down hides everything but the active label and shrinks padding; scrolling up or tapping restores it. Uses a hysteretic gate (`COLLAPSE_ENABLE`/`DISABLE`) so short pages don't oscillate. The header is *not* `transition:persist`, so the tap handler re-binds on `astro:page-load` (window/mql listeners bind once via a `__navScrollBound` flag).
- `FeaturedCard.astro` — homepage tile. Whole card is one `<a>`; do not nest anchors inside it. Width-agnostic by default; the home page sizes it via `class="w-88 max-w-full"` on each instance inside a `flex flex-wrap justify-center` container, which gives fixed-width cards with an incomplete last row centered (CSS Grid auto-fill can't do the per-row centering). **Trailer-style content**: thumbnail, italic-muted summary lead, date. No tags — tags live on `/projects` and the article hero.
- `RelatedCard.astro` — bordered card variant used in the "Related" section at the bottom of a project detail page. Thinner than `FeaturedCard`, includes the date label.
- `ProjectThumbnail.astro` — static thumbnail box (aspect-video, strong border). Resolves via `findThumbnailImage(slug)` and renders with `<Image widths={[640,1280]}>` for Sharp srcset; falls back to a diagonal-hatch SVG. Accepts `loading?: "lazy" | "eager"` (default `"lazy"`); pass `loading="eager"` for above-the-fold callsites — `fetchpriority="high"` is set automatically. Used by `FeaturedCard`, `RelatedCard`, and the detail-page hero.
- `TagPill.astro` — anchor-form tag pill. `href` is required (it's always a link, typically to `/projects?tags=<tag>`). Hue comes from `src/data/tag-colors.json`.
- `ProjectLinks.astro` — shared GitHub/Live link row with icons. Pass `links={project.data.links}`. Renders nothing if both are absent. Accepts a `class` prop for layout overrides.
- `PersonalLinks.astro` — GitHub / LinkedIn / Email / Resume row. URLs are hard-coded inside the component (single source of truth). Props: `size?: 'sm' | 'lg'` (lg = hero, sm = footer), `class?: string`. External links + the resume PDF open in a new tab; `mailto:` opens in the OS handler.
- `YouTube.astro` (`src/components/mdx/`) — `not-prose` lazy YouTube embed (`youtube-nocookie.com`). Props: `id` (video ID), optional `title`, optional `start` (seconds). Imported from MDX bodies, e.g. `import YouTube from "../../components/mdx/YouTube.astro"` then `<YouTube id="..." title="..." />`.
- `Figure.astro` (`src/components/mdx/`) — `not-prose` article-body image + caption wrapper. Props: `src` (a **filename string**, e.g. `"diagram.png"` — resolved against `src/assets/**` by `findArticleImage()`, **no import needed**; pass `"<slug>/diagram.png"` to disambiguate when a basename isn't unique), `alt`, optional `caption` (rendered as centered italic `figcaption`), optional `widths` / `sizes` / `loading` / `class` overrides (defaults: `[640,960,1280]`, `(max-width: 720px) 100vw, 720px`, `"lazy"`). Renders the resolved `ImageMetadata` through Astro's `<Image>` (Sharp srcset at build time) with a `border-rule-strong`. Throws at build if the filename matches no file or is ambiguous. Use for in-article images that aren't gallery items; e.g. `import Figure from "../../components/mdx/Figure.astro"` then `<Figure src="diagram.png" alt="..." caption="..." />`.
- `StaticGreeting.astro` (`src/components/mdx/`) — static greeting viewer for embedded "past example" sections. Reads assets from `src/assets/daily-greeting-generator/` via eager globs. Props: `date` (display string), `greetingFile` (`.txt`), optional `coverArtFile`, `albumTooltip`, `audioFile`, `pipelineLogFile`, `executionLogFile`. Used inside `<GreetingFallback>` to show a historical example when the live demo is unavailable.
- `Footer.astro` — site-wide footer, rendered by `Layout.astro` for every page. Top hairline border, centered `PersonalLinks` + a "Contact form" link (→ `/about#contact`, the anchored `<section>` in `ContactForm.svelte`) + copyright line. **Self-suppresses `PersonalLinks` on `/`** since the home hero already carries them at `size="lg"`; the Contact-form link shows on every page (it's a distinct affordance from the `PersonalLinks` mailto).
- `GoToTop.astro` — fixed-position scroll-to-top button (`bottom-14 right-4`, above the dark-mode toggle). Hidden until `window.scrollY > 300`. Uses `transition:persist` so it survives view transitions; the binding script is idempotent (`data-bound` flag) and also re-binds on `astro:page-load`.
- `DarkModeToggle.astro` — fixed-position button (`bottom-4 right-4`) that toggles `.dark` on `<html>` and persists preference to `localStorage`. Uses `transition:persist` so it survives view transitions. Shows moon in light mode, sun in dark mode.

### Svelte components (interactive islands)
- `ProjectsTimeline.svelte` — the `/projects` page body. Loaded with `client:load` so the filter is interactive on first paint. Owns the filter state (selected-tag `SvelteSet`, OR/AND `mode`), derives `allTags` from the projects prop, and computes `filteredProjects` and the row stream; the filter UI itself is delegated to `TagFilter.svelte`. Key behaviors:
  - Tag selection lives in a `SvelteSet<string>` (don't wrap it in `$state` — the proxy breaks `.add/.delete` reactivity). The Set is passed by reference to `TagFilter`, which mutates it in place; both sides observe the same reactive object.
  - `mode` is `"or" | "and"` and is bound to `TagFilter` via `$bindable` so the child can toggle ANY/ALL while the parent reads it for filtering.
  - Year labels are computed in `$derived.by` (block form) because the per-row "is this the first row of a new year?" flag needs an accumulator the single-expression form can't carry.
- `TagFilter.svelte` — the typeahead filter island. Owns the input, dropdown of candidate tags, selected-tag chip strip, ANY/ALL toggle, and clear-X. Key behaviors:
  - URL is the source of truth: `?tags=a,b&mode=and`. Seeds state at init (wrapped in a `seedFromUrl()` function so Svelte treats the prop access as a closure read, not a top-level reactive capture that would warn with `state_referenced_locally`), then re-syncs on both `popstate` and `astro:page-load` (the latter required — under `ClientRouter`, the island may be re-instanced *without* the mount path re-running, leaving a hole). Writes back via `history.replaceState` so toggling tags doesn't pollute history.
  - Matching is substring with a prefix-rank tier (`matchTags()`). Fuzzy was explicitly rejected — at this tag count, fuzzy produces noisy results on short tokens.
  - Already-selected tags are filtered out of the candidate pool; they reappear if deselected. Empty query shows the full unselected pool so the dropdown doubles as a tag browser.
  - Outside-click + Escape close the dropdown; ArrowUp/Down navigates `highlightedIndex`, Enter selects, the input keeps focus after each selection for chained adds. The mode toggle only renders at `selectedTags.size >= 2`; clearing back below 2 forces `mode = "or"`.
- `TagPill.svelte` — button-form tag pill used inside the filter UI and per-row tags. Props: `tag`, `onclick`, `class?`. Lift/hover behavior is applied by callers via the `class` prop (the pill keeps `transition-transform` so external transforms animate smoothly) — this lets the timeline rows, selected chip strip, and dropdown each compose their own lift treatment without forking the component. The hue lookup uses `$derived` (not `const`) because Svelte may reuse instances inside `{#each}` and `const` evaluates once at init.
- `ProjectThumbnail.svelte` — used inside the timeline rows so the thumbnail and its `<a>` wrapper participate in the row's reactive layout. `aria-hidden + tabindex=-1` because the title link below is the canonical, named link for screen readers.
- `LiveGreeting.svelte` (`src/components/mdx/`) -- `client:load` island on the daily-greeting-generator page. Fetches `/api/greeting` (JSON metadata) from the greeting Worker, then renders cover and audio from `/api/greeting/cover?d=${data.date}` and `/api/greeting/audio?d=${data.date}` -- the date query is the cache-busting key (see [Caching strategy](#greeting-worker-route)). Three states: loading, success, offline. Status dot: green = today's greeting loaded, yellow = data is stale (date mismatch, `isStale()`), red = fetch failed. Caption shows `syncedAgo(lastSynced)` when fresh, short date when stale. `todayYMD` is computed once at module load (UTC) and reused -- don't recompute it inside `isStale()` or you'll drift. In dev, mocks data immediately from `src/data/daily-greeting.json`; `?greeting=offline` exercises the offline state and `?greeting=stale` rewrites `data.date` to a historical day to trigger the yellow dot. Optional `devCoverSrc` / `devAudioSrc` props let the page pass local fallback URLs so the cover and audio render under `npm run dev` without the Worker. Dispatches `CustomEvent('greeting:live')` on `document` on success so `GreetingFallback` can hide itself. `formatDate(ymd, short?)` and `isStale()` use `getUTC*` throughout.
- `GreetingFallback.svelte` (`src/components/mdx/`) — Svelte 5 snippet wrapper. Renders `{@render children()}` until a `greeting:live` event fires on `document`, then hides. Used to wrap the static "A past example" section so it disappears when live data loads. Uses `Snippet` type and `{ once: true }` listener.
- `ContactForm.svelte` -- `client:load` island at the bottom of `/about`; POSTs to `/api/contact` (see [Contact form route](#contact-form-route-apicontact)). States: idle / sending / success / error. Validates with the shared `contactSchema.ts` as a pre-check (pure UX -- the server re-validates), maps per-field zod codes and the endpoint's top-level error codes to copy. Renders the **Turnstile** widget via a `$effect` keyed on the container `bind:this` so the widget's lifecycle tracks the form: success swaps the `<form>` out (cleanup runs `turnstile.remove`), "Send another" re-renders it (fresh widget) -- don't move this back into `onMount`, which only fires once and leaves the second render widget-less. The token is read inside the submit `try` (a stale-widget `getResponse` can throw). Error state shows an obfuscated `mailto:` escape hatch. a11y: success block is `role="status"` with focus moved to its heading; per-field `aria-invalid` + `aria-describedby`.

## Helpers & Assets

- `src/lib/dates.ts` — `monthYear(date)`, `effectiveDate(periods)` (sort key = first period's date), and `formatDateRange(periods, ongoing)` (`"Jan 2023"`, `"Jan 2023–May 2024"` with en-dash, or `"Since Jan 2023"`). All use `getUTC*` to avoid local-timezone date drift.
- `src/lib/thumbnails.ts` — thumbnails live at `src/assets/thumbnails/<slug>.{png,jpg}`. Exports `findThumbnailImage(slug): ImageMetadata | null` (for `.astro` `<Image>` use) and `findThumbnailPath(slug): string | null` (hashed URL for Svelte props). Uses **two separate globs**: one without `?url` for `ImageMetadata`, one with `{ query: "?url" }` for the URL string. **Gotcha:** `ImageMetadata.src` from a plain glob is a dev-only `/@fs/...` URL — always use the `?url` glob when you need a URL that works in production (e.g. props passed to `client:load` islands, OG image tags).
- `src/lib/articleImages.ts` — `findArticleImage(src)` resolves an in-article image to `ImageMetadata` from a bare filename or `<slug>/file` path, via an eager glob over `src/assets/**` (thumbnails dir excluded). Powers `<Figure>` so MDX authors reference images by filename without an import. Throws on ambiguous bare filenames.
- `src/lib/contactSchema.ts` -- single source of truth for the contact form's field shape + bounds, shared by `ContactForm.svelte` (client pre-check) and `/api/contact` (server authority). Exports the zod `ContactSchema`, `CONTACT_LIMITS` (the `maxlength`/bounds numbers -- keep the form's `maxlength` attrs derived from these), the `ContactInput` type, and `fieldErrorsFrom(ZodError)` which collapses issues into a `{field: code}` map both ends render from. Uses `astro/zod` (`z.email()`, not the deprecated chained `.email()`).
- `src/lib/gallery.ts` — `loadGalleryItems()` walks every project that has at least one image at `src/assets/<slug>/*.{jpg,jpeg,png,webp,avif}` and returns `{ key, image, project }` triples. Also exports `shuffleSeeded` (Mulberry32 PRNG) so the gallery order is deterministic per build but reshuffles when the asset set changes.
- `src/lib/galleryLayout.ts` — `justifiedRows()` packs items by aspect ratio into full-width rows ("flexbin" / justified-rows). The algorithm only chooses *which* items go in which row; per-row dimensions are CSS-driven (`aspect-ratio` on the row + `flex-grow` on items) so resizing the viewport is instant and doesn't re-run the algorithm. Defaults assume the page's `max-w-6xl + px-12` container (1056px inner) — update `DEFAULT_CONTAINER_WIDTH` here if the gallery's chrome ever changes.
- `src/data/tag-colors.json` — see [Tag colors](#tag-colors).
- `src/assets/Icon.svg` — "OS" serif monogram, imported as an Astro SVG component (`import Icon from "../assets/Icon.svg"; <Icon class="w-8 h-8" />`).
- `src/assets/<slug>/` — gallery images for a project (any combination of `.jpg/.jpeg/.png/.webp/.avif`). Discovered by `loadGalleryItems()`.
- `resume/resume.tex` → `public/files/Oscar-Stomberg-Resume.pdf` — source of truth is the LaTeX file; run `npm run build-resume` locally to regenerate the PDF and copy it into `public/files/`. The PDF is committed because Cloudflare's build env has no `pdflatex` (no `prebuild` hook). All build artifacts in `resume/` (`.aux`, `.log`, `.out`, `.pdf`, `.synctex.gz`) are gitignored except `resume.tex`.

## Tag Colors

Tag pills are tinted by a hue value in `src/data/tag-colors.json`:

```json
{
  "_orphaned": ["scripting"],
  "astro": 215,
  "cad": 55,
  "tools": null
}
```

- Numbers are degrees on the oklch hue wheel (`0–360`). The CSS in `global.css` (`.tag-color { --hue: <n>; }`) derives background, border, and text from one `--hue` so light/dark mode both stay legible.
- `null` → the tag renders as the neutral grey pill (`.tag-grey`). Use `null` for tags that don't yet have a natural color slot.
- `_orphaned` is the parking lot: tags previously seen in frontmatter but no longer referenced. Hue is preserved so a tag that comes back doesn't lose its assignment.

### `npm run preprocess` (scripts/sync-tags.ts)
Reconciles `tag-colors.json` with the live set of tags in frontmatter:
- New tags in frontmatter → added with hue `null`.
- Tags no longer in any frontmatter → moved to `_orphaned` (hue preserved).
- Tags in `_orphaned` that reappear in frontmatter → restored.

Run this whenever you add/remove tags from a project's frontmatter. The script does not auto-pick hues — pick them manually so visually adjacent tags don't end up at adjacent hues.

## Gallery (`/gallery`)

Photo gallery rendered from images at `src/assets/<slug>/*.{jpg,jpeg,png,webp,avif}`. Every image links back to its project's detail page.

- **Discovery:** `loadGalleryItems()` walks the asset glob at build time; any image whose `<slug>` matches a non-`hidden` project becomes a gallery item. Images for hidden or unknown slugs are dropped.
- **Order:** deterministic shuffle via `shuffleSeeded` (Mulberry32, fixed seed). Same set of files → same order, every build.
- **Layout:** `justifiedRows()` packs items by aspect ratio. Each row renders as a flex row with a CSS `aspect-ratio` equal to the sum of item ARs; items use `flex-grow: <ar>` so they fluidly scale with the row's actual width. The *last* row is capped to its natural width so it doesn't stretch lonely tiles across the full container. Below `--breakpoint-xs` (480px) the layout falls back to stacked full-width tiles — at that width the row tiles shrink below the readability threshold.
- **Images:** rendered through Astro's `<Image>` with explicit `widths` and a 3-tier `sizes` attribute, so Sharp generates a proper srcset at build time. Hover reveals a paper-gradient scrim with title + summary.

## Article Typography

Markdown and MDX bodies on project detail pages render inside `<article class="prose prose-paper">`. The `prose-paper` utility (in `global.css`) overrides Tailwind Typography's color variables with paper/ink tokens and adds two structural overrides: sharp corners on `pre`/`code`/`img`, and a cleaner inline-code treatment (no backtick pseudo-elements, paper-deep tint). Everything else is the Typography plugin's defaults — resist re-styling individual elements unless there's a real reason. Components imported into MDX (e.g. `YouTube`) should set `not-prose` on their outermost wrapper so prose styles don't bleed in.

## Page Layouts

- **Home (`/`)** — name + tagline + featured project grid + link to `/projects` + `PersonalLinks size="lg"`. Site-under-construction badge in the corner.
- **Timeline (`/projects`)** — reverse-chronological list keyed by `effectiveDate(periods)`. Rendered entirely by the `ProjectsTimeline.svelte` island so tag filtering can be interactive without a round-trip. Year labels on the left, hairline timeline rule in the middle, entries on the right; the first entry of each new year (post-filter) gets extra top padding. The page-level `.astro` file only loads the collection, projects each entry down to a serializable `ProjectRow`, and hands it to the island.
- **Project detail (`/projects/[slug]`)** — hero (thumbnail, period history or compact date label, status/tags row, `ProjectLinks`, italic summary lead) above a hairline rule, then article body, then a "Related" block if `related: [...]` is set. The `<h1>` is `sr-only` because the navbar already announces the title. `getStaticPaths` deliberately includes `hidden` projects so direct links still work — only the index/timeline/gallery filter them out.
- **Gallery (`/gallery`)** — see [Gallery](#gallery-gallery) above.
- **About (`/about`)** — short bio in a `prose prose-paper` block, then the `ContactForm.svelte` island (`client:load`) at the bottom. The form POSTs to the SSR `/api/contact` endpoint -- see [Contact form route](#contact-form-route-apicontact).

## Project Page Content Structure

Suggested section order for the markdown body of a project page:

1. What & why
2. Role & contribution (especially for team projects)
3. Technical details: stack, architecture, decisions, code snippets
4. Outcomes & reflection
5. Where it's going (WIP only)

Related-project links and external links (GitHub/Live) are surfaced by the page chrome, not the markdown body.

## Open Decisions

- **`FeaturedCard` nested anchors.** The whole card is currently a single `<a>`. Adding `ProjectLinks` inside it would produce invalid nested anchors. Resolve before reusing `ProjectLinks` in the card.
- **Long/short titles.** Some project titles may need a separate display title vs. nav title; deferred.
- **Tag taxonomy.** Flat — tags span domain, tech, and skill categories freely. The `/projects` filter is the only UI for them.
- **Hue assignment for new tags.** `sync-tags.ts` deliberately doesn't auto-pick hues — manual assignment in `tag-colors.json` is the source of truth.