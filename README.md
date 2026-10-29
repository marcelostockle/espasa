# Espasa

A read-only encyclopedic timeline. Entries are dated events from any field of human activity, shown in chronological order across topics, and tagged so visitors can follow one topic or compare several side by side.

It is a static site ([Astro](https://astro.build)): entries and tags are plain files in `src/content/`, validated at build time, with no database and no user accounts.

## Commands

| Command | Does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server (search is unavailable here) |
| `npm run build` | Build the site to `dist/` and index it for search |
| `npm run preview` | Serve the built site |
| `npm run admin` | Local content admin at http://localhost:4322 (never deploy) |

## Adding content

Content goes in through reviewed drafts, using the admin tool and two Claude Code skills (`/research-events`, `/retag`). See:

- [docs/content-workflow.md](docs/content-workflow.md): the workflow, rules and checklists
- [admin/README.md](admin/README.md): the admin API reference

## Layout

```
src/content/    entries/*.md, tags.json, eras.json, featured.json
src/lib/        shared schemas, date helpers
src/pages/      home, eras, tags, entries, compare view
admin/          local admin server and UI (not part of the site)
.claude/skills/ research-events, retag
docs/           workflow guide
```
