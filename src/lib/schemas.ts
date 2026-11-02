// Content schemas shared by the site (src/content.config.ts) and the admin tool (admin/).
// Keep this file free of `astro:*` imports so plain Node can load it.
import { z } from 'astro/zod';

// Historical years: negative = BCE, and there is no year 0 (1 BCE is -1, 1 CE is 1).
export const historicalDate = z
  .object({
    year: z.number().int().refine((y) => y !== 0, 'There is no year 0; use -1 for 1 BCE'),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
    circa: z.boolean().default(false),
  })
  .refine((d) => d.day === undefined || d.month !== undefined, {
    message: 'A day requires a month',
  });

/** Translations sit next to the English source, keyed by locale. English is the source of truth. */
const translated = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ es: z.object(shape) }).partial().optional();

export const tagFields = z.object({
  label: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #rrggbb color'),
  description: z.string().optional(),
  // Free-form grouping labels; categories exist only by being named here.
  categories: z.array(z.string().trim().min(1)).default([]),
  translations: translated({ label: z.string(), description: z.string().optional() }),
});

/** Entry frontmatter minus `tags`, which the site validates as references. */
export const entryFields = z.object({
  title: z.string(),
  summary: z.string().max(280),
  date: historicalDate,
  end: historicalDate.optional(),
  // Where the claim can be checked. http(s) only, because these render as links.
  sources: z
    .array(z.string().url().refine((u) => /^https?:\/\//i.test(u), 'Use an http(s) URL'))
    .default([]),
  translations: translated({ title: z.string(), summary: z.string().max(280) }),
});

export const eraFields = z
  .object({
    label: z.string(),
    start: z.number().int(), // inclusive
    end: z.number().int(), // exclusive
    translations: translated({ label: z.string() }),
  })
  .refine((e) => e.start < e.end, { message: 'start must be before end' });

export const featuredFields = z.object({
  title: z.string(),
  description: z.string(),
  from: z.number().int().optional(),
  to: z.number().int().optional(),
  translations: translated({ title: z.string(), description: z.string() }),
});
