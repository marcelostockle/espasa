import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Historical years: negative = BCE, and there is no year 0 (1 BCE is -1, 1 CE is 1).
const historicalDate = z
  .object({
    year: z.number().int().refine((y) => y !== 0, 'There is no year 0; use -1 for 1 BCE'),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
    circa: z.boolean().default(false),
  })
  .refine((d) => d.day === undefined || d.month !== undefined, {
    message: 'A day requires a month',
  });

const tags = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/tags' }),
  schema: z.object({
    label: z.string(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #rrggbb color'),
    description: z.string().optional(),
  }),
});

const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(280),
    date: historicalDate,
    end: historicalDate.optional(),
    tags: z.array(reference('tags')).min(1),
  }),
});

export const collections = { tags, entries };
