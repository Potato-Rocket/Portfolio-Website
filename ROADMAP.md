# Roadmap

## Issues

- Certain thumbnails have wonky rotation info (e.g. robot chute, digital waste) likely from heic -> jpg and such. This only matters for astro thumbnails, i.e. in the details page (though if we included thumbnails in gallery that would also be a problem). Not urgent but kind of weird--and we don't want to screw up the thumbnails either.

## Content prep

- **Hanover CMS demo readiness.** The project page can't go public until proprietary data and client branding are scrubbed from anything embedded or screenshotted. Requires coordination with teammates — email going out tonight. Risk is low for now (no login details exposed), but the page shouldn't be linked, featured, or included in any sitemap until the scrub is signed off by the team.
- **Star Map.** Was not REALLY left in a functional state. Needs to be rescued.

### Per-project content status

One entry per project page. Mark as `done`, `partial`, `pull-in` (existing material elsewhere — old write-ups, repo READMEs, photos — that I can have Claude pull in and adapt), or `write` (needs fresh writing).

- [x] **frc-robot-chute** — done
- [x] **imagepy** — done
- [x] **portfolio** — done
- [x] **waste-scale** — done
- [x] **plant-datalogger** — done
- [x] **solar-system-simulator** — done
- [x] **synthetic-word-generator** — partial, come up with thumbnail
- [x] **wpi-schedule-importer** — partial, (text only; take pictures of calendar and example xlsx when available)
- [ ] **daily-greeting-generator** — partial
- [ ] **slab-flattening-jig** — write; pull-in from report materials (YouTube embed already in place, body empty)
- [ ] **hanover-cms** — write; blocked on demo scrub (see above); pull-in from team progress reports
- [ ] **pythagoras-tree** — write; need to run and capture screenshots
- [ ] **gridfinity-bins** — write; need to add more images
- [ ] **towers** — write; pull in game rules; need to run and take screenshots
- [ ] **drone-frame** — write; need to get OLD images/dates from dad
- [ ] **cubeish** — write; attach old .exe; record and post gameplay video
- [ ] **tower-crunch** — write; attach old .exe; record and post gameplay video
- [ ] **star-map** — write; need to run, fix or revert to working branch, take screenshots
- [ ] **selfhosting** — write; need to generate diagrams

## Planned features

1. **Project discoverability.** Tag filter has a typeahead now. Remaining additions, in rough priority order:
   - Fuzzy search over project metadata (title, summary, tags). Client-side index, no infra.
   - Full-text search over article bodies via Pagefind (runs at build time).

   Semantic search is overkill at portfolio scale — skip unless project count grows a lot.

2. **Interactive article features.**
   - Image carousel for projects with extra in-article images (decide whether it should diverge from the gallery treatment).

3. **Daily greeting generator.** Two separate threads:
   - Visual refresh of the GG itself to match this site's UI rules (work in the GG repo).
   - Surface GG output inside the portfolio via the live backend (see item 4).

4. **Live Greeting Backend.** Full architecture is documented in the architecture plan. Three new repos/directories, implemented in this order:

   **Repo/directory layout:**
   - Go server source lives in the greeting generator repo as a subdirectory (`server/` or `greeting-server/`). Multi-stage Docker build (`golang:1.22` → `alpine`), mounted read-only volume.
   - `cloudflared` is a service inside `compose/daily-greeting/` in the selfhosting repo (not its own stack). Move to its own stack if a second demo is ever added.
   - `greeting-worker` is a new standalone repo (Cloudflare Worker, TypeScript, `wrangler deploy`).
   - `LiveGreeting.svelte` lives in this repo at `src/components/mdx/`.

   **Implementation order:**
   1. ~~**Go server** (greeting generator repo, `server/` subdir) — `net/http`, no framework; `GET /api/greeting/latest` (metadata JSON) + `GET /files/<filename>` (static files) from the greeting output dir.~~ ✓
   2. ~~**Tunnel** — add `cloudflared` service to `compose/daily-greeting/`; exposes Go server at `demo.oscar.stomberg.us`. Outbound-only, no open ports.~~ ✓
   3. ~~**`greeting-worker`** (new repo) — hourly cron: pull from tunnel → KV (metadata) + R2 (audio, cover art). Fetch handler: serve `GET /api/greeting`, `/api/greeting/audio`, `/api/greeting/cover` from KV/R2 at `oscar.stomberg.us/api/greeting/*`. `TUNNEL_ORIGIN` stored as Wrangler secret.~~ ✓
   4. ~~**`LiveGreeting.svelte`** (this repo, `src/components/mdx/`) — `client:load` island; renders greeting text + cover art + audio player + `lastSynced` timestamp. Degrades gracefully if fetch fails.~~ ✓

5. **SEO and metadata.** *Deferred until all content pages are populated — premature to optimize discoverability while the catalog is still half-empty.* OG/meta tags, sitemap (`@astrojs/sitemap`), robots.txt, canonical URLs. Open question: per-project OG images — templated card (thumbnail + title + tags, pre-rendered at build via Satori or similar), or just reuse the existing thumbnail?
