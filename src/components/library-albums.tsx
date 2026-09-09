import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { LoadingState } from "@/components/loading-state";
import { MediaGrid } from "@/components/media-grid";
import { useSignedInQuery, useView } from "@/hooks";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import { AnimatePresence } from "motion/react";
import { useMemo } from "react";

export function LibraryAlbums() {
  const { open } = useView();
  const { data: albums, isPending, isError } = useSignedInQuery(libraryAlbumsQuery());

  const tiles = useMemo(
    () =>
      albums?.map((album) => ({
        id: album.id,
        name: album.name,
        credit: album.artist?.name,
        artwork: album.artwork,
        onClick: () => open({ name: "detail", type: "library-albums", id: album.id }),
      })) ?? [],
    [albums, open],
  );

  return (
    <div className="flex flex-col grow px-4 pb-4">
      <AnimatePresence mode="popLayout">
        {isPending && <LoadingState key="library-albums-loading-state" />}
        {isError && !isPending && <ErrorStates.Albums key="library-albums-error-state" />}
        {albums && albums.length === 0 && !isPending && (
          <EmptyStates.NoAlbums key="library-albums-empty-state" />
        )}
        {tiles.length > 0 && !isPending && <MediaGrid key="library-albums-list" items={tiles} />}
      </AnimatePresence>
    </div>
  );
}
