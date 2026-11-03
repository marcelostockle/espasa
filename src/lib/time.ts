import { monthName, type Locale } from './i18n.ts';

export interface HistoricalDate {
  year: number;
  month?: number;
  day?: number;
  circa: boolean;
}

const NBSP = ' ';

/** Monotonic numeric key for ordering; not meant for display. */
export function sortKey(d: HistoricalDate): number {
  return d.year + ((d.month ?? 1) - 1) / 12 + ((d.day ?? 1) - 1) / 372;
}

export function formatYear(year: number, locale: Locale = 'en'): string {
  if (year >= 0) return String(year);
  return locale === 'es' ? `${-year}${NBSP}a.${NBSP}C.` : `${-year} BCE`;
}

export function formatDate(d: HistoricalDate, locale: Locale = 'en'): string {
  const year = formatYear(d.year, locale);
  if (locale === 'es') {
    const monthDay = d.month
      ? d.day
        ? `${d.day} de ${monthName(d.month, locale)} de `
        : `${monthName(d.month, locale)} de `
      : '';
    return `${d.circa ? `c.${NBSP}` : ''}${monthDay}${year}`;
  }
  const month = d.month ? monthName(d.month, locale) : '';
  const monthDay = d.month ? (d.day ? `${month} ${d.day}, ` : `${month} `) : '';
  return `${d.circa ? 'c. ' : ''}${monthDay}${year}`;
}

export function formatRange(start: HistoricalDate, end?: HistoricalDate, locale: Locale = 'en'): string {
  return end ? `${formatDate(start, locale)} – ${formatDate(end, locale)}` : formatDate(start, locale);
}
