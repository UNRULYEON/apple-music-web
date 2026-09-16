import { useMemo } from "react";
import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { libraryPlaylistsQuery } from "@/lib/music-kit/playlists";
import { matchesSearch } from "@/lib/search";
import { LibraryGrid } from "./library-grid";

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
          onClick: () => open({ name: "detail", type: playlist.type, id: playlist.id }),
        })) ?? [],
    [playlists, open, term],
  );

  return (
    <LibraryGrid
      name="library-playlists"
      tiles={tiles}
      total={playlists?.length}
      isPending={isPending}
      isError={isError}
      Empty={EmptyStates.NoPlaylists}
      NotLoaded={ErrorStates.PlaylistsNotLoaded}
    />
  );
}
