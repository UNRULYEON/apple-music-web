import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import { artistPicturesQuery } from "@/lib/music-kit/library-artists";
import { libraryPlaylistsQuery } from "@/lib/music-kit/playlists";
import { recentlyPlayedQuery } from "@/lib/music-kit/recently-played";
import { useAuthStatus } from "./use-auth-status";
import { useDemoMode } from "./use-demo-mode";

export function usePrefetchLibrary(): void {
  const status = useAuthStatus();
  const client = useQueryClient();
  const isDemo = useDemoMode();

  useEffect(() => {
    if (status !== "signed-in") {
      return;
    }

    void client.prefetchQuery(recentlyPlayedQuery());
    void client.prefetchQuery(libraryAlbumsQuery());
    void client.prefetchQuery(libraryPlaylistsQuery());
    void client.prefetchQuery(artistPicturesQuery());
  }, [client, isDemo, status]);
}
