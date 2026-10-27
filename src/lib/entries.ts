import { getCollection } from 'astro:content';
import { sortKey } from './time';

export async function getSortedEntries() {
  const entries = await getCollection('entries');
  return entries.sort((a, b) => sortKey(a.data.date) - sortKey(b.data.date));
}

export async function getTags() {
  const tags = await getCollection('tags');
  return tags.sort((a, b) => a.data.label.localeCompare(b.data.label));
}

export const UNCATEGORIZED = 'Other';

/** Groups tags by category; a tag appears under each of its categories. */
export function groupTagsByCategory<T extends { label: string; categories: string[] }>(
  tags: T[],
): { category: string; tags: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const tag of tags) {
    const cats = tag.categories.length ? tag.categories : [UNCATEGORIZED];
    for (const c of cats) groups.set(c, [...(groups.get(c) ?? []), tag]);
  }
  return [...groups]
    .map(([category, tags]) => ({ category, tags }))
    .sort((a, b) =>
      a.category === UNCATEGORIZED ? 1 : b.category === UNCATEGORIZED ? -1 : a.category.localeCompare(b.category),
    );
}
