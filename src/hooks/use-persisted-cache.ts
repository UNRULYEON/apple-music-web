import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  CACHE_MAX_AGE,
  CACHE_VERSION,
  createCachePersister,
} from "@/integrations/tanstack-query/persister";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { browserStorage } from "@/lib/storage/local";

export function usePersistedCache(): void {
  const status = useAuthStatus();
  const client = useQueryClient();

  useEffect(() => {
    const storage = browserStorage();

    if (status !== "signed-in" || !storage) {
      return;
    }

    const [unsubscribe, restored] = persistQueryClient({
      queryClient: client,
      persister: createCachePersister(storage),
      maxAge: CACHE_MAX_AGE,
      buster: CACHE_VERSION,
    });

    void restored
      .catch(() => undefined)
      .then(() => client.invalidateQueries())
      .catch(() => undefined);

    return unsubscribe;
  }, [client, status]);
}
