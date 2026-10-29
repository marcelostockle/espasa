import type { APIRoute } from 'astro';
import { getSortedEntries, getTags } from '../lib/entries';
import { formatRange, sortKey } from '../lib/time';

// Lightweight index for client-side views (summaries included, no bodies).
export const GET: APIRoute = async () => {
  const [entries, tags] = await Promise.all([getSortedEntries(), getTags()]);
  const body = {
    tags: tags.map((t) => ({ id: t.id, label: t.data.label, color: t.data.color, categories: t.data.categories })),
    entries: entries.map((e) => ({
      id: e.id,
      title: e.data.title,
      summary: e.data.summary,
      date: formatRange(e.data.date, e.data.end),
      key: sortKey(e.data.date),
      year: e.data.date.year,
      endYear: e.data.end?.year ?? e.data.date.year,
      tags: e.data.tags.map((t) => t.id),
    })),
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
};
