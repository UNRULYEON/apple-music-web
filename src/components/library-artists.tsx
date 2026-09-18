import { useMemo } from "react";
import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { count } from "@/lib/format";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import {
  artistPicturesQuery,
  groupLibraryArtists,
  searchArtists,
  withPictures,
} from "@/lib/music-kit/library-artists";
import { LibraryGrid } from "./library-grid";

export function LibraryArtists() {
  const { open } = useView();
  const { term } = useSearch();
  const { data: albums, isPending, isError } = useSignedInQuery(libraryAlbumsQuery());

  const { data: pictures, isError: hasNoPictures } = useSignedInQuery(artistPicturesQuery());

  const artists = useMemo(
    () => withPictures(groupLibraryArtists(albums ?? []), hasNoPictures ? {} : pictures),
    [albums, pictures, hasNoPictures],
  );

  const tiles = useMemo(
    () =>
      searchArtists(artists, term).map((artist) => ({
        id: artist.name,
        name: artist.name,
        credit: count(artist.albumCount, "album"),
        artwork: artist.artwork,
        onClick: () => open({ name: "detail", type: "library-artists", id: artist.name }),
      })),
    [artists, open, term],
  );

  return (
    <LibraryGrid
      name="library-artists"
      tiles={tiles}
      total={albums && artists.length}
      isPending={isPending}
      isError={isError}
      Empty={EmptyStates.NoArtists}
      NotLoaded={ErrorStates.ArtistsNotLoaded}
    />
  );
}
