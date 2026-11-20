import type { APIRoute } from 'astro';
import { getSortedEntries } from '../../lib/entries';
import { localeStaticPaths, toLocale } from '../../lib/i18n';
import { entryText } from '../../lib/localize';
import { formatRange, sortKey } from '../../lib/time';

export const getStaticPaths = localeStaticPaths;

// Minimal index for the ordering game: no summaries, one file per locale.
export const GET: APIRoute = async ({ currentLocale }) => {
  const locale = toLocale(currentLocale);
  const entries = await getSortedEntries();
  const body = entries.map((e) => [
    e.id,
    entryText(e, locale).title,
    formatRange(e.data.date, e.data.end, locale),
    sortKey(e.data.date),
    e.data.date.circa ? 1 : 0,
    e.data.tags.map((t) => t.id),
    sortKey(e.data.end ?? e.data.date),
  ]);
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
