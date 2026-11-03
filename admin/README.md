# Content admin

A local-only UI and JSON API for managing `src/content`. It is not part of the site build and must never be deployed: it has no auth and binds to `127.0.0.1`.

```
npm run admin          # http://localhost:4322  (override with ADMIN_PORT)
```

Open http://localhost:4322 for the UI (entries, tags, and import with dry run). It is a single static page in [ui/index.html](ui/index.html) that calls the API below from the same origin: no build step, no extra port.

Requires Node 22.18+ (it runs the TypeScript sources directly). It shares its schemas with the site ([src/lib/schemas.ts](../src/lib/schemas.ts)), so anything it accepts the build accepts too.

Writes land in `src/content/` as ordinary files. Review with `git diff`, then commit.

## Bulk import

`POST /api/import` with `Content-Type: application/json`:

```json
{
  "tags": {
    "philosophy": { "label": "Philosophy", "color": "#b5651d", "categories": ["Knowledge"] }
  },
  "entries": [
    {
      "id": "death-of-socrates",
      "title": "Death of Socrates",
      "summary": "Athens executes the philosopher by hemlock.",
      "date": { "year": -399 },
      "tags": ["philosophy", "politics"],
      "body": "Optional Markdown article text."
    }
  ]
}
```

- `tags` is optional. Entries may reference tags declared in the same payload or tags that already exist.
- `id` is optional; it defaults to a slug of the title. Ids are lowercase letters, digits and single hyphens, and become the filename and URL.
- `date` / `end`: `year` (negative = BCE, no year 0), optional `month`, `day`, `circa`.
- `sources` (optional): a list of http(s) URLs where the claim can be checked. They render as links at the bottom of the entry page.
- `translations` (optional on entries and tags): `{ "es": { "title": "…", "summary": "…" } }` for entries, `{ "es": { "label": "…", "description": "…" } }` for tags. Stored in the entry's frontmatter / the tag's JSON.
- Unknown keys are rejected, so typos fail instead of being dropped.

**All-or-nothing:** the whole payload is validated first. If anything is wrong you get a `422` listing every problem with its path (`entries[3].date.year`), and nothing is written.

Query parameters:

| Param | Effect |
|---|---|
| `dry=1` | Validate and report what would happen; write nothing. |
| `onConflict=fail` (default) | An existing entry id, or a tag that exists with different content, is an error. |
| `onConflict=skip` | Leave existing ones untouched. |
| `onConflict=overwrite` | Replace existing ones. |

A tag re-declared with identical content is never a conflict.

```
curl -X POST "localhost:4322/api/import?dry=1" -H "Content-Type: application/json" --data-binary @admin/sample-import.json
```

An entry's year must fall inside the span covered by `src/content/eras.json`, matching the build's own check.

## Other endpoints

| | |
|---|---|
| `GET /api/tags` | All tags. |
| `PUT /api/tags/:id` | Create or replace one tag (body is the tag object). |
| `DELETE /api/tags/:id` | Delete a tag; `409` if any entry uses it. |
| `GET /api/entries?tag=&q=` | List entries (id, title, summary, dates, tags; no bodies), optionally filtered by tag or text. |
| `POST /api/retag` | Bulk add/remove tags on existing entries (see below). |
| `GET /api/entries/:id` | One entry, with body. |
| `POST /api/entries` | Create one entry (`409`-style conflict if the id exists). |
| `PUT /api/entries/:id` | Replace one entry. |
| `DELETE /api/entries/:id` | Delete one entry. |

## Bulk retag

`POST /api/retag` (add `?dry=1` to preview) with:

```json
{ "add": { "war": ["hundred-years-war", "battle-of-bouvines"] }, "remove": { "politics": ["some-entry"] } }
```

An optional `tags` block (same shape as import) creates new tags in the same step, so a new tag and its first uses are one reviewed, all-or-nothing change. A tag that already exists with different content is rejected.

Same all-or-nothing rules as import: unknown tags or entries, an entry left with no tags, or the same tag both added and removed all return a `422` and write nothing. Entries that already have (or lack) the tag are reported as `unchanged`. Only the `tags:` line of each file changes, so `git diff` shows exactly the tag edit. The Import tab recognizes this shape too. The Tags tab has a review panel: it loads a retag draft, dry-runs it, lists each proposed change with a checkbox, and applies only the ticked ones (it sends a reduced payload to this endpoint, and drops declared new tags nothing is added to).


- Only `Host: localhost:PORT` / `127.0.0.1:PORT` is served (blocks DNS rebinding).
- Writes require `application/json` and no CORS headers are sent, so other websites open in your browser cannot call it.
- Writes are serialized and each file is written through a temp file and renamed.
- Ids are validated before touching the filesystem, so they can't escape `src/content/entries/`.
- The UI page is served with a CSP that allows no external resources and forbids framing, and it renders all data as text.
- Deleting an era boundary or editing `eras.json` / `featured.json` is still done by hand.

## Drafting with AI

The project skill `/research-events <topic>` (see [.claude/skills/research-events/SKILL.md](../.claude/skills/research-events/SKILL.md)) researches a topic on the web, writes a draft to `admin/drafts/` (gitignored), and dry-runs it against this API. It never imports on its own; you review the draft and import it from the Import tab.

The project skill `/retag <tag-id>` (see [.claude/skills/retag/SKILL.md](../.claude/skills/retag/SKILL.md)) is for applying a tag retroactively. Give it an existing tag, or `/retag new: <what it covers>` to have it design the tag as well. It searches existing entries for plausible matches (cheap keyword and co-tag search, not a full sweep, so best for specific tags) and writes one retag draft to `admin/drafts/` for you to review and apply.
