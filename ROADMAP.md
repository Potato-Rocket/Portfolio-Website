# Roadmap

## Minor issues

- Fix projects/gallery swapping in the navbar
- Move thumbnails to assets if that can still work with SEO. Fine or good for them to be galleried.
- Provide captions to images via sidecar file? Consider options.
- 

## Content prep

- **Hanover CMS demo readiness.** The project page can't go public until proprietary data and client branding are scrubbed from anything embedded or screenshotted. Requires coordination with teammates — email going out tonight. Risk is low for now (no login details exposed), but the page shouldn't be linked, featured, or included in any sitemap until the scrub is signed off by the team.

## Planned features

1. **Project discoverability.** Tag filter has a typeahead now. Remaining additions, in rough priority order:
   - Fuzzy search over project metadata (title, summary, tags). Client-side index, no infra.
   - Full-text search over article bodies via Pagefind (runs at build time).

   Semantic search is overkill at portfolio scale — skip unless project count grows a lot.

2. **Home page iteration.** Feedback says the rest of the site should be more discoverable from the landing page. Candidate ideas in play: bigger explicit links to `/projects` and `/gallery` below the blurb, toggleable featured panel, featured grid as a carousel. Plan is to iterate visually until a direction feels right rather than pre-design.

3. **Interactive article features.**
   - Image carousel for projects with extra in-article images (decide whether it should diverge from the gallery treatment).
   - **Live demo backend behind a Cloudflare Tunnel from the home lab.** Wrap a small Python script, or surface the most recent generated daily greeting. The point is to demonstrate full-stack/devops skills, so the wiring (tunnel, connection-status indicator, graceful fallback when the backend is down) is part of the showcase, not just decoration. Maintenance burden is accepted as the cost of admission.

4. **Daily greeting generator.** Two separate threads:
   - Visual refresh of the GG itself to match this site's UI rules (work in the GG repo).
   - Surface GG output inside the portfolio — likely via the same tunneled backend as item 3, since "latest generated greeting" is the natural first thing to plug into that pipe.

5. **SEO and metadata.** *Deferred until all content pages are populated — premature to optimize discoverability while the catalog is still half-empty.* OG/meta tags, sitemap (`@astrojs/sitemap`), robots.txt, canonical URLs. Open question: per-project OG images — templated card (thumbnail + title + tags, pre-rendered at build via Satori or similar), or just reuse the existing thumbnail?
