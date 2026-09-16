import { readAuthStatus } from "@/lib/music-kit/auth";
import { removeOldestQuery, type Persister } from "@tanstack/query-persist-client-core";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const KEY = "apple-music-web.cache";

export const CACHE_VERSION = "3";

export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export function createCachePersister(storage: Storage): Persister {
  const persister = createAsyncStoragePersister({
    storage,
    key: KEY,
    retry: removeOldestQuery,
  });

  return {
    ...persister,
    persistClient: (client) =>
      readAuthStatus() === "signed-in" ? persister.persistClient(client) : persister.removeClient(),
  };
}

export function removeStoredCache(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
