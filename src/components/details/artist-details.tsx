import { DetailsHeader } from "@/components/details/details-header";
import { DetailsShell } from "@/components/details/details-shell";
import { HiddenItems } from "@/components/details/hidden-items";
import { TrackList } from "@/components/details/track-list";
import { EmptyStates } from "@/components/empty-states";
import { MediaGrid, type MediaTileItem } from "@/components/media-grid";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { artistQuery, searchAlbums, type ArtistAlbum } from "@/lib/music-kit/artists";
import { searchSongs } from "@/lib/music-kit/track";
import { releaseYear } from "@/lib/format";
import { useMemo, type ReactNode } from "react";

export function ArtistDetails({ id }: { id: string }) {
  const { open } = useView();
  const { term } = useSearch();
  const { data: artist, isPending } = useSignedInQuery(artistQuery(id));

  const source = { type: "artists", id } as const;
  const isSearching = term.trim() !== "";

  const topSongs = artist?.topSongs;
  const songs = useMemo(() => searchSongs(topSongs ?? [], term), [topSongs, term]);

  // a search looks through everything the screen holds, so the albums and the singles
  // answer it as one list. An album Apple puts in both views must show up once.
  const everyAlbum = useMemo(
    () => [
      ...new Map(
        [...(artist?.albums ?? []), ...(artist?.singles ?? [])].map((album) => [album.id, album]),
      ).values(),
    ],
    [artist?.albums, artist?.singles],
  );
  const foundAlbums = useMemo(() => searchAlbums(everyAlbum, term), [everyAlbum, term]);

  const albums = useTiles(artist?.albums, open);
  const singles = useTiles(artist?.singles, open);
  const found = useTiles(foundAlbums, open);

  return (
    <DetailsShell id={`artists-${id}`} artwork={artist?.artwork} isPending={isPending}>
      {artist && (
        <>
          <DetailsHeader
            artwork={artist.artwork}
            name={artist.name}
            meta={artist.genres.length > 0 && <span>{artist.genres.join(", ")}</span>}
            songs={artist.topSongs}
            source={source}
          />
          {isSearching ? (
            <>
              {found.length === 0 && songs.length === 0 && <EmptyStates.NoMatches />}
              {found.length > 0 && (
                <Section title="Albums">
                  <div className="flex flex-col gap-4">
                    <MediaGrid items={found} />
                    <HiddenItems noun="albums" shown={found.length} total={everyAlbum.length} />
                  </div>
                </Section>
              )}
              {songs.length > 0 && (
                <Section title="Songs">
                  <div className="flex flex-col gap-4">
                    <TrackList songs={songs} showArtwork source={source} />
                    <HiddenItems noun="songs" shown={songs.length} total={artist.topSongs.length} />
                  </div>
                </Section>
              )}
            </>
          ) : (
            <>
              {songs.length > 0 && (
                <Section title="Top Songs">
                  <TrackList songs={songs} showArtwork source={source} />
                </Section>
              )}
              {albums.length > 0 && (
                <Section title="Albums">
                  <MediaGrid items={albums} />
                </Section>
              )}
              {singles.length > 0 && (
                <Section title="Singles and EPs">
                  <MediaGrid items={singles} />
                </Section>
              )}
            </>
          )}
        </>
      )}
    </DetailsShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-lg">{title}</h2>
      {children}
    </section>
  );
}

function useTiles(
  albums: ArtistAlbum[] | undefined,
  open: ReturnType<typeof useView>["open"],
): MediaTileItem[] {
  return useMemo(
    () =>
      albums?.map((album) => ({
        id: album.id,
        name: album.name,
        // every album here is by the same artist, so the year tells a person more
        credit: album.releaseDate ? releaseYear(album.releaseDate) : undefined,
        artwork: album.artwork,
        onClick: () => open({ name: "detail", type: "albums", id: album.id }),
      })) ?? [],
    [albums, open],
  );
}
