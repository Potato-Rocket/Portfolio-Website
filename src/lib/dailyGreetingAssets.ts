// Single source of truth for resolving the daily-greeting-generator's album
// cover art -- it may be re-exported as either png or jpg, so both
// StaticGreeting.astro and the project's MDX body (devCoverSrc for
// LiveGreeting) import from here instead of each hardcoding an extension.
const albumCoverModules = import.meta.glob<{ default: string }>(
  "/src/assets/daily-greeting-generator/album.{png,jpg,jpeg}",
  { query: "?url", eager: true }
);

export const albumCoverUrl = Object.values(albumCoverModules)[0]?.default;
if (!albumCoverUrl) {
  throw new Error("Missing album cover art in src/assets/daily-greeting-generator/");
}
