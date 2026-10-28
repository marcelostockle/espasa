---
name: retag
description: After a new tag is approved, look through existing entries for ones it should also apply to and prepare a reviewable draft of tag additions. Uses a cheap keyword/co-tag candidate search, not a full sweep. Never applies changes on its own.
argument-hint: <tag-id> [more tag ids, or "since <commit or date>"]
---

You are preparing a **draft** of tag additions for existing entries, so a newly created tag also covers older entries that deserve it. The human reviews the draft before anything changes.

Input: $ARGUMENTS

## Design constraints (decided with the owner)

- **Cheap candidate search, not an exhaustive sweep.** Find plausible candidates with the API's text search and tag overlap, then judge only those. A few misses are acceptable, especially for very broad tags (war, politics); specific tags should match easily.
- **Precision over recall.** A wrong tag is worse than a missing one. Add a tag only when the event is genuinely relevant to the topic, not merely mentioning it.
- **Only titles and summaries**, read from the list endpoint. Read an entry's body (`GET /api/entries/:id`) only when title and summary are truly ambiguous.
- Only propose **additions** unless the user explicitly asks for removals.

## Procedure

1. **Check the admin server.** `curl -s localhost:4322/api/tags`. If it does not answer, start it with `npm run admin` as a *background task* and stop that same background task when you finish. If port 4322 is taken by something that is not answering this API, use `ADMIN_PORT=<other>` and adjust the URLs. Never kill processes by name; other Node processes on this machine are not yours.

2. **Resolve the target tags.**
   - Tag ids given directly: confirm each exists in `GET /api/tags`. Stop and say so if one does not.
   - `since <commit|date>`: tags added since then are the keys of `src/content/tags.json` now that were not there at that point (`git show <rev>:src/content/tags.json`; for a date, use the parent of the oldest commit touching that file since the date via `git log --since=<date> --format=%H -- src/content/tags.json`). Ignore uncommitted state beyond what the user asked about.
   - Do not touch or commit anything under `src/content/`; the working tree may hold the owner's uncommitted work.

3. **Understand each tag.** Read its `label`, `description` and `categories`. The description is your criterion. If it is missing or vague, say in the report how you interpreted the tag, so the owner can correct you.

4. **Find candidates (per tag).**
   - Fetch the full list once: `GET /api/entries` (id, title, summary, date, tags).
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
     Several tags can share one file.
   - `admin/drafts/retag-<tag>.md`: a table for the human with entry id, title, date, confidence and reason, sorted high confidence first.

7. **Dry-run.** `curl -s -X POST "localhost:4322/api/retag?dry=1" -H "Content-Type: application/json" --data-binary @admin/drafts/retag-<tag>.json`. Fix any issues and repeat until it passes. Entries reported as `unchanged` (already tagged) should be removed from the draft.

8. **Stop and report.** Do **not** apply unless the user explicitly asks. Report:
   - the tag, how you read its description, and the draft paths;
   - how many entries you scanned or searched, how many candidates you reviewed, whether you truncated, and how many you propose (high vs medium);
   - the **medium-confidence** ones by name, since those need the human's judgment;
   - near-misses you rejected that the owner might disagree with, briefly;
   - how to apply: paste the `.json` into the Import tab at http://localhost:4322 (it recognizes retag drafts; run the dry run first), or `POST /api/retag`.

Applying changes only the `tags:` line of each entry file, so `git diff` shows exactly the tags that changed.
