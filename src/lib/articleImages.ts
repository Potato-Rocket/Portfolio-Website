import type { ImageMetadata } from "astro";

// Every project's in-article images live at src/assets/<slug>/<file>. Glob them
// eagerly so <Figure> can resolve an ImageMetadata from a bare filename (or a
// "<slug>/<file>" path) without the MDX author writing an import. The
// thumbnails dir is excluded -- those are managed separately by thumbnails.ts.
const articleImages = import.meta.glob<{ default: ImageMetadata }>(
  ["/src/assets/**/*.{jpg,jpeg,png,webp,avif}", "!/src/assets/thumbnails/**"],
  { eager: true }
);

/**
 * Resolve an article image to its ImageMetadata.
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
    return key in articleImages ? articleImages[key].default : null;
  }

  // Bare filename -- match by basename across the tree.
  const matches = Object.keys(articleImages).filter(
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
  return articleImages[matches[0]].default;
}