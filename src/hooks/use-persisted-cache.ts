import {
  createCachePersister,
  CACHE_MAX_AGE,
  CACHE_VERSION,
} from "@/integrations/tanstack-query/persister";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// what Apple Music said the last time is put back the moment a person is signed in, so
// the app has something to show while it asks again. The ask still happens: the answers
// that come back take the place of the ones from the browser, and are stored in turn.
export function usePersistedCache(): void {
  const status = useAuthStatus();
  const client = useQueryClient();

  useEffect(() => {
    if (status !== "signed-in" || typeof localStorage === "undefined") {
      return;
    }

    const [unsubscribe, restored] = persistQueryClient({
      queryClient: client,
      persister: createCachePersister(localStorage),
      maxAge: CACHE_MAX_AGE,
      buster: CACHE_VERSION,
    });

    // a stored cache that could not be read is gone by now, and this asks for
    // everything again. A cache that was read is shown while the same ask happens.
    void restored
      .catch(() => undefined)
      .then(() => client.invalidateQueries())
      .catch(() => undefined);

    return unsubscribe;
  }, [client, status]);
}
