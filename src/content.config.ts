import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["complete", "wip"]),
    tileSize: z.enum(["large", "medium", "small"]),
    priority: z.number(),
    tags: z.array(z.string()),
    thumbnail: z.string().optional(),
    links: z
      .object({
        github: z.url().optional(),
        live: z.url().optional(),
      })
      .optional(),
    related: z.array(z.string()).optional(),
    date: z.coerce.date(),
  }),
});

export const collections = { projects };