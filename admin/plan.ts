// Validates an import payload against the site's schemas and decides what to write.
// Pure: it reads nothing and writes nothing, so a dry run is the same code path as a real run.
import { z } from 'astro/zod';
import { entryFields, tagFields } from '../src/lib/schemas.ts';
import { sortKey } from '../src/lib/time.ts';
import { planPlaces, type PlaceChanges } from './places.ts';
import { SLUG, type StoredEntry } from './store.ts';

export type OnConflict = 'fail' | 'skip' | 'overwrite';

export interface Issue {
  path: string;
  message: string;
}

export interface State {
  tags: Record<string, Record<string, unknown>>;
  places: Record<string, Record<string, unknown>>;
  entryIds: Set<string>;
  eraSpan: { start: number; end: number } | null;
}

export interface Plan {
  issues: Issue[];
  tags: { create: Record<string, object>; update: Record<string, object>; skip: string[] };
  places: PlaceChanges;
  entries: { create: StoredEntry[]; overwrite: StoredEntry[]; skip: string[] };
}

const slug = z.string().regex(SLUG, 'Use lowercase letters, digits and single hyphens');

const tagInput = tagFields.strict();
const entryInput = entryFields
  .extend({
    id: slug.optional(),
    tags: z.array(slug).min(1),
    places: z.array(slug).default([]),
    body: z.string().default(''),
  })
  .strict();

export function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

function zodIssues(prefix: string, error: z.ZodError): Issue[] {
  return error.issues.map((i) => ({
    path: [prefix, ...i.path].join('.').replace(/\.(\d+)/g, '[$1]'),
    message: i.message,
  }));
}

export function buildPlan(
  payload: unknown,
  state: State,
  onConflict: OnConflict,
): Plan {
  const plan: Plan = {
    issues: [],
    tags: { create: {}, update: {}, skip: [] },
    places: { create: {}, update: {}, skip: [] },
    entries: { create: [], overwrite: [], skip: [] },
  };
  const fail = (path: string, message: string) => plan.issues.push({ path, message });

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    fail('', 'Body must be an object like { "tags": {...}, "entries": [...] }');
    return plan;
  }
  const { tags: rawTags = {}, places: rawPlaces = {}, entries: rawEntries = [], ...extra } = payload as Record<string, unknown>;
  for (const key of Object.keys(extra)) fail(key, 'Unknown top-level key');
  if (typeof rawTags !== 'object' || rawTags === null || Array.isArray(rawTags)) {
    fail('tags', 'Must be an object keyed by tag id');
    return plan;
  }
  if (typeof rawPlaces !== 'object' || rawPlaces === null || Array.isArray(rawPlaces)) {
    fail('places', 'Must be an object keyed by place id');
    return plan;
  }
  if (!Array.isArray(rawEntries)) {
    fail('entries', 'Must be an array');
    return plan;
  }

  // Tags first: entries may reference tags introduced by the same payload.
  const knownTags = new Set(Object.keys(state.tags));
  for (const [id, raw] of Object.entries(rawTags)) {
    if (!SLUG.test(id)) {
      fail(`tags.${id}`, 'Tag ids use lowercase letters, digits and single hyphens');
      continue;
    }
    const parsed = tagInput.safeParse(raw);
    if (!parsed.success) {
      plan.issues.push(...zodIssues(`tags.${id}`, parsed.error));
      continue;
    }
    const existing = state.tags[id];
    if (!existing) {
      plan.tags.create[id] = parsed.data;
      knownTags.add(id);
    } else if (JSON.stringify(existing) === JSON.stringify(parsed.data)) {
      plan.tags.skip.push(id); // identical re-declaration is never a conflict
    } else if (onConflict === 'overwrite') {
      plan.tags.update[id] = parsed.data;
    } else if (onConflict === 'skip') {
      plan.tags.skip.push(id);
    } else {
      fail(`tags.${id}`, 'Tag already exists with different content (use onConflict=skip|overwrite)');
    }
  }

  const { known: knownPlaces, ...placeChanges } = planPlaces(rawPlaces as Record<string, unknown>, state.places, onConflict, fail);
  plan.places = placeChanges;

  const seen = new Set<string>();
  rawEntries.forEach((raw, i) => {
    const at = `entries[${i}]`;
    const parsed = entryInput.safeParse(raw);
    if (!parsed.success) {
      plan.issues.push(...zodIssues(at, parsed.error));
      return;
    }
    const { id: givenId, body, ...data } = parsed.data;
    const id = givenId ?? slugify(data.title);
    if (!id) return fail(`${at}.title`, 'Cannot derive an id from this title; set "id"');
    if (seen.has(id)) {
      return fail(`${at}.id`, `Duplicate id "${id}" in this payload${givenId ? '' : ' (derived from title; set "id")'}`);
    }
    seen.add(id);

    for (const t of data.tags) {
      if (!knownTags.has(t)) fail(`${at}.tags`, `Unknown tag "${t}" (declare it under "tags" or create it first)`);
    }
    for (const p of data.places) {
      if (!knownPlaces.has(p)) fail(`${at}.places`, `Unknown place "${p}" (declare it under "places" or create it first)`);
    }
    if (data.end && sortKey(data.end) < sortKey(data.date)) {
      fail(`${at}.end`, 'End date is before the start date');
    }
    const { eraSpan } = state;
    if (eraSpan && (data.date.year < eraSpan.start || data.date.year >= eraSpan.end)) {
      fail(`${at}.date.year`, `Year ${data.date.year} is outside every era (${eraSpan.start} to ${eraSpan.end - 1}); extend eras.json first`);
    }

    const entry: StoredEntry = { id, ...data, body };
    if (!state.entryIds.has(id)) plan.entries.create.push(entry);
    else if (onConflict === 'overwrite') plan.entries.overwrite.push(entry);
    else if (onConflict === 'skip') plan.entries.skip.push(id);
    else fail(`${at}.id`, `Entry "${id}" already exists (use onConflict=skip|overwrite)`);
  });

  return plan;
}
