import { intlFormat } from "date-fns";
import { useMemo } from "react";
import { ArtistLinks } from "@/components";
import { EmptyStates } from "@/components/empty-states";
import { useSearch, useSignedInQuery } from "@/hooks";
import { releaseYear } from "@/lib/format";
import {
  albumQuery,
  type AlbumType,
  isAlbumInLibrary,
  libraryAlbumSongsQuery,
  libraryAlbumsQuery,
  markInLibrary,
} from "@/lib/music-kit/album";
import { searchSongs } from "@/lib/music-kit/track";
import { DetailsFooter } from "./details-footer";
import { DetailsHeader } from "./details-header";
import { DetailsShell } from "./details-shell";
import { HiddenItems } from "./hidden-items";
import { LibraryMark } from "./library-mark";
import { TrackList } from "./track-list";

export function AlbumDetails({ type, id }: { type: AlbumType; id: string }) {
  const { data: album, isPending } = useSignedInQuery(albumQuery(type, id));

  const { data: libraryAlbums } = useSignedInQuery({
    ...libraryAlbumsQuery(),
    enabled: type === "albums",
  });
  const libraryId =
    type === "library-albums" ? id : libraryAlbums?.find((it) => it.catalogId === id)?.id;

  const { data: added } = useSignedInQuery(libraryAlbumSongsQuery(libraryId));

  const songs = useMemo(() => markInLibrary(album?.songs ?? [], added), [album?.songs, added]);
  const inLibrary = isAlbumInLibrary(songs, album?.trackCount);

  const { term } = useSearch();
  const shown = useMemo(() => searchSongs(songs, term), [songs, term]);

  return (
    <DetailsShell id={`${type}-${id}`} artwork={album?.artwork} isPending={isPending}>
      {album && (
        <>
          <DetailsHeader
            artwork={album.artwork}
            name={album.name}
            subtitle={<ArtistLinks artists={album.artists} fallback={album.artist?.name} />}
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
          {shown.length === 0 && songs.length > 0 ? (
            <EmptyStates.NoMatches />
          ) : (
            <div className="flex flex-col gap-4">
              <TrackList
                songs={shown}
                primaryArtist={album.artist?.name}
                showLibraryMark={!inLibrary}
                source={{ type, id }}
              />
              <HiddenItems noun="songs" shown={shown.length} total={songs.length} />
            </div>
          )}
          <DetailsFooter songs={songs} trackCount={album.trackCount}>
            {album.releaseDate && <span>{intlFormat(album.releaseDate)}</span>}
            {album.copyright && <span className="text-center">{album.copyright}</span>}
          </DetailsFooter>
        </>
      )}
    </DetailsShell>
  );
}
