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
