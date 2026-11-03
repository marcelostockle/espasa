import type { APIRoute } from 'astro';
import { localeStaticPaths, toLocale } from '../../lib/i18n';
import { getPlaces, placeCard } from '../../lib/places';

export const getStaticPaths = localeStaticPaths;

// Popup contents for every place, one file per locale. Fetched only when a reader first opens a popup.
export const GET: APIRoute = async ({ currentLocale }) => {
  const locale = toLocale(currentLocale);
  const body = Object.fromEntries((await getPlaces()).map((p) => [p.id, placeCard(p, locale)]));
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
