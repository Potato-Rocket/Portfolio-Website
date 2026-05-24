import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["complete", "wip", "ongoing"]),
    featured: z.boolean().default(false),
    tags: z.array(z.string()),
    links: z
      .object({
        github: z.url().optional(),
        live: z.url().optional(),
      })
      .optional(),
    related: z.array(z.string()).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
  }),
});

export const collections = { projects };