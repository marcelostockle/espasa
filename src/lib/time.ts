export interface HistoricalDate {
  year: number;
  month?: number;
  day?: number;
  circa: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Monotonic numeric key for ordering; not meant for display. */
export function sortKey(d: HistoricalDate): number {
  return d.year + ((d.month ?? 1) - 1) / 12 + ((d.day ?? 1) - 1) / 372;
}

export function formatDate(d: HistoricalDate): string {
  const era = d.year < 0 ? ' BCE' : '';
  const year = `${Math.abs(d.year)}${era}`;
  const parts = [d.month ? MONTHS[d.month - 1] : null, d.day ? String(d.day) : null];
  const monthDay = d.month ? (d.day ? `${parts[0]} ${parts[1]}, ` : `${parts[0]} `) : '';
  return `${d.circa ? 'c. ' : ''}${monthDay}${year}`;
}

export function formatRange(start: HistoricalDate, end?: HistoricalDate): string {
  return end ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);
}
