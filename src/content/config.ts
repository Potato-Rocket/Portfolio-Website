import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const projects = defineCollection({
  type: "content",
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
    date: z.string(),
  }),
});

export const collections = { projects };