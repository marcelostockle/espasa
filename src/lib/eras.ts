import { getCollection, type CollectionEntry } from 'astro:content';
import { formatYear } from './time';
import { getSortedEntries } from './entries';
import { t, type Locale } from './i18n';

export interface EraBucket {
  era: CollectionEntry<'eras'>;
  entries: CollectionEntry<'entries'>[];
}

/** "476–1500", "3000 BCE – 476", or "before 3000 BCE" for open-ended beginnings. */
export function formatEraRange(era: CollectionEntry<'eras'>, locale: Locale = 'en'): string {
  const { start, end } = era.data;
  if (start <= -100000) return `${t(locale).before} ${formatYear(end, locale)}`;
  return `${formatYear(start, locale)} – ${formatYear(end - 1, locale)}`;
}

/**
 * Buckets entries by era. An entry belongs to every era its span overlaps.
 * Throws if the era list has gaps or overlaps, or if an entry falls outside it,
 * so a mistake in eras.json fails the build instead of hiding entries.
 */
export async function getEraBuckets(): Promise<EraBucket[]> {
  const eras = (await getCollection('eras')).sort((a, b) => a.data.start - b.data.start);
  for (let i = 1; i < eras.length; i++) {
    if (eras[i].data.start !== eras[i - 1].data.end) {
      throw new Error(
        `eras.json: "${eras[i - 1].id}" ends at ${eras[i - 1].data.end} but "${eras[i].id}" starts at ${eras[i].data.start}`,
      );
    }
  }

  const entries = await getSortedEntries();
  const first = eras[0].data.start;
  const last = eras[eras.length - 1].data.end;
  const uncovered = entries.filter((e) => e.data.date.year < first || e.data.date.year >= last);
  if (uncovered.length) {
    throw new Error(`Entries outside every era: ${uncovered.map((e) => e.id).join(', ')}`);
  }

  return eras.map((era) => ({
    era,
    entries: entries.filter((e) => {
      const startYear = e.data.date.year;
      const endYear = e.data.end?.year ?? startYear;
      return startYear < era.data.end && endYear >= era.data.start;
    }),
  }));
}
