import type { APIRoute } from 'astro';
import { getSortedEntries, getTags } from '../../lib/entries';
import { localeStaticPaths, toLocale } from '../../lib/i18n';
import { entryText, tagText } from '../../lib/localize';
import { formatRange, sortKey } from '../../lib/time';

export const getStaticPaths = localeStaticPaths;

// Minimal index for the ordering game: no summaries, one file per locale.
export const GET: APIRoute = async ({ currentLocale }) => {
  const locale = toLocale(currentLocale);
  const [entries, tags] = await Promise.all([getSortedEntries(), getTags(locale)]);
  const rows = entries.map((e) => [
    e.id,
    entryText(e, locale).title,
    formatRange(e.data.date, e.data.end, locale),
    sortKey(e.data.date),
    e.data.date.circa ? 1 : 0,
    e.data.tags.map((t) => t.id),
    sortKey(e.data.end ?? e.data.date),
  ]);
  const body = {
    tags: Object.fromEntries(tags.map((t) => [t.id, [tagText(t, locale).label, t.data.color]])),
    entries: rows,
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
