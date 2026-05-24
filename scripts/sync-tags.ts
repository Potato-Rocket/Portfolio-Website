import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import jsYaml from "js-yaml";

const PROJECTS_DIR = fileURLToPath(new URL("../src/content/projects/", import.meta.url));
const TAG_COLORS_PATH = fileURLToPath(new URL("../src/data/tag-colors.json", import.meta.url));
const DEFAULT_HUE = 35;

interface Frontmatter {
  tags?: unknown;
}

interface TagColors {
  _orphaned: string[];
  [tag: string]: number | string[];
}

async function extractTags(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, "utf8");
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return [];
  const fm = jsYaml.load(fmMatch[1]) as Frontmatter;
  return Array.isArray(fm?.tags) ? (fm.tags as string[]) : [];
}

async function loadExisting(): Promise<TagColors> {
  try {
    return JSON.parse(await readFile(TAG_COLORS_PATH, "utf8")) as TagColors;
  } catch {
    return { _orphaned: [] };
  }
}

const files = (await readdir(PROJECTS_DIR)).filter(f => f.endsWith(".md"));
const tagSets = await Promise.all(files.map(f => extractTags(join(PROJECTS_DIR, f))));
const projectTags = new Set(tagSets.flat());

const existing = await loadExisting();
const { _orphaned: prevOrphaned = [], ...colorEntries } = existing;

const updated: TagColors = { _orphaned: [] };
const added: string[] = [];
const nowOrphaned: string[] = [];

for (const [tag, hue] of Object.entries(colorEntries)) {
  if (projectTags.has(tag)) {
    updated[tag] = hue as number;
  } else {
    (updated._orphaned as string[]).push(tag);
    nowOrphaned.push(tag);
  }
}

for (const tag of prevOrphaned as string[]) {
  if (projectTags.has(tag) && !(tag in updated)) {
    updated[tag] = DEFAULT_HUE;
    added.push(`${tag} (restored from orphaned)`);
  } else if (!projectTags.has(tag) && !(updated._orphaned as string[]).includes(tag)) {
    (updated._orphaned as string[]).push(tag);
  }
}

for (const tag of projectTags) {
  if (!(tag in updated)) {
    updated[tag] = DEFAULT_HUE;
    added.push(tag);
  }
}

const { _orphaned: finalOrphaned, ...finalTags } = updated;
const sorted = {
  _orphaned: (finalOrphaned as string[]).sort(),
  ...Object.fromEntries(Object.entries(finalTags).sort(([a], [b]) => a.localeCompare(b))),
};

await mkdir(dirname(TAG_COLORS_PATH), { recursive: true });
await writeFile(TAG_COLORS_PATH, JSON.stringify(sorted, null, 2) + "\n");

if (added.length) console.log("Added:", added.join(", "));
if (nowOrphaned.length) console.log("Orphaned:", nowOrphaned.join(", "));
if (!added.length && !nowOrphaned.length) console.log("tag-colors.json is already in sync.");
