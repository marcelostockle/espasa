// Local content admin: a small JSON API over src/content. Run with `npm run admin`.
// It binds to 127.0.0.1 only and has no auth, so it must never be deployed or exposed.
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';
import { buildPlan, type OnConflict, type Plan } from './plan.ts';
import * as store from './store.ts';

const PORT = Number(process.env.ADMIN_PORT ?? 4322);
const MAX_BODY = 50 * 1024 * 1024;
const UI_FILE = join(import.meta.dirname, 'ui', 'index.html');

class HttpError extends Error {
  status: number;
  extra: object;
  constructor(status: number, message: string, extra: object = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2) + '\n');
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  // A cross-site form can send text/plain without a preflight; JSON forces one, and we send no CORS headers.
  if (!req.headers['content-type']?.startsWith('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json');
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new HttpError(413, `Body exceeds ${MAX_BODY / 1024 / 1024} MB`);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (e) {
    throw new HttpError(400, `Invalid JSON: ${(e as Error).message}`);
  }
}

// Writes are serialized so concurrent requests never interleave file operations.
let queue: Promise<unknown> = Promise.resolve();
const exclusive = <T>(job: () => Promise<T>): Promise<T> => {
  const run = queue.then(job, job);
  queue = run.catch(() => {});
  return run;
};

async function loadState() {
  const [tags, ids, eraSpan] = await Promise.all([store.readTags(), store.listEntryIds(), store.readEraSpan()]);
  return { tags, entryIds: new Set(ids), eraSpan };
}

function summarize(plan: Plan, dryRun: boolean) {
  return {
    ok: true,
    dryRun,
    tags: {
      created: Object.keys(plan.tags.create),
      updated: Object.keys(plan.tags.update),
      skipped: plan.tags.skip,
    },
    entries: {
      created: plan.entries.create.map((e) => e.id),
      overwritten: plan.entries.overwrite.map((e) => e.id),
      skipped: plan.entries.skip,
    },
  };
}

/** Every write goes through here: validate everything, and write nothing unless all of it is valid. */
function runImport(payload: unknown, opts: { dryRun: boolean; onConflict: OnConflict }) {
  return exclusive(async () => {
    const state = await loadState();
    const plan = buildPlan(payload, state, opts.onConflict);
    if (plan.issues.length) {
      throw new HttpError(422, 'Validation failed; nothing was written', { dryRun: opts.dryRun, issues: plan.issues });
    }
    if (!opts.dryRun) {
      const tagsChanged = Object.keys(plan.tags.create).length + Object.keys(plan.tags.update).length > 0;
      // Tags first, so a partial failure can't leave entries pointing at missing tags.
      if (tagsChanged) await store.writeTags({ ...state.tags, ...plan.tags.create, ...plan.tags.update });
      for (const entry of [...plan.entries.create, ...plan.entries.overwrite]) await store.writeEntry(entry);
    }
    return summarize(plan, opts.dryRun);
  });
}

function parseConflict(value: string | null): OnConflict {
  if (value === null) return 'fail';
  if (value === 'fail' || value === 'skip' || value === 'overwrite') return value;
  throw new HttpError(400, 'onConflict must be fail, skip or overwrite');
}

async function route(req: IncomingMessage, res: ServerResponse) {
  // Reject requests whose Host isn't loopback (DNS-rebinding protection).
  const host = req.headers.host ?? '';
  if (host !== `localhost:${PORT}` && host !== `127.0.0.1:${PORT}`) throw new HttpError(403, 'Forbidden host');

  const url = new URL(req.url ?? '/', `http://${host}`);
  const method = req.method ?? 'GET';
  const path = url.pathname.replace(/\/+$/, '');
  const m = (pattern: RegExp) => path.match(pattern);

  // --- UI (a single static page that talks to the API below, same origin) ---
  if (path === '' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      // Same-origin only, and never embeddable in another site (clickjacking).
      'Content-Security-Policy':
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
    });
    return res.end(await readFile(UI_FILE));
  }

  // --- bulk import ---
  if (path === '/api/import' && method === 'POST') {
    const result = await runImport(await readJson(req), {
      dryRun: url.searchParams.has('dry'),
      onConflict: parseConflict(url.searchParams.get('onConflict')),
    });
    return send(res, 200, result);
  }

  // --- tags ---
  if (path === '/api/tags' && method === 'GET') return send(res, 200, await store.readTags());

  let match = m(/^\/api\/tags\/([^/]+)$/);
  if (match && method === 'PUT') {
    const id = match[1];
    const result = await runImport({ tags: { [id]: await readJson(req) } }, { dryRun: false, onConflict: 'overwrite' });
    return send(res, 200, result);
  }
  if (match && method === 'DELETE') {
    const id = match[1];
    const result = await exclusive(async () => {
      const tags = await store.readTags();
      if (!(id in tags)) throw new HttpError(404, `No tag "${id}"`);
      const users: string[] = [];
      for (const entryId of await store.listEntryIds()) {
        if ((await store.readEntry(entryId))?.tags.includes(id)) users.push(entryId);
      }
      if (users.length) throw new HttpError(409, `Tag "${id}" is used by ${users.length} entries`, { entries: users });
      delete tags[id];
      await store.writeTags(tags);
      return { ok: true, deleted: id };
    });
    return send(res, 200, result);
  }

  // --- entries ---
  if (path === '/api/entries' && method === 'GET') {
    const tag = url.searchParams.get('tag');
    const q = url.searchParams.get('q')?.toLowerCase();
    const all = await Promise.all((await store.listEntryIds()).map((id) => store.readEntry(id)));
    const list = all
      .filter((e): e is store.StoredEntry => e !== null)
      .filter((e) => !tag || e.tags.includes(tag))
      .filter((e) => !q || `${e.title} ${e.summary} ${e.body}`.toLowerCase().includes(q))
      .map(({ id, title, date, end, tags }) => ({ id, title, date, end, tags }));
    return send(res, 200, list);
  }
  if (path === '/api/entries' && method === 'POST') {
    const result = await runImport({ entries: [await readJson(req)] }, { dryRun: false, onConflict: 'fail' });
    return send(res, 201, result);
  }

  match = m(/^\/api\/entries\/([^/]+)$/);
  if (match && method === 'GET') {
    const entry = await store.readEntry(match[1]);
    if (!entry) throw new HttpError(404, `No entry "${match[1]}"`);
    return send(res, 200, entry);
  }
  if (match && method === 'PUT') {
    const id = match[1];
    const body = await readJson(req);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new HttpError(400, 'Body must be an object');
    const given = (body as { id?: unknown }).id;
    if (given !== undefined && given !== id) throw new HttpError(400, `Body id "${String(given)}" does not match URL id "${id}"`);
    if (!(await store.readEntry(id))) throw new HttpError(404, `No entry "${id}"`);
    const result = await runImport({ entries: [{ ...body, id }] }, { dryRun: false, onConflict: 'overwrite' });
    return send(res, 200, result);
  }
  if (match && method === 'DELETE') {
    const deleted = await exclusive(() => store.deleteEntry(match![1]));
    if (!deleted) throw new HttpError(404, `No entry "${match[1]}"`);
    return send(res, 200, { ok: true, deleted: match[1] });
  }

  throw new HttpError(404, `No route for ${method} ${path}`);
}

createServer((req, res) => {
  route(req, res).catch((e) => {
    if (e instanceof HttpError) return send(res, e.status, { ok: false, error: e.message, ...e.extra });
    console.error(e);
    send(res, 500, { ok: false, error: 'Internal error' });
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Content admin listening on http://localhost:${PORT} (local only)`);
});
