# Content workflow

How new content gets into Espasa, and the rules we follow. This is the human guide; the skills' own instructions live in `.claude/skills/*/SKILL.md` and are what Claude actually follows. **If you change a skill's behavior, update this page too.**

## The loop

Everything follows the same loop. Nothing is written to the site's content without a human looking at it first.

1. **Draft.** A skill (or you) produces a JSON file in `admin/drafts/` (gitignored).
2. **Dry run.** The admin API validates it and reports what would happen. Nothing is written.
3. **Review.** You read the draft and the skill's report.
4. **Apply.** Entry drafts: paste the JSON into the **Import** tab and import. Retag drafts: load the file in the **Tags** tab, which shows every proposed change with a checkbox; untick what you disagree with and apply the rest. Only then are files written to `src/content/`. (The Import tab also accepts retag drafts, all-or-nothing, without the checkboxes.)
5. **Check and commit.** `git diff`, `npm run build`, then commit.

## Starting the admin tool

```
npm run admin            # UI and API at http://localhost:4322
```

- Local only. No auth. Never deploy it.
- Port taken? Set `ADMIN_PORT=4333` (skills adapt if you tell them).
- After code changes under `admin/`, **restart it**; it does not reload.
- Tabs: **Entries** (browse, edit, delete), **Tags** (edit tags and categories; review and apply retag drafts), **Import** (paste or load a JSON draft, dry run, import).
- Stop it with Ctrl+C in the terminal where it runs. Never kill Node processes by name: others on the machine may not be this project's.

## Which skill when

| I want to... | Use | Produces |
|---|---|---|
| Add events about a topic or person | `/research-events <topic and hints>` | `admin/drafts/<topic>.json`: new entries (and new tags if needed) |
| Make an existing tag cover older entries | `/retag <tag-id>` | `admin/drafts/retag-<tag>.json` + a `.md` table of reasons |
| Create a new tag and apply it to older entries | `/retag new: <what it covers>` | One draft containing the tag definition and the entries to tag |
| Review tags added recently | `/retag since <commit or date>` | Retag drafts for the tags added since then |
| Link existing entries to places (Wikipedia popups) | `/link-places <tag-id \| entries: ids \| search term>` | `admin/drafts/places-<topic>.json` + a `.md` table |

All skills stop after the dry run and a report. **None imports anything unless you explicitly ask.**

### `/research-events`
- Free text after the command is read as instructions, so give direction: scope, count, period, tag preferences, source preferences. Example: `/research-events the life of Leonardo da Vinci, only his scientific work, about 8 entries`.
- It reads the existing tags first and reuses them. It creates a new tag only when none fits.
- Every entry needs at least one source URL.
- Every entry comes with its Spanish `translations.es` (title and summary), and every new tag with a Spanish label and description. See **Languages** below.
- Events it can't source are left out, not guessed.
- Writes the Spanish title and summary of every entry (and the Spanish label and description of any new tag) into the draft, and lists in its report any phrasing it was unsure of.

### `/link-places`
- Finds the places existing entries are about and proposes links to Wikipedia articles. Precision over recall: only places the entry is genuinely about, usually one to three.
- The dry run contacts Wikipedia: every new place must resolve to a real article that is not a disambiguation page. The report's `resolved` block shows what each place resolved to; check the city is the one meant.
- Applying edits only the `places:` line of each entry and adds the places and their snapshots under `src/content/`.
- `/research-events` also proposes places for the new entries it drafts.

### `/retag`
- Uses a **cheap candidate search** (keywords and shared tags), not a full sweep. Some misses are accepted.
- It works best for **specific** tags (a person, a place, an institution). For broad tags (war, politics) it will miss more; the report says so.
- The tag's **description is the matching criterion**. Write a clear one-sentence description when you create a tag.
- It proposes additions only, unless you ask for removals.
- Applying a retag changes only the `tags:` line of each entry, so `git diff` shows exactly what changed.
- A new tag it designs includes its Spanish label and description. Matching is judged from the English text.

## Rules for the content

**Dates**
- Years are historical: negative = BCE, there is **no year 0** (1 BCE is `-1`).
- Give `month` and `day` only when sources agree. Otherwise use only the year.
- Use `circa: true` for approximate or disputed dates and say so in the summary. For a process, use `date` for the start and `end` for the finish.
- Every year must fall inside the span covered by `src/content/eras.json`. The build fails otherwise.

**Entries**
- One dated event, title and summary only (max 280 characters). No body is expected.
- Each entry should make sense on its own, next to events from other fields: name the people and places.
- Every entry has at least one tag and should have at least one `sources` URL (http/https only).
- Ids are lowercase letters, digits and single hyphens; they become the file name and the URL.
- Spanish text lives in the same file, in a `translations:` frontmatter line: `translations: {"es":{"title":"…","summary":"…"}}`. The English title and summary stay the source of truth.

**Places**
- A place is `{ label, wikipedia, translations.es.label }` in `src/content/places.json`. `wikipedia` is the English article title (not a URL). Entries list place ids in a `places:` frontmatter line; each becomes a button that opens a popup with the Wikipedia summary, a thumbnail and a map link.
- The popup text is a **generated snapshot** in `src/content/place-snapshots.json` (extract, thumbnail, coordinates, Spanish article). The admin tool writes it when a place is created; never edit it by hand. Builds never call Wikipedia.
- To refresh snapshots after Wikipedia changes: `npm run places:snapshot` (only places without one) or `npm run places:snapshot -- --refresh` (all), then review `git diff`.
- The Spanish popup uses the `es.wikipedia.org` article when English Wikipedia links to one, otherwise the English text marked as English. Wikipedia text is CC BY-SA, so the popup always credits Wikipedia and links to the article.
- The snapshot describes the place today, not as it was in the period. Pick the article that best fits the period where one exists.

**Languages**
- The site is English at the root and Spanish under `/es/`. Spanish text is stored beside the English: `translations.es` on entries (`title`, `summary` ≤ 280 chars), tags (`label`, `description`), eras (`label`) and featured items (`title`, `description`).
- Anything without a Spanish version still shows on the Spanish pages, in English and marked `lang="en"`, so a missing translation never hides content.
- Category names stay as plain English text in the data; their Spanish display names are in `src/lib/i18n.ts` (`categories`). A new category needs an entry there.
- Interface text and the date format are in `src/lib/i18n.ts` and `src/lib/time.ts`.
- Translations are drafted by the skills and reviewed by a native speaker; nothing about review is enforced by the tools.
- `eras.json` and `featured.json` are hand-edited, so add their `translations.es` by hand too.

**Tags**
- Reuse before creating. A near-duplicate tag splits the timeline.
- A tag has a label, a `#rrggbb` color distinct from existing ones, a description, optional categories, and a Spanish label and description.
- **Categories are plain text matched exactly.** `Culture` and `culture` are different categories. Pick an existing one from the Tags tab whenever possible.
- **Categories in use:**
  - `States`: governments and polities (kingdoms, empires, dynasties, caliphates).
  - `Figures`: individual people, usually one tag per person.
  - `Peoples`: collective groups and the places tied to them (a people, tribe or clan; an archipelago and its inhabitants) that are not states.
  - `Society`: wars, politics, movements and themes.
  - `Culture`: art, music, religion and ideas.
  - `Knowledge` and `Material culture`: science, learning and technology.

  A tag can have more than one category. Add a new category only when none fits, and update this list when you do.
- Specific tags are cheap to apply accurately. Broad tags are better created before entries are written than applied afterwards.

## What to check in a draft before importing

- **New tags** the skill proposes: names, descriptions, categories, colors.
- **Uncertain items**: circa dates, entries where sources disagreed, weak sources. The report lists them.
- **Medium-confidence** retag matches (listed by name in the report).
- **Skipped** entries that already exist.
- The Spanish text: facts, dates and caveats match the English, summaries fit in 280 characters, names use their usual Spanish forms.
- Spot-check a few dates against their source; the AI summarizes search results and can be wrong.

## Files and what edits them

| File | Edited by |
|---|---|
| `src/content/entries/*.md` | Import tab / API / hand |
| `src/content/places.json`, `src/content/place-snapshots.json` | Places draft / Import tab / API (snapshots: generated, never by hand) |
| `src/content/tags.json` | Tags tab, Import (via `tags`), retag with a `tags` block, or hand |
| `src/content/eras.json` | **Hand only** (must be contiguous; the build checks it) |
| `src/content/featured.json` | **Hand only** (curated comparisons on the home page) |
| `admin/drafts/` | Skills; gitignored scratch space |

## When something fails

- **`422 Validation failed`**: the response lists every problem with a path (`entries[3].date.year`). Fix the JSON and dry-run again. Nothing was written.
- **`Entry ... already exists`**: use `onConflict=skip` (leave existing) or `overwrite` in the Import tab's conflict setting.
- **`Year ... is outside every era`**: extend `eras.json` by hand first.
- **Build fails with a reference error**: an entry names a tag or place that doesn't exist. Create it first.
- **`No English Wikipedia article titled ...` / `disambiguation page`** on a place: use the exact title of the specific article (look it up on en.wikipedia.org).
- **`Could not reach Wikipedia`**: the dry run needs the network; retry.
- **Retag/new feature "not found"**: your admin server is running old code; restart it.

## Known limits

- Everything on a page is listed at once, so very large eras or tags get long. Split them when it matters.
- Search is available only in the built site (`npm run build`), not under `astro dev`.
- The retag search can miss entries that don't use the tag's keywords.
- Applying a retag or import rewrites files through the tool; hand-written frontmatter on entries touched by a full replace is normalized to JSON-style values.
