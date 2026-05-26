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
   - **Live demo backend behind a Cloudflare Tunnel from the home lab.** Wrap a small Python script, or surface the most recent generated daily greeting. The point is to demonstrate full-stack/devops skills, so the wiring (tunnel, connection-status indicator, graceful fallback when the backend is down) is part of the showcase, not just decoration. Maintenance burden is accepted as the cost of admission.

3. **Daily greeting generator.** Two separate threads:
   - Visual refresh of the GG itself to match this site's UI rules (work in the GG repo).
   - Surface GG output inside the portfolio — likely via the same tunneled backend as item 3, since "latest generated greeting" is the natural first thing to plug into that pipe.

4. **SEO and metadata.** *Deferred until all content pages are populated — premature to optimize discoverability while the catalog is still half-empty.* OG/meta tags, sitemap (`@astrojs/sitemap`), robots.txt, canonical URLs. Open question: per-project OG images — templated card (thumbnail + title + tags, pre-rendered at build via Satori or similar), or just reuse the existing thumbnail?
