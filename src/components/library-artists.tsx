import { AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { count } from "@/lib/format";
import { VIEW_INSET } from "@/lib/layout";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import {
  artistPicturesQuery,
  groupLibraryArtists,
  searchArtists,
  withPictures,
} from "@/lib/music-kit/library-artists";
import { cn } from "@/lib/utils";
import { LoadingState } from "./loading-state";
import { MediaGrid } from "./media-grid";

export function LibraryArtists() {
  const { open } = useView();
  const { term } = useSearch();
  const { data: albums, isPending, isError } = useSignedInQuery(libraryAlbumsQuery());

  const { data: pictures } = useSignedInQuery(artistPicturesQuery());

  const artists = useMemo(
    () => withPictures(groupLibraryArtists(albums ?? []), pictures),
    [albums, pictures],
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
    <div className={cn("flex grow flex-col pb-4", VIEW_INSET)}>
      <AnimatePresence mode="popLayout">
        {isPending && <LoadingState key="library-artists-loading-state" />}
        {isError && !isPending && <ErrorStates.Artists key="library-artists-error-state" />}
        {albums && artists.length === 0 && !isPending && (
          <EmptyStates.NoArtists key="library-artists-empty-state" />
        )}
        {artists.length > 0 && tiles.length === 0 && !isPending && (
          <EmptyStates.NoMatches key="library-artists-no-matches-state" />
        )}
        {tiles.length > 0 && !isPending && <MediaGrid key="library-artists-list" items={tiles} />}
      </AnimatePresence>
    </div>
  );
}
