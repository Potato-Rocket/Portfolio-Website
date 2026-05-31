# Roadmap

## Issues

- Need to center footer link wrap on mobile
- Make gallery page hover-tappable on mobile--one tap=hover, second tap=open project page, tap outside=de-hover
- `src/pages/projects/[slug].astro:35-38` uses `thumbImage.src` directly for the OG image--the thumbnails helper comment warns this is a dev-only `/@fs/` path in production. Switch to `findThumbnailPath(slug)` (the `?url`-backed variant) for the absolute URL.

## Content prep

- **Hanover CMS demo readiness.** The project page can't go public until proprietary data and client branding are scrubbed from anything embedded or screenshotted. Requires coordination with teammates--email going out tonight. Risk is low for now (no login details exposed), but the page shouldn't be linked, featured, or included in any sitemap until the scrub is signed off by the team.
- **Star Map.** Was not REALLY left in a functional state. Needs to be rescued.
- **Selfhosting.** Need to make real diagrams for it.
- **Pythagoras Tree, Towers.** Need to run and gather screenshots, also put on github with JAR releases.
- **Cubeish, Tower Crunch.** Need to install in windows, take screenshots and make gameplay videos.

### Per-project content status

One entry per project page. Mark as `done`, `partial`, `pull-in` (existing material elsewhere--old write-ups, repo READMEs, photos--that I can have Claude pull in and adapt), or `write` (needs fresh writing).

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
   - Semantic search is overkill at a portfolio scale--skip unless the project count grows a lot.
   - Consider maybe just not doing these features--more is not always better.

2. **About me and contact form** Have another tab for about me... perhaps put the contact form on the same page, below. Should have:
   - Subject/header (required)
   - Name (not required)
   - Email address (verify this, don't require)
   - Body (required--allow rich text/html input?)
   - (maybe) Project selector, with dropdown and fuzzy search--creates a section in the email body.
   - Captcha
   - Integrates with fastmail to send emails to a stomberg.us alias that forwards to a folder in my email.
 
3. **Interactive article features.**
   - Image carousel or mini-gallery for projects with extra in-article images (decide whether it should diverge from the gallery treatment).
   - Consider whether to make an image + caption wrapper component
   - 3D viewer for certain STLs? Could be a pain with limited payoff
   - For script projects consider wrapper backends that allow requests to be made (and logs streamed back perhaps). Compare to running python in a browser. Must be rate-limited
   - Consider whether to link + make available, or proxy any self-hosted things

4. **SEO and metadata.** *Deferred until all content pages are populated--premature to optimize discoverability while the catalog is still half-empty.* OG/meta tags, sitemap (`@astrojs/sitemap`), robots.txt, canonical URLs. Open question: per-project OG images — templated card (thumbnail + title + tags, pre-rendered at build via Satori or similar), or just reuse the existing thumbnail?
