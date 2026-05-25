// Keyed by "/thumbnails/<slug>.<ext>" — built at Vite compile time, safe in Workers runtime.
const thumbnails = import.meta.glob("/public/thumbnails/*.{png,jpg}", { query: "?url", eager: true });

export function findThumbnailPath(slug: string): string | null {
  for (const ext of ["png", "jpg"]) {
    if (`/public/thumbnails/${slug}.${ext}` in thumbnails) {
      return `/thumbnails/${slug}.${ext}`;
    }
  }
  return null;
}