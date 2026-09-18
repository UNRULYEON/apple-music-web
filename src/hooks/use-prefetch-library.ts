import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { recentlyPlayedQuery } from "@/lib/music-kit/recently-played";
import { useAuthStatus } from "./use-auth-status";
import { useDemoMode } from "./use-demo-mode";

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
