// Fills src/content/place-snapshots.json from Wikipedia. Usage:
//   npm run places:snapshot              # only places that have no snapshot yet
//   npm run places:snapshot -- --refresh # re-fetch every place
// The result is committed, so builds never call Wikipedia.
import * as store from './store.ts';
import { lookupArticle } from './wikipedia.ts';

const refresh = process.argv.includes('--refresh');
const places = await store.readPlaces();
const snapshots = await store.readSnapshots();

let failed = 0;
for (const [id, place] of Object.entries(places)) {
  if (snapshots[id] && !refresh) continue;
  const result = await lookupArticle(String(place.wikipedia));
  if (result.ok) {
    snapshots[id] = result.snapshot;
    console.log(`ok    ${id}${result.snapshot.es ? '' : ' (no Spanish article)'}`);
  } else {
    failed++;
    console.error(`FAIL  ${id}: ${result.problem}`);
  }
}
// Drop snapshots whose place no longer exists.
for (const id of Object.keys(snapshots)) if (!(id in places)) delete snapshots[id];
await store.writeSnapshots(snapshots);
if (failed) process.exitCode = 1;
