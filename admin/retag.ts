// Bulk add/remove of tags on existing entries, without touching anything else in them.
// Pure like plan.ts: it decides what to change; the server does the writing.
import { z } from 'astro/zod';
import { tagFields } from '../src/lib/schemas.ts';
import type { Issue } from './plan.ts';
import { SLUG, type StoredEntry } from './store.ts';

const slug = z.string().regex(SLUG, 'Use lowercase letters, digits and single hyphens');
const byTag = z.record(slug, z.array(slug)).default({});
const input = z
  .object({ tags: z.record(slug, tagFields.strict()).default({}), add: byTag, remove: byTag })
  .strict();

export interface RetagPlan {
  issues: Issue[];
  tags: { create: Record<string, object>; skip: string[] };
  changes: { entry: StoredEntry; added: string[]; removed: string[] }[];
  unchanged: { id: string; tag: string; op: 'add' | 'remove'; reason: string }[];
}

/** Entry ids a payload mentions, so the caller can load them. Tolerant of bad shapes. */
export function mentionedIds(payload: unknown): string[] {
  const ids = new Set<string>();
  if (typeof payload !== 'object' || payload === null) return [];
  for (const op of ['add', 'remove'] as const) {
    const group = (payload as Record<string, unknown>)[op];
    if (typeof group !== 'object' || group === null) continue;
    for (const list of Object.values(group)) {
      if (Array.isArray(list)) for (const id of list) if (typeof id === 'string') ids.add(id);
    }
  }
  return [...ids];
}

export function buildRetag(
  payload: unknown,
  existingTags: Record<string, Record<string, unknown>>,
  entries: Map<string, StoredEntry | null>,
): RetagPlan {
  const plan: RetagPlan = { issues: [], tags: { create: {}, skip: [] }, changes: [], unchanged: [] };
  const fail = (path: string, message: string) => plan.issues.push({ path, message });

  const parsed = input.safeParse(payload);
  if (!parsed.success) {
    for (const i of parsed.error.issues) fail(i.path.join('.'), i.message);
    return plan;
  }
  const { tags: newTags, add, remove } = parsed.data;

  // Tags declared in the payload may be used by add/remove in the same payload.
  const knownTags = new Set(Object.keys(existingTags));
  for (const [id, def] of Object.entries(newTags)) {
    const existing = existingTags[id];
    if (!existing) {
      plan.tags.create[id] = def;
      knownTags.add(id);
    } else if (JSON.stringify(existing) === JSON.stringify(def)) {
      plan.tags.skip.push(id); // identical re-declaration is not a conflict
    } else {
      fail(`tags.${id}`, 'Tag already exists with different content; edit it in the Tags tab instead');
    }
  }

  const added = new Set(Object.entries(add).flatMap(([tag, ids]) => ids.map((id) => `${tag}|${id}`)));
  const work = new Map<string, { entry: StoredEntry; tags: string[]; added: string[]; removed: string[] }>();
  const workFor = (id: string) => {
    const entry = entries.get(id);
    if (!entry) return null;
    if (!work.has(id)) work.set(id, { entry, tags: [...entry.tags], added: [], removed: [] });
    return work.get(id)!;
  };

  for (const op of ['add', 'remove'] as const) {
    for (const [tag, ids] of Object.entries(op === 'add' ? add : remove)) {
      if (!knownTags.has(tag)) {
        fail(`${op}.${tag}`, `Unknown tag "${tag}"`);
        continue;
      }
      for (const id of new Set(ids)) {
        const w = workFor(id);
        if (!w) {
          fail(`${op}.${tag}`, `No entry "${id}"`);
          continue;
        }
        if (op === 'remove' && added.has(`${tag}|${id}`)) {
          fail(`remove.${tag}`, `"${id}" is both added and removed for "${tag}"`);
          continue;
        }
        const has = w.tags.includes(tag);
        if (op === 'add' && has) {
          plan.unchanged.push({ id, tag, op, reason: 'already tagged' });
        } else if (op === 'remove' && !has) {
          plan.unchanged.push({ id, tag, op, reason: 'not tagged' });
        } else if (op === 'add') {
          w.tags.push(tag);
          w.added.push(tag);
        } else {
          w.tags = w.tags.filter((t) => t !== tag);
          w.removed.push(tag);
        }
      }
    }
  }

  for (const [id, w] of work) {
    if (w.tags.length === 0) fail(`remove`, `Entry "${id}" would be left with no tags`);
    if (w.added.length || w.removed.length) {
      plan.changes.push({ entry: { ...w.entry, tags: w.tags }, added: w.added, removed: w.removed });
    }
  }
  return plan;
}
