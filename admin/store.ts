// Filesystem access to src/content. Everything the admin tool reads or writes goes through here.
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

const CONTENT = join(import.meta.dirname, '..', 'src', 'content');
const ENTRIES = join(CONTENT, 'entries');
const TAGS_FILE = join(CONTENT, 'tags.json');
const PLACES_FILE = join(CONTENT, 'places.json');
const SNAPSHOTS_FILE = join(CONTENT, 'place-snapshots.json');
const ERAS_FILE = join(CONTENT, 'eras.json');

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface StoredEntry {
  id: string;
  title: string;
  summary: string;
  date: Record<string, unknown>;
  end?: Record<string, unknown>;
  tags: string[];
  places?: string[];
  sources: string[];
  translations?: Record<string, { title?: string; summary?: string }>;
  body: string;
}

/** Write via a temp file so a crash never leaves a half-written file behind. */
async function writeAtomic(path: string, text: string) {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, text, 'utf8');
  await rename(tmp, path);
}

const entryPath = (id: string) => {
  if (!SLUG.test(id)) throw new Error(`Invalid id: ${id}`); // also blocks path traversal
  return join(ENTRIES, `${id}.md`);
};

export async function readTags(): Promise<Record<string, Record<string, unknown>>> {
  return JSON.parse(await readFile(TAGS_FILE, 'utf8'));
}

export async function writeTags(tags: Record<string, unknown>) {
  const sorted = Object.fromEntries(Object.entries(tags).sort(([a], [b]) => a.localeCompare(b)));
  await writeAtomic(TAGS_FILE, JSON.stringify(sorted, null, 2) + '\n');
}

const sortedById = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

export async function readPlaces(): Promise<Record<string, Record<string, unknown>>> {
  return JSON.parse(await readFile(PLACES_FILE, 'utf8'));
}

export async function writePlaces(places: Record<string, unknown>) {
  await writeAtomic(PLACES_FILE, JSON.stringify(sortedById(places), null, 2) + '\n');
}

export async function readSnapshots(): Promise<Record<string, Record<string, unknown>>> {
  return JSON.parse(await readFile(SNAPSHOTS_FILE, 'utf8'));
}

export async function writeSnapshots(snapshots: Record<string, unknown>) {
  await writeAtomic(SNAPSHOTS_FILE, JSON.stringify(sortedById(snapshots), null, 2) + '\n');
}

/** The overall year range the eras cover, or null if there are none. */
export async function readEraSpan(): Promise<{ start: number; end: number } | null> {
  const eras: { start: number; end: number }[] = JSON.parse(await readFile(ERAS_FILE, 'utf8'));
  if (!eras.length) return null;
  return {
    start: Math.min(...eras.map((e) => e.start)),
    end: Math.max(...eras.map((e) => e.end)),
  };
}

export async function listEntryIds(): Promise<string[]> {
  try {
    return (await readdir(ENTRIES)).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
  } catch {
    return [];
  }
}

export async function readEntry(id: string): Promise<StoredEntry | null> {
  let text: string;
  try {
    text = await readFile(entryPath(id), 'utf8');
  } catch {
    return null;
  }
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${id}.md has no frontmatter`);
  return { id, sources: [], ...parse(match[1]), body: match[2].trim() };
}

// Frontmatter is written as JSON values, which is valid YAML and keeps escaping trivial.
const J = JSON.stringify;
const compactDate = (d: Record<string, unknown>) =>
  d.circa === false ? Object.fromEntries(Object.entries(d).filter(([k]) => k !== 'circa')) : d;

export async function writeEntry(e: StoredEntry) {
  const lines = [
    '---',
    `title: ${J(e.title)}`,
    `summary: ${J(e.summary)}`,
    `date: ${J(compactDate(e.date))}`,
    ...(e.end ? [`end: ${J(compactDate(e.end))}`] : []),
    `tags: ${J(e.tags)}`,
    ...(e.places?.length ? [`places: ${J(e.places)}`] : []),
    ...(e.sources.length ? [`sources: ${J(e.sources)}`] : []),
    ...(e.translations && Object.keys(e.translations).length ? [`translations: ${J(e.translations)}`] : []),
    '---',
    '',
    e.body.trim(),
    '',
  ];
  await mkdir(ENTRIES, { recursive: true });
  await writeAtomic(entryPath(e.id), lines.join('\n'));
}

/**
 * Change only an entry's tags, leaving the rest of the file byte-for-byte alone so the git diff
 * is exactly the tag change. Falls back to a full rewrite if `tags:` isn't a single-line list.
 */
export async function writeEntryTags(e: StoredEntry) {
  const path = entryPath(e.id);
  const text = await readFile(path, 'utf8');
  const line = /^tags:[ \t]*\[.*\][ \t]*(\r?)$/m;
  if (line.test(text)) {
    await writeAtomic(path, text.replace(line, (_m, cr) => `tags: ${J(e.tags)}${cr}`));
  } else {
    await writeEntry(e);
  }
}

/** Change only an entry's places line (adding it after `tags:` if absent), leaving the rest byte-for-byte alone. */
export async function writeEntryPlaces(e: StoredEntry) {
  const path = entryPath(e.id);
  const text = await readFile(path, 'utf8');
  const line = /^places:[ \t]*\[.*\][ \t]*(\r?)$/m;
  const tags = /^(tags:.*?)(\r?)$/m;
  const value = `places: ${J(e.places ?? [])}`;
  if (line.test(text)) await writeAtomic(path, text.replace(line, (_m, cr) => `${value}${cr}`));
  else if (tags.test(text)) await writeAtomic(path, text.replace(tags, (_m, t, cr) => `${t}${cr}\n${value}${cr}`));
  else await writeEntry(e);
}

export async function deleteEntry(id: string): Promise<boolean> {
  try {
    await unlink(entryPath(id));
    return true;
  } catch {
    return false;
  }
}
