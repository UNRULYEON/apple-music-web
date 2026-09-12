import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { LoadingState } from "@/components/loading-state";
import { MediaGrid } from "@/components/media-grid";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import { readLibraryArtists, searchArtists } from "@/lib/music-kit/library-artists";
import { count } from "@/lib/format";
import { VIEW_INSET } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";
import { useMemo } from "react";

export function LibraryArtists() {
  const { open } = useView();
  const { term } = useSearch();
  const { data: albums, isPending, isError } = useSignedInQuery(libraryAlbumsQuery());

  const artists = useMemo(() => readLibraryArtists(albums ?? []), [albums]);

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
    <div className={cn("flex flex-col grow pb-4", VIEW_INSET)}>
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
