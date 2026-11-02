import type { APIRoute } from 'astro';
import { getSortedEntries, getTags } from '../../lib/entries';
import { localeStaticPaths, toLocale } from '../../lib/i18n';
import { entryText, tagText } from '../../lib/localize';
import { formatRange, sortKey } from '../../lib/time';

export const getStaticPaths = localeStaticPaths;

// Lightweight index for client-side views (summaries included, no bodies), one per locale.
export const GET: APIRoute = async ({ currentLocale }) => {
  const locale = toLocale(currentLocale);
  const [entries, tags] = await Promise.all([getSortedEntries(), getTags(locale)]);
  const body = {
    tags: tags.map((t) => ({ id: t.id, label: tagText(t, locale).label, color: t.data.color, categories: t.data.categories })),
    entries: entries.map((e) => ({
      id: e.id,
      title: entryText(e, locale).title,
      summary: entryText(e, locale).summary,
      date: formatRange(e.data.date, e.data.end, locale),
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
