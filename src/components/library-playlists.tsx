import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { LoadingState } from "@/components/loading-state";
import { MediaGrid } from "@/components/media-grid";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { libraryPlaylistsQuery } from "@/lib/music-kit/playlists";
import { VIEW_INSET } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";
import { AnimatePresence } from "motion/react";
import { useMemo } from "react";

export function LibraryPlaylists() {
  const { open } = useView();
  const { term } = useSearch();
  const { data: playlists, isPending, isError } = useSignedInQuery(libraryPlaylistsQuery());

  const tiles = useMemo(
    () =>
      playlists
        ?.filter((playlist) => matchesSearch(term, playlist.name, playlist.description))
        .map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          credit: playlist.description,
          artwork: playlist.artwork,
          onClick: () => open({ name: "detail", type: "library-playlists", id: playlist.id }),
        })) ?? [],
    [playlists, open, term],
  );

  return (
    <div className={cn("flex flex-col grow pb-4", VIEW_INSET)}>
      <AnimatePresence mode="popLayout">
        {isPending && <LoadingState key="library-playlists-loading-state" />}
        {isError && !isPending && <ErrorStates.Playlists key="library-playlists-error-state" />}
        {playlists && playlists.length === 0 && !isPending && (
          <EmptyStates.NoPlaylists key="library-playlists-empty-state" />
        )}
        {playlists && playlists.length > 0 && tiles.length === 0 && !isPending && (
          <EmptyStates.NoMatches key="library-playlists-no-matches-state" />
        )}
        {tiles.length > 0 && !isPending && <MediaGrid key="library-playlists-list" items={tiles} />}
      </AnimatePresence>
    </div>
  );
}
