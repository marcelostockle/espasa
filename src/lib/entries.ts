import { getCollection } from 'astro:content';
import { sortKey } from './time';

export async function getSortedEntries() {
  const entries = await getCollection('entries');
  return entries.sort((a, b) => sortKey(a.data.date) - sortKey(b.data.date));
}

type Entry = Awaited<ReturnType<typeof getSortedEntries>>[number];

/** Gap between two entries' date ranges; 0 when they overlap. */
function distance(a: Entry, b: Entry): number {
  const [aStart, aEnd] = [sortKey(a.data.date), sortKey(a.data.end ?? a.data.date)];
  const [bStart, bEnd] = [sortKey(b.data.date), sortKey(b.data.end ?? b.data.date)];
  return Math.max(0, bStart - aEnd, aStart - bEnd);
}

/** The `count` entries closest in time to `entry`, in chronological order. */
export function getNearbyEntries(entry: Entry, entries: Entry[], count = 5): Entry[] {
  return entries
    .filter((e) => e.id !== entry.id)
    .map((e) => ({ e, d: distance(entry, e) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map(({ e }) => e)
    .sort((a, b) => sortKey(a.data.date) - sortKey(b.data.date));
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
    const cats = tag.categories?.length ? tag.categories : [UNCATEGORIZED];
    for (const c of cats) groups.set(c, [...(groups.get(c) ?? []), tag]);
  }
  return [...groups]
    .map(([category, tags]) => ({ category, tags }))
    .sort((a, b) =>
      a.category === UNCATEGORIZED ? 1 : b.category === UNCATEGORIZED ? -1 : a.category.localeCompare(b.category),
    );
}
