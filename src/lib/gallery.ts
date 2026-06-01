import { getCollection, type CollectionEntry } from "astro:content";
import { projectAssetImages } from "./projectAssets";

export type GalleryItem = {
  key: string;
  image: ImageMetadata;
  project: CollectionEntry<"projects">;
};

export async function loadGalleryItems(): Promise<GalleryItem[]> {
  const projects = await getCollection("projects", ({ data }) => !data.hidden);
  const bySlug = new Map(projects.map((p) => [p.id, p]));

  const items: GalleryItem[] = [];
  for (const [path, mod] of Object.entries(projectAssetImages)) {
    // Gallery only wants top-level <slug>/<file> images; the shared glob is
    // `**` so deeper paths (and non-project folders) are filtered out here.
    const match = path.match(/^\/src\/assets\/([^/]+)\/([^/]+)$/);
    if (!match) continue;
    const [, slug, filename] = match;
    const project = bySlug.get(slug);
    if (!project) continue;
    items.push({ key: `${slug}/${filename}`, image: mod.default, project });
  }
  return items;
}

// Deterministic per build: a fixed seed gives the same order every time so layout
// doesn't reshuffle on reload, but the build re-derives it if the asset set changes.
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded<T>(arr: readonly T[], seed = 0x9e3779b9): T[] {
  const out = [...arr];
  const rng = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}