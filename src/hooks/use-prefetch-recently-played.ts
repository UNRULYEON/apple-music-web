import { useAuthStatus } from "@/lib/music-kit/auth";
import { recentlyPlayedQuery } from "@/lib/music-kit/recently-played";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// fetched while a person reads a detail view, so the way back holds no spinner
export function usePrefetchRecentlyPlayed(): void {
  const status = useAuthStatus();
  const client = useQueryClient();

  useEffect(() => {
    if (status !== "signed-in") {
      return;
    }

    void client.prefetchQuery(recentlyPlayedQuery());
  }, [client, status]);
}
