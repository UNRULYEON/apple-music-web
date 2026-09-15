import { readAuthStatus } from "@/lib/music-kit/auth";
import { removeOldestQuery, type Persister } from "@tanstack/query-persist-client-core";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const KEY = "apple-music-web.cache";

// a stored cache that this app can no longer read is thrown away instead of guessed
// at. Raise the number whenever the shape of what is stored changes.
export const CACHE_VERSION = "3";

// a day, after which what Apple Music said is too old to show while the new answer
// is on its way
export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export function createCachePersister(storage: Storage): Persister {
  const persister = createAsyncStoragePersister({
    storage,
    key: KEY,
    // a cache too big for the browser drops its oldest answers instead of storing none
    retry: removeOldestQuery,
  });

  return {
    ...persister,
    // a write waits a moment, so one that lands after a person leaves must take the
    // library of that person out of the browser instead of putting it back in
    persistClient: (client) =>
      readAuthStatus() === "signed-in" ? persister.persistClient(client) : persister.removeClient(),
  };
}

// a browser can turn its storage down, and a cache that cannot be taken out is no
// reason to stop the app
export function removeStoredCache(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // there is nothing left to do about it
  }
}
