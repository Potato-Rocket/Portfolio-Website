import type { ImageMetadata } from "astro";

// Single source of truth for "what counts as a project asset image": every
// image under src/assets/<slug>/ (the thumbnails dir is excluded -- those are
// managed separately by thumbnails.ts). Both the gallery (loadGalleryItems)
// and the in-article <Figure> resolver read from this one map so their notion
// of the asset set can't drift -- keep the extension list here authoritative.
export const projectAssetImages = import.meta.glob<{ default: ImageMetadata }>(
  ["/src/assets/**/*.{jpg,jpeg,png,webp,avif}", "!/src/assets/thumbnails/**"],
  { eager: true }
);

/**
 * Resolve an in-article image to its ImageMetadata.
 *
 * `src` may be either a path relative to src/assets (`"<slug>/diagram.png"`) or
 * a bare filename (`"diagram.png"`), in which case the whole asset tree is
 * searched by basename. A bare filename that matches more than one file throws
 * -- qualify it with the slug folder to disambiguate. Returns null if nothing
 * matches.
 */
export function findArticleImage(src: string): ImageMetadata | null {
  // Qualified path -- direct lookup.
  if (src.includes("/")) {
    const key = `/src/assets/${src}`;
    return key in projectAssetImages ? projectAssetImages[key].default : null;
  }

  // Bare filename -- match by basename across the tree.
  const matches = Object.keys(projectAssetImages).filter(
    (key) => key.slice(key.lastIndexOf("/") + 1) === src
  );
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error(
      `<Figure src="${src}"> is ambiguous -- matches ${matches.length} files ` +
        `(${matches.join(", ")}). Qualify it with the slug folder, e.g. ` +
        `"<slug>/${src}".`
    );
  }
  return projectAssetImages[matches[0]].default;
}
