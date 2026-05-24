// Single point of change if the thumbnail format/location convention shifts
// (e.g. mixed PNG/JPG, hashed filenames, CDN prefix).
export function thumbnailPath(slug: string): string {
  return `/thumbnails/${slug}.png`;
}