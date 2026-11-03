import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { entryFields, eraFields, featuredFields, placeFields, tagFields } from './lib/schemas';

const tags = defineCollection({
  // One file for all tags, keyed by tag id.
  loader: file('src/content/tags.json'),
  schema: tagFields,
});

const places = defineCollection({
  // Keyed by place id. Wikipedia text for each lives in place-snapshots.json, not here.
  loader: file('src/content/places.json'),
  schema: placeFields,
});

const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: entryFields.extend({
    tags: z.array(reference('tags')).min(1),
    places: z.array(reference('places')).default([]),
  }),
});

const eras = defineCollection({
  // Hand-maintained, contiguous list: each era starts where the previous one ends.
  loader: file('src/content/eras.json'),
  schema: eraFields,
});

// Hand-picked starting points for the compare view.
const featured = defineCollection({
  loader: file('src/content/featured.json'),
  schema: featuredFields.extend({
    tags: z.array(reference('tags')).min(2),
  }),
});

export const collections = { tags, places, entries, eras, featured };
