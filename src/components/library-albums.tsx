import { AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { VIEW_INSET } from "@/lib/layout";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import { matchesSearch } from "@/lib/search";
import { cn } from "@/lib/utils";
import { LoadingState } from "./loading-state";
import { MediaGrid } from "./media-grid";

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
    <div className={cn("flex grow flex-col pb-4", VIEW_INSET)}>
      <AnimatePresence mode="popLayout">
        {isPending && <LoadingState key="library-albums-loading-state" />}
        {isError && !isPending && <ErrorStates.Albums key="library-albums-error-state" />}
        {albums && albums.length === 0 && !isPending && (
          <EmptyStates.NoAlbums key="library-albums-empty-state" />
        )}
        {albums && albums.length > 0 && tiles.length === 0 && !isPending && (
          <EmptyStates.NoMatches key="library-albums-no-matches-state" />
        )}
        {tiles.length > 0 && !isPending && <MediaGrid key="library-albums-list" items={tiles} />}
      </AnimatePresence>
    </div>
  );
}
