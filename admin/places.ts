// Places: validating their declarations and linking them to existing entries.
// Pure like plan.ts and retag.ts (the Wikipedia check lives in verifyPlaces, which the server runs).
import { z } from 'astro/zod';
import { placeFields } from '../src/lib/schemas.ts';
import type { Issue, OnConflict } from './plan.ts';
import { SLUG, type StoredEntry } from './store.ts';
import { lookupArticle, type PlaceSnapshot } from './wikipedia.ts';

const slug = z.string().regex(SLUG, 'Use lowercase letters, digits and single hyphens');
export const placeInput = placeFields.strict();

export interface PlaceChanges {
  create: Record<string, Record<string, unknown>>;
  update: Record<string, Record<string, unknown>>;
  skip: string[];
}

/** Validates declared places against the existing ones, the same way tags are handled. */
export function planPlaces(
  raw: Record<string, unknown>,
  existing: Record<string, Record<string, unknown>>,
  onConflict: OnConflict,
  fail: (path: string, message: string) => void,
): PlaceChanges & { known: Set<string> } {
  const out: PlaceChanges = { create: {}, update: {}, skip: [] };
  const known = new Set(Object.keys(existing));
  for (const [id, value] of Object.entries(raw)) {
    if (!SLUG.test(id)) {
      fail(`places.${id}`, 'Place ids use lowercase letters, digits and single hyphens');
      continue;
    }
    const parsed = placeInput.safeParse(value);
    if (!parsed.success) {
      for (const i of parsed.error.issues) fail(['places', id, ...i.path].join('.'), i.message);
      continue;
    }
    const current = existing[id];
    if (!current) {
      out.create[id] = parsed.data;
      known.add(id);
    } else if (JSON.stringify(current) === JSON.stringify(parsed.data)) {
      out.skip.push(id);
    } else if (onConflict === 'overwrite') {
      out.update[id] = parsed.data;
    } else if (onConflict === 'skip') {
      out.skip.push(id);
    } else {
      fail(`places.${id}`, 'Place already exists with different content (use onConflict=skip|overwrite)');
    }
  }
  return { ...out, known };
}

/**
 * Checks that every new or changed place points at a real, specific Wikipedia article.
 * Returns the problems and the snapshots to store alongside the places.
 */
export async function verifyPlaces(changes: PlaceChanges) {
  const issues: Issue[] = [];
  const snapshots: Record<string, PlaceSnapshot> = {};
  const declared = { ...changes.create, ...changes.update };
  for (const [id, def] of Object.entries(declared)) {
    try {
      const result = await lookupArticle(String(def.wikipedia));
      if (result.ok) snapshots[id] = result.snapshot;
      else issues.push({ path: `places.${id}.wikipedia`, message: result.problem });
    } catch (e) {
      issues.push({ path: `places.${id}.wikipedia`, message: `Could not reach Wikipedia: ${(e as Error).message}` });
    }
  }
  return { issues, snapshots };
}

const input = z
  .object({
    places: z.record(slug, z.unknown()).default({}),
    link: z.record(slug, z.array(slug)).default({}),
  })
  .strict();

export interface LinkPlan {
  issues: Issue[];
  places: PlaceChanges;
  changes: { entry: StoredEntry; added: string[] }[];
  unchanged: { id: string; place: string }[];
}

/** Entry ids a link payload mentions, so the caller can load them. Tolerant of bad shapes. */
export function linkedIds(payload: unknown): string[] {
  const link = (payload as { link?: unknown } | null)?.link;
  if (typeof link !== 'object' || link === null) return [];
  return [...new Set(Object.values(link).flatMap((l) => (Array.isArray(l) ? l.filter((x) => typeof x === 'string') : [])))];
}

/** Adds places to existing entries, without touching anything else in them. */
export function buildLink(
  payload: unknown,
  existing: Record<string, Record<string, unknown>>,
  entries: Map<string, StoredEntry | null>,
  onConflict: OnConflict,
): LinkPlan {
  const plan: LinkPlan = { issues: [], places: { create: {}, update: {}, skip: [] }, changes: [], unchanged: [] };
  const fail = (path: string, message: string) => plan.issues.push({ path, message });

  const parsed = input.safeParse(payload);
  if (!parsed.success) {
    for (const i of parsed.error.issues) fail(i.path.join('.'), i.message);
    return plan;
  }
  const { places: declared, link } = parsed.data;
  const { known, ...changes } = planPlaces(declared, existing, onConflict, fail);
  plan.places = changes;

  const work = new Map<string, { entry: StoredEntry; places: string[]; added: string[] }>();
  for (const [place, ids] of Object.entries(link)) {
    if (!known.has(place)) {
      fail(`link.${place}`, `Unknown place "${place}" (declare it under "places" or create it first)`);
      continue;
    }
    for (const id of new Set(ids)) {
      const entry = entries.get(id);
      if (!entry) {
        fail(`link.${place}`, `No entry "${id}"`);
        continue;
      }
      if (!work.has(id)) work.set(id, { entry, places: [...(entry.places ?? [])], added: [] });
      const w = work.get(id)!;
      if (w.places.includes(place)) plan.unchanged.push({ id, place });
      else {
        w.places.push(place);
        w.added.push(place);
      }
    }
  }
  for (const w of work.values()) {
    if (w.added.length) plan.changes.push({ entry: { ...w.entry, places: w.places }, added: w.added });
  }
  return plan;
}
