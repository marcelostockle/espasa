// Bookmarked entry ids, kept in localStorage. Only ids are stored, so bookmarks work in every locale.
// Free of `astro:*` imports so client scripts can use it.
const KEY = 'espasa:bookmarks';
export const BOOKMARKS_EVENT = 'bookmarks-changed';

let memory: string[] = []; // fallback when storage is unavailable (private mode, blocked site data)

export function getBookmarks(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (Array.isArray(raw)) return (memory = raw.filter((x): x is string => typeof x === 'string'));
  } catch {}
  return memory;
}

function save(ids: string[]) {
  memory = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  dispatchEvent(new Event(BOOKMARKS_EVENT));
}

export const isBookmarked = (id: string) => getBookmarks().includes(id);

export function toggleBookmark(id: string) {
  const ids = getBookmarks();
  save(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
}

export function removeBookmark(id: string) {
  save(getBookmarks().filter((x) => x !== id));
}
