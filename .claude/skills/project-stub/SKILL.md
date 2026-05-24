---
name: project-stub
description: Create a new project stub `.md` file in `src/content/projects/`. Use this skill whenever the user says "add a stub for X", "stub out Y", "create a project entry for Z", "get stubs up", or wants to initialize one or more project pages from the inventory. Proactively use it when the user is working through the project inventory list and a project doesn't have a file yet.
---

# Project Stub Skill

Your job is to create well-formed stub markdown files for one or more projects. Each stub gets a complete frontmatter block and section headers — the body content is all `TODO` for now.

## Project Inventory

These are the projects Oscar intends to have in the portfolio, organized by display tier. Use this as the source of truth for tags, slugs, and expected status, though this may be altered based on more specific project context:

**Large tiles (featured)**
- `selfhosting` — Selfhosting Infrastructure · `infrastructure`, `devops`, `linux`, `docker` · ongoing
- `hanover-cms` — Hanover Insurance CMS · `web`, `fullstack`, `react`, `typescript` · complete (NDA: no screenshots)
- `solar-system-simulator` — Solar System Simulator · `java`, `graphics`, `physics`, `simulation` · complete

**Medium tiles**
- `synthetic-word-generator` — Synthetic Word Generator · `python`, `data`, `nlp` · complete
- `daily-greeting-generator` — Daily Greeting Generator · `python`, `docker`, `homeassistant`, `llm` · complete
- `wpi-schedule-importer` — WPI Class Schedule Importer · `python`, `tui`, `tools` · complete
- `plant-datalogger` — Plant Datalogger · `embedded`, `c`, `rp2040`, `hardware` · wip
- `frc-robot-chute` — FRC Robot Chute · `cad`, `fabrication`, `laser-cutting` · complete

**Small tiles**
- `ha-light-controller` — HA Light Controller · `embedded`, `homeassistant`, `hardware` · wip
- `subwoofer-build` — Subwoofer Build · `fabrication`, `cnc`, `woodworking` · wip
- `star-map` — Star Map · `simulation`, `graphics` · wip · related: `solar-system-simulator`
- `imagepy` — Color Palette Extractor (ImagePy) · `python`, `image-processing` · complete
- `unity-games` — Unity Games · `gamedev`, `unity`, `csharp` · complete (no GitHub)
- `slab-flattening-jig` — Slab Flattening Jig · `cad`, `solidworks` · complete
- `gridfinity-bins` — Gridfinity Bins · `cad`, `3d-printing`, `laser-cutting` · complete
- `portfolio` — This Portfolio · `web`, `astro`, `typescript` · ongoing

## Frontmatter Schema

```yaml
title: "Human-readable title"
summary: "One sentence describing the project. Written like copy, not a README header."
status: complete        # complete | wip | ongoing
featured: false         # true only for large tiles
tags:
  - tag1
links:
  github: https://github.com/Potato-Rocket/...   # omit if no repo
  live: https://...                               # omit if no live URL
related:
  - other-slug          # omit if none
periods:
  - date: YYYY-MM-DD
    label: Optional label   # omit label for single-period projects
```

Rules:
- `status: wip` means actively in progress; `ongoing` means indefinitely maintained; `complete` means done.
- `featured: true` only for the three large-tile projects.
- If you don't know the GitHub URL, omit the `links` block entirely rather than leaving a placeholder.
- For `periods`: if you don't know the real history, use a single entry with a rough date and no label. Prefer the `/project-timeline` skill when user wants an accurate history.
- The slug is the filename (without `.md`). Match the inventory slugs above exactly.

## Stub Template

```markdown
---
title: Title Here
summary: One sentence summary here.
status: complete
featured: false
tags:
  - tag1
  - tag2
links:
  github: https://github.com/Potato-Rocket/...
periods:
  - date: YYYY-MM-DD
---

## Overview

TODO

## What & Why

TODO

## Technical Details

TODO

## Outcomes

TODO
```

For `status: wip` or `status: ongoing`, add a fifth section at the end:

```markdown
## Where It's Going

TODO
```

## Steps

1. **Identify what to create.** The user may name one project, a list, or say "all the missing ones." If they say all/batch, check which slugs already have files in `src/content/projects/` and skip those.

2. **Gather metadata.** For each project:
   - Cross-reference the inventory above for tags, status, and featured flag.
   - Ask the user only for things you can't derive: GitHub URL, approximate date, any known `related` slugs beyond what's listed. Keep questions tight — one question per unknown, not a form.
   - If creating multiple stubs at once, batch your questions rather than asking per-project.

3. **Write the files.** Create `src/content/projects/<slug>.md` for each project. Use the template above. Don't write content in the `TODO` sections — that's for later.

4. **Remind about thumbnails.** After writing, note: "Add a thumbnail at `public/thumbnails/<slug>.png` — the timeline and card will show a blank/broken image until then."

5. **Run `astro check`.** After writing, run `npx astro check` to catch any schema validation errors (bad dates, missing required fields, etc.). Fix before reporting done.