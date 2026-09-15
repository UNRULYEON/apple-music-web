import { DetailsHeader } from "@/components/details/details-header";
import { DetailsShell } from "@/components/details/details-shell";
import { HiddenItems } from "@/components/details/hidden-items";
import { TrackList } from "@/components/details/track-list";
import { EmptyStates } from "@/components/empty-states";
import { MediaGrid, type MediaTileItem } from "@/components/media-grid";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import {
  artistQuery,
  searchAlbums,
  searchPlaylists,
  type ArtistAlbum,
  type ArtistPlaylist,
} from "@/lib/music-kit/artists";
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

  const everyAlbum = useMemo(
    () => [
      ...new Map(
        [
          ...(artist?.albums ?? []),
          ...(artist?.singles ?? []),
          ...(artist?.compilations ?? []),
          ...(artist?.appearsOn ?? []),
        ].map((album) => [album.id, album]),
      ).values(),
    ],
    [artist?.albums, artist?.singles, artist?.compilations, artist?.appearsOn],
  );
  const foundAlbums = useMemo(() => searchAlbums(everyAlbum, term), [everyAlbum, term]);
  const foundPlaylists = useMemo(
    () => searchPlaylists(artist?.playlists ?? [], term),
    [artist?.playlists, term],
  );

  const albums = useTiles(artist?.albums, open);
  const singles = useTiles(artist?.singles, open);
  const compilations = useTiles(artist?.compilations, open);
  const appearsOn = useTiles(artist?.appearsOn, open, { showArtist: true });
  const playlists = usePlaylistTiles(artist?.playlists, open);
  const found = useTiles(foundAlbums, open);
  const foundPlaylistTiles = usePlaylistTiles(foundPlaylists, open);

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
              {found.length === 0 && foundPlaylistTiles.length === 0 && songs.length === 0 && (
                <EmptyStates.NoMatches />
              )}
              {found.length > 0 && (
                <Section title="Albums">
                  <div className="flex flex-col gap-4">
                    <MediaGrid items={found} />
                    <HiddenItems noun="albums" shown={found.length} total={everyAlbum.length} />
                  </div>
                </Section>
              )}
              {foundPlaylistTiles.length > 0 && (
                <Section title="Artist Playlists">
                  <div className="flex flex-col gap-4">
                    <MediaGrid items={foundPlaylistTiles} />
                    <HiddenItems
                      noun="playlists"
                      shown={foundPlaylistTiles.length}
                      total={artist.playlists.length}
                    />
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
              {playlists.length > 0 && (
                <Section title="Artist Playlists">
                  <MediaGrid items={playlists} />
                </Section>
              )}
              {compilations.length > 0 && (
                <Section title="Compilations">
                  <MediaGrid items={compilations} />
                </Section>
              )}
              {appearsOn.length > 0 && (
                <Section title="Appears On">
                  <MediaGrid items={appearsOn} />
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
  { showArtist = false }: { showArtist?: boolean } = {},
): MediaTileItem[] {
  return useMemo(
    () =>
      albums?.map((album) => ({
        id: album.id,
        name: album.name,
        credit: showArtist
          ? album.artist?.name
          : album.releaseDate
            ? releaseYear(album.releaseDate)
            : undefined,
        artwork: album.artwork,
        onClick: () => open({ name: "detail", type: "albums", id: album.id }),
      })) ?? [],
    [albums, open, showArtist],
  );
}

function usePlaylistTiles(
  playlists: ArtistPlaylist[] | undefined,
  open: ReturnType<typeof useView>["open"],
): MediaTileItem[] {
  return useMemo(
    () =>
      playlists?.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        credit: playlist.curator?.name,
        artwork: playlist.artwork,
        onClick: () => open({ name: "detail", type: "playlists", id: playlist.id }),
      })) ?? [],
    [playlists, open],
  );
}
