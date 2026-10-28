// Filesystem access to src/content. Everything the admin tool reads or writes goes through here.
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

const CONTENT = join(import.meta.dirname, '..', 'src', 'content');
const ENTRIES = join(CONTENT, 'entries');
const TAGS_FILE = join(CONTENT, 'tags.json');
const ERAS_FILE = join(CONTENT, 'eras.json');

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface StoredEntry {
  id: string;
  title: string;
  summary: string;
  date: Record<string, unknown>;
  end?: Record<string, unknown>;
  tags: string[];
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
  return { id, ...parse(match[1]), body: match[2].trim() };
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
    '---',
    '',
    e.body.trim(),
    '',
  ];
  await mkdir(ENTRIES, { recursive: true });
  await writeAtomic(entryPath(e.id), lines.join('\n'));
}

export async function deleteEntry(id: string): Promise<boolean> {
  try {
    await unlink(entryPath(id));
    return true;
  } catch {
    return false;
  }
}
