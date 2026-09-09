import { DetailsFooter } from "@/components/details/details-footer";
import { DetailsHeader } from "@/components/details/details-header";
import { LibraryMark } from "@/components/details/library-mark";
import { DetailsShell } from "@/components/details/details-shell";
import { TrackList } from "@/components/details/track-list";
import { releaseYear } from "@/lib/format";
import { useSignedInQuery } from "@/hooks";
import {
  fetchAlbum,
  isAlbumInLibrary,
  libraryAlbumsQuery,
  libraryAlbumSongsQuery,
  markInLibrary,
  type AlbumType,
} from "@/lib/music-kit/album";
import { intlFormat } from "date-fns";
import { useMemo } from "react";

export function AlbumDetails({ type, id }: { type: AlbumType; id: string }) {
  const { data: album, isPending } = useSignedInQuery({
    queryKey: ["music-kit", "album", type, id],
    queryFn: () => fetchAlbum(type, id),
  });

  // a library album knows its own id. A catalog album must find the library album that
  // stands for it, which only the list of library albums can tell.
  const { data: libraryAlbums } = useSignedInQuery({
    ...libraryAlbumsQuery(),
    enabled: type === "albums",
  });
  const libraryId =
    type === "library-albums" ? id : libraryAlbums?.find((it) => it.catalogId === id)?.id;

  const { data: added } = useSignedInQuery(libraryAlbumSongsQuery(libraryId));

  const songs = useMemo(() => markInLibrary(album?.songs ?? [], added), [album?.songs, added]);
  const inLibrary = isAlbumInLibrary(songs, album?.trackCount);

  return (
    <DetailsShell id={`${type}-${id}`} artwork={album?.artwork} isPending={isPending}>
      {album && (
        <>
          <DetailsHeader
            artwork={album.artwork}
            name={album.name}
            subtitle={album.artist?.name}
            meta={
              <>
                <div className="inline-flex">
                  {album.genres.length > 0 && album.genres.join(", ")}
                  {album.genres.length > 0 && album.releaseDate && " • "}
                  {album.releaseDate && releaseYear(album.releaseDate)}
                </div>
                {inLibrary && (
                  <LibraryMark label="This album is in your library" size={12}>
                    In Library
                  </LibraryMark>
                )}
              </>
            }
            songs={songs}
            source={{ type, id }}
          />
          <TrackList
            songs={songs}
            primaryArtist={album.artist?.name}
            showLibraryMark={!inLibrary}
            source={{ type, id }}
          />
          <DetailsFooter songs={songs} trackCount={album.trackCount}>
            {album.releaseDate && <span>{intlFormat(album.releaseDate)}</span>}
            {album.copyright && <span className="text-center">{album.copyright}</span>}
          </DetailsFooter>
        </>
      )}
    </DetailsShell>
  );
}
