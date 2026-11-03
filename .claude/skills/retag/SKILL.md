---
name: retag
description: Apply a tag retroactively. Either for an existing tag, or by designing a brand-new tag (best for specific ones: a person, a place) and finding existing entries it should cover. Prepares one reviewable draft. Uses a cheap keyword/co-tag candidate search, not a full sweep. Never applies changes on its own.
argument-hint: <tag-id> | since <commit or date> | new: <what the new tag covers>
---

You are preparing a **draft** of tag additions for existing entries, so a tag also covers older entries that deserve it. The human reviews the draft before anything changes. The tag may already exist, or you may be asked to design it (`new:`).

Input: $ARGUMENTS

## Tags and places are different

A **tag** is a topic readers filter by (a person, a people, a theme); this skill adds tags to entries. A **place** is a link from an entry to a Wikipedia article that opens a popup, and lives in `places:`. A tag for a place (for example `spain`) is still a tag and is handled here. If the user wants popups on entries, that is `/link-places`, not this skill. This skill only ever changes the `tags:` line and ignores the `places` field the list endpoint returns.

## Design constraints (decided with the owner)

- **Cheap candidate search, not an exhaustive sweep.** Find plausible candidates with the API's text search and tag overlap, then judge only those. A few misses are acceptable, especially for very broad tags (war, politics); specific tags should match easily.
- **Precision over recall.** A wrong tag is worse than a missing one. Add a tag only when the event is genuinely relevant to the topic, not merely mentioning it.
- **Only titles and summaries**, read from the list endpoint. Read an entry's body (`GET /api/entries/:id`) only when title and summary are truly ambiguous.
- Judge from the **English** title and summary; ignore the `translations` field the list endpoint may return.
- Only propose **additions** unless the user explicitly asks for removals.

## Procedure

1. **Check the admin server.** `curl -s localhost:4322/api/tags`. If it does not answer, start it with `npm run admin` as a *background task* and stop that same background task when you finish. If port 4322 is taken by something that is not answering this API, use `ADMIN_PORT=<other>` and adjust the URLs. Never kill processes by name; other Node processes on this machine are not yours.

2. **Resolve the target tags.**
   - `new: <description>` (optionally with a suggested id or label): you design a **new tag**, described under "Designing a new tag" below, and it goes into the draft's `tags` block. Check first that no existing tag already covers it; if one does, say so and stop instead of creating a near-duplicate.
   - Tag ids given directly: confirm each exists in `GET /api/tags`. Stop and say so if one does not.
   - `since <commit|date>`: tags added since then are the keys of `src/content/tags.json` now that were not there at that point (`git show <rev>:src/content/tags.json`; for a date, use the parent of the oldest commit touching that file since the date via `git log --since=<date> --format=%H -- src/content/tags.json`). Ignore uncommitted state beyond what the user asked about.
   - Do not touch or commit anything under `src/content/`; the working tree may hold the owner's uncommitted work.

   For a `new:` tag, if the request is broad (a whole field like "war" or "politics" rather than a specific person, place, or thing), still do it, but warn in the report that the candidate search is weak for broad tags with no existing members.

3. **Understand each tag.** Read its `label`, `description` and `categories`. The description is your criterion. If it is missing or vague, say in the report how you interpreted the tag, so the owner can correct you.

4. **Find candidates (per tag).**
   - Fetch the full list once: `GET /api/entries` (id, title, summary, date, tags).
   - A **new** tag has no members to learn from, so the co-tag step below is unavailable. Rely on search terms from your own description (names, aliases, places, spellings and translations), and be correspondingly more generous with search terms.
   - Derive roughly 5-15 search terms from the tag: its label, synonyms, key people, places, institutions, typical vocabulary. Run `GET /api/entries?q=<term>` for each (URL-encode terms).
   - Add entries that share tags with entries already carrying the tag, when they also fall inside that tag's date span.
   - Remove entries that already have the tag.
   - Rank candidates by how many signals matched. If there are more than about 150, review the top 150 and say that you truncated.

5. **Judge each candidate** from its title and summary against the tag's description. Keep two groups: **high** confidence and **medium** confidence. Drop the rest. Write a one-sentence reason for each kept entry.

6. **Write the draft files** (the `admin/drafts/` folder is gitignored):
   - `admin/drafts/retag-<tag>.json`, exactly this shape and nothing else (unknown keys are rejected):
     ```json
     { "add": { "<tag-id>": ["entry-id-1", "entry-id-2"] } }
     ```
     For a **new** tag, add a `tags` block with its definition. The tag is created and applied in one all-or-nothing step:
     ```json
     {
       "tags": { "<tag-id>": { "label": "…", "color": "#aabbcc", "description": "…", "categories": ["Figures"], "translations": { "es": { "label": "…", "description": "…" } } } },
       "add": { "<tag-id>": ["entry-id-1"] }
     }
     ```
     Several tags can share one file. A tag that already exists with different content is rejected; leave existing tags out of `tags`.
   - `admin/drafts/retag-<tag>.md`: a table for the human with entry id, title, date, confidence and reason, sorted high confidence first.

7. **Dry-run.** `curl -s -X POST "localhost:4322/api/retag?dry=1" -H "Content-Type: application/json" --data-binary @admin/drafts/retag-<tag>.json`. Fix any issues and repeat until it passes. Entries reported as `unchanged` (already tagged) should be removed from the draft.

8. **Stop and report.** Do **not** apply unless the user explicitly asks. Report:
   - the tag, how you read its description, and the draft paths;
   - how many entries you scanned or searched, how many candidates you reviewed, whether you truncated, and how many you propose (high vs medium);
   - the **medium-confidence** ones by name, since those need the human's judgment;
   - near-misses you rejected that the owner might disagree with, briefly;
   - for a new tag, the **proposed definition first** (id, label, color, description, categories) so the owner approves the tag and its matches together;
   - how to apply: paste the `.json` into the Import tab at http://localhost:4322 (it recognizes retag drafts; run the dry run first), or `POST /api/retag`.

Applying changes only the `tags:` line of each entry file, so `git diff` shows exactly the tags that changed.

## Designing a new tag

The description is both the public definition and your matching criterion, so write it deliberately: one sentence saying exactly what the tag covers and what it does not (for a person: who they are and their dates; for a place: which place and the period of interest).

- **id**: lowercase letters, digits and single hyphens (`medici`, not `Medici Family`). **label**: how it reads in the UI.
- **color**: `#rrggbb`, visibly different from existing tag colors (check `GET /api/tags`).
- **categories**: reuse an existing category name **exactly** as spelled. Add a new category only if none fits, and mention it in the report.
- **translations.es**: every new tag needs a Spanish `label` and `description` (natural Spanish, established forms of names, same scope as the English). The site is bilingual, and a tag without them shows its English label on the Spanish pages.
- Prefer specific tags (a person, a place, an institution). They are cheap to apply accurately.
