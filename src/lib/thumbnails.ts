import type { ImageMetadata } from "astro";

const thumbnailModules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/thumbnails/*.{png,jpg}",
  { eager: true }
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
  return findThumbnailImage(slug)?.src ?? null;
}