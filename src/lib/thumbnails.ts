import type { ImageMetadata } from "astro";

const thumbnailModules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/thumbnails/*.{png,jpg}",
  { eager: true }
);

// Separate ?url glob so Vite emits the files as standard assets with hashed
// URLs — the plain ImageMetadata .src is a dev-only /@fs/ path that breaks
// in production Workers deployments.
const thumbnailUrls = import.meta.glob<{ default: string }>(
  "/src/assets/thumbnails/*.{png,jpg}",
  { query: "?url", eager: true }
);

export function findThumbnailImage(slug: string): ImageMetadata | null {
  for (const ext of ["png", "jpg"]) {
    const key = `/src/assets/thumbnails/${slug}.${ext}`;
    if (key in thumbnailModules) return thumbnailModules[key].default;
  }
  return null;
}

// URL string for Svelte components and JSON-serialized props
export function findThumbnailPath(slug: string): string | null {
  for (const ext of ["png", "jpg"]) {
    const key = `/src/assets/thumbnails/${slug}.${ext}`;
    if (key in thumbnailUrls) return thumbnailUrls[key].default;
  }
  return null;
}
