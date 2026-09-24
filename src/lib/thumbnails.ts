import type { ImageMetadata } from "astro";

// Thumbnails live alongside a project's other assets at
// src/assets/<slug>/thumbnail.<ext>. projectAssets.ts excludes this same
// pattern so thumbnails don't leak into the gallery or <Figure> resolution --
// keep the two globs in sync.
const thumbnailModules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/*/thumbnail.{jpg,jpeg,png,webp,avif}",
  { eager: true }
);

// Separate ?url glob so Vite emits the files as standard assets with hashed
// URLs — the plain ImageMetadata .src is a dev-only /@fs/ path that breaks
// in production Workers deployments.
const thumbnailUrls = import.meta.glob<{ default: string }>(
  "/src/assets/*/thumbnail.{jpg,jpeg,png,webp,avif}",
  { query: "?url", eager: true }
);

function findBySlug<T>(modules: Record<string, { default: T }>, slug: string): T | null {
  const prefix = `/src/assets/${slug}/thumbnail.`;
  const key = Object.keys(modules).find((k) => k.startsWith(prefix));
  return key ? modules[key].default : null;
}

export function findThumbnailImage(slug: string): ImageMetadata | null {
  return findBySlug(thumbnailModules, slug);
}

// URL string for Svelte components and JSON-serialized props
export function findThumbnailPath(slug: string): string | null {
  return findBySlug(thumbnailUrls, slug);
}