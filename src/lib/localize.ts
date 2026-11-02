// Picks the text to show for a locale, falling back to the English source when no translation exists.
import type { CollectionEntry } from 'astro:content';
import { defaultLocale, type Locale } from './i18n';

/** `lang` is the language the text is actually in, so callers can mark fallbacks. */
export function entryText(entry: CollectionEntry<'entries'>, locale: Locale) {
  const tr = locale === defaultLocale ? undefined : entry.data.translations?.[locale];
  return tr
    ? { title: tr.title, summary: tr.summary, lang: locale }
    : { title: entry.data.title, summary: entry.data.summary, lang: defaultLocale };
}

export function tagText(tag: CollectionEntry<'tags'>, locale: Locale) {
  const tr = locale === defaultLocale ? undefined : tag.data.translations?.[locale];
  return { label: tr?.label ?? tag.data.label, description: tr ? tr.description : tag.data.description };
}

export function eraLabel(era: CollectionEntry<'eras'>, locale: Locale) {
  return (locale === defaultLocale ? undefined : era.data.translations?.[locale]?.label) ?? era.data.label;
}

export function featuredText(f: CollectionEntry<'featured'>, locale: Locale) {
  const tr = locale === defaultLocale ? undefined : f.data.translations?.[locale];
  return { title: tr?.title ?? f.data.title, description: tr?.description ?? f.data.description };
}
