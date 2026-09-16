import { useMemo } from "react";
import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import { matchesSearch } from "@/lib/search";
import { LibraryGrid } from "./library-grid";

export function LibraryAlbums() {
  const { open } = useView();
  const { term } = useSearch();
  const { data: albums, isPending, isError } = useSignedInQuery(libraryAlbumsQuery());

  const tiles = useMemo(
    () =>
      albums
        ?.filter((album) => matchesSearch(term, album.name, album.artist?.name))
        .map((album) => ({
          id: album.id,
          name: album.name,
          credit: album.artist?.name,
          artwork: album.artwork,
          onClick: () => open({ name: "detail", type: album.type, id: album.id }),
        })) ?? [],
    [albums, open, term],
  );

  return (
    <LibraryGrid
      name="library-albums"
      tiles={tiles}
      total={albums?.length}
      isPending={isPending}
      isError={isError}
      Empty={EmptyStates.NoAlbums}
      NotLoaded={ErrorStates.AlbumsNotLoaded}
    />
  );
}
