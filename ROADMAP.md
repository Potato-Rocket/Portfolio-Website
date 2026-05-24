# Roadmap

## Minor improvements

1. Improve spacing on home page - things should have more room in general, as well as vertically.
2. We need the arrangement of feature cards to be revamped. Cards should be a fixed size, the max cards per row should
   be determined by the screen size. If there is an incomplete row, they should be centered. Open questrions remain
   around horizontal spacing.
3. Add external links and a resume download (private info stripped).
4. Remove thumbnail attribute - assume throughout that each project has a thumbnail called thumbnails/[slug].png. We
   could accomodate jpgs just by making a simple helper function.
5. Dark mode toggle in the bottom right corner.

## Major changes

1. Add related project links to each project page. Determine where to put them, maybe reuse feature card with small
   mode.
2. Make project timeline more sophisticated, allow to specify a list of periods with a comment. Card and entries can
   have a similar summary to what they have now, but on the page maybe we can render a timeline of say,
   Started Mar 2025, put on hold June 2025, picked back up June 2026, WIP. Or maybe that belongs in text but it could be
   cool. Consider how this should interact with ordering.
3. Have tag filtering or maybe just highlighting. This requires react integration.
4. Metadata search on the project page, similar output to the tag stuff
5. Once I have more projects listed, an arrow to bring the user to the top would be nice
6. Consider more interactive features to place in the project articles. Demo video embeds, image carousel, eventually
   maybe integrated python script execution or simply a connection to a self-hosted backend to demonstrate the output.
7. Consider updating the daily greeting generator to implement this site's UI rules, integrate either directly or via
   API only.
8. Consider direct contact form.
9. Add a gallery page, pulling from all projects' assets, presenting in a randomly ordered mosaic, with captions linking
   to the relevant project.
10. Improve SEO, robots.txt, etc.