import { getCollection, type CollectionEntry } from 'astro:content';
import snapshots from '../content/place-snapshots.json';
import { defaultLocale, type Locale } from './i18n';
import { placeSnapshot } from './schemas';

export async function getPlaces() {
  return getCollection('places');
}

/** Chip text for a place, in the reader's language when we have it. */
export function placeLabel(place: CollectionEntry<'places'>, locale: Locale) {
  return (locale === defaultLocale ? undefined : place.data.translations?.[locale]?.label) ?? place.data.label;
}

/** What the popup shows. Falls back to English when there is no article in the reader's language. */
export function placeCard(place: CollectionEntry<'places'>, locale: Locale) {
  const raw = (snapshots as Record<string, unknown>)[place.id];
  const snap = raw ? placeSnapshot.parse(raw) : undefined;
  const local = locale === defaultLocale ? undefined : snap?.es;
  const article = local ?? snap;
  const wikipedia = locale === defaultLocale ? 'en' : local ? locale : 'en';
  return {
    label: placeLabel(place, locale),
    title: article?.title ?? place.data.wikipedia,
    // The language the article is in, so the popup can mark fallbacks.
    lang: article ? wikipedia : defaultLocale,
    description: locale === defaultLocale || !local ? snap?.description : undefined,
    extract: article?.extract,
    url: article?.url ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(place.data.wikipedia.replaceAll(' ', '_'))}`,
    thumbnail: snap?.thumbnail,
    lat: snap?.lat,
    lon: snap?.lon,
  };
}
