import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDemoMode } from "@/lib/demo/mode";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { recentlyPlayedQuery } from "@/lib/music-kit/recently-played";

export function usePrefetchRecentlyPlayed(): void {
  const status = useAuthStatus();
  const client = useQueryClient();
  const isDemo = useDemoMode();

  useEffect(() => {
    if (status !== "signed-in") {
      return;
    }

    void client.prefetchQuery(recentlyPlayedQuery());
  }, [client, isDemo, status]);
}
