// Fetches and validates Wikipedia articles for places. Network only; nothing here touches disk.
// Wikimedia asks API clients to identify themselves.
import type { z } from 'astro/zod';
import type { placeSnapshot } from '../src/lib/schemas.ts';

export type PlaceSnapshot = z.infer<typeof placeSnapshot>;

const HEADERS = { 'User-Agent': 'EspasaTimeline/0.1 (educational project; content admin)', 'Api-User-Agent': 'EspasaTimeline/0.1' };

interface Summary {
  type?: string;
  title: string;
  description?: string;
  extract?: string;
  thumbnail?: { source: string };
  coordinates?: { lat: number; lon: number };
  content_urls?: { desktop?: { page?: string } };
}

async function getJson<T>(url: string): Promise<{ status: number; data?: T }> {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
  if (res.status === 404) return { status: 404 };
  if (!res.ok) throw new Error(`Wikipedia returned ${res.status} for ${url}`);
  return { status: res.status, data: (await res.json()) as T };
}

const summaryUrl = (lang: string, title: string) =>
  `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`;

/** The Spanish title English Wikipedia links to for this article, if any. */
async function spanishTitle(title: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=es&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
  const { data } = await getJson<{ query?: { pages?: Record<string, { langlinks?: { '*': string }[] }> } }>(url);
  const page = Object.values(data?.query?.pages ?? {})[0];
  return page?.langlinks?.[0]?.['*'] ?? null;
}

export type Lookup = { ok: true; snapshot: PlaceSnapshot } | { ok: false; problem: string };

/** Looks up an English article (and its Spanish counterpart) and rejects missing or disambiguation pages. */
export async function lookupArticle(title: string): Promise<Lookup> {
  const en = await getJson<Summary>(summaryUrl('en', title));
  if (!en.data) return { ok: false, problem: `No English Wikipedia article titled "${title}"` };
  const s = en.data;
  if (s.type === 'disambiguation') {
    return { ok: false, problem: `"${title}" is a disambiguation page; use the specific article title` };
  }
  const url = s.content_urls?.desktop?.page;
  if (!url || !s.extract) return { ok: false, problem: `"${title}" has no usable summary` };

  const snapshot: PlaceSnapshot = {
    title: s.title,
    url,
    extract: s.extract,
    ...(s.description ? { description: s.description } : {}),
    ...(s.thumbnail ? { thumbnail: s.thumbnail.source.split('?')[0] } : {}),
    ...(s.coordinates ? { lat: s.coordinates.lat, lon: s.coordinates.lon } : {}),
  };

  const esTitle = await spanishTitle(s.title);
  if (esTitle) {
    const es = (await getJson<Summary>(summaryUrl('es', esTitle))).data;
    const esUrl = es?.content_urls?.desktop?.page;
    if (es && es.type !== 'disambiguation' && esUrl && es.extract) {
      snapshot.es = { title: es.title, url: esUrl, extract: es.extract };
    }
  }
  return { ok: true, snapshot };
}
