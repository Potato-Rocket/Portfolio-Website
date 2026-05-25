import { existsSync } from "node:fs";
import { join } from "node:path";

// Returns the public path for the first thumbnail found (PNG before JPG), or null if neither exists.
export function findThumbnailPath(slug: string): string | null {
  for (const ext of ["png", "jpg"]) {
    if (existsSync(join(process.cwd(), "public", "thumbnails", `${slug}.${ext}`))) {
      return `/thumbnails/${slug}.${ext}`;
    }
  }
  return null;
}