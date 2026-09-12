import { ArtistDetails } from "@/components/details/artist-details";
import { DetailsShell } from "@/components/details/details-shell";
import { EmptyStates } from "@/components/empty-states";
import { MediaGrid } from "@/components/media-grid";
import { useSearch, useSignedInQuery, useView } from "@/hooks";
import { libraryAlbumsQuery, type LibraryAlbum } from "@/lib/music-kit/album";
import { albumsOfArtist, catalogArtistIdQuery } from "@/lib/music-kit/library-artists";
import { matchesSearch } from "@/lib/search";
import { useMemo } from "react";

export function LibraryArtistDetails({ id }: { id: string }) {
  const { data: albums, isPending: isLoadingAlbums } = useSignedInQuery(libraryAlbumsQuery());

  const mine = useMemo(() => albumsOfArtist(albums ?? [], id), [albums, id]);
  const first = mine[0];

  const { data: artistId, isPending: isLookingUp } = useSignedInQuery(
    catalogArtistIdQuery(first?.id, id),
  );

  if (artistId) {
    return <ArtistDetails id={artistId} />;
  }

  return (
    <OwnAlbums
      name={id}
      albums={mine}
      isPending={isLoadingAlbums || (first !== undefined && isLookingUp)}
    />
  );
}

function OwnAlbums({
  name,
  albums,
  isPending,
}: {
  name: string;
  albums: LibraryAlbum[];
  isPending: boolean;
}) {
  const { open } = useView();
  const { term } = useSearch();

  const tiles = useMemo(
    () =>
      albums
        .filter((album) => matchesSearch(term, album.name))
        .map((album) => ({
          id: album.id,
          name: album.name,
          artwork: album.artwork,
          onClick: () => open({ name: "detail", type: "library-albums", id: album.id }),
        })),
    [albums, open, term],
  );

  return (
    <DetailsShell id={`library-artists-${name}`} artwork={albums[0]?.artwork} isPending={isPending}>
      <h1 className="font-bold text-xl sm:text-2xl">{name}</h1>
      {tiles.length > 0 ? <MediaGrid items={tiles} /> : <EmptyStates.NoMatches />}
    </DetailsShell>
  );
}
