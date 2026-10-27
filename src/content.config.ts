import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
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
  // One file for all tags, keyed by tag id.
  loader: file('src/content/tags.json'),
  schema: z.object({
    label: z.string(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #rrggbb color'),
    description: z.string().optional(),
    // Free-form grouping labels; categories exist only by being named here.
    categories: z.array(z.string().trim().min(1)).default([]),
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

const eras = defineCollection({
  // Hand-maintained, contiguous list: each era starts where the previous one ends.
  loader: file('src/content/eras.json'),
  schema: z
    .object({
      label: z.string(),
      start: z.number().int(), // inclusive
      end: z.number().int(), // exclusive
    })
    .refine((e) => e.start < e.end, { message: 'start must be before end' }),
});

// Hand-picked starting points for the compare view.
const featured = defineCollection({
  loader: file('src/content/featured.json'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(reference('tags')).min(2),
    from: z.number().int().optional(),
    to: z.number().int().optional(),
  }),
});

export const collections = { tags, entries, eras, featured };
