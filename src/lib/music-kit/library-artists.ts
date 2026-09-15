import type { LibraryAlbum } from "@/lib/music-kit/album";
import { getMusicKit } from "@/lib/music-kit/instance";
import { readArtistRef, readItems, readRelated, type Artwork } from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";
import { matchesSearch } from "@/lib/search";

const STALE = 60 * 60 * 1000;

export interface LibraryArtist {
  name: string;
  albumCount: number;
  artwork?: Artwork;
}

export function readLibraryArtists(albums: LibraryAlbum[]): LibraryArtist[] {
  const byName = new Map<string, LibraryArtist>();

  for (const album of albums) {
    const name = album.artist?.name;

    if (name === undefined) {
      continue;
    }

    const found = byName.get(name);

    if (found) {
      found.albumCount += 1;
      found.artwork ??= album.artwork;
      continue;
    }

    byName.set(name, { name, albumCount: 1, artwork: album.artwork });
  }

  return [...byName.values()].toSorted((a, b) => a.name.localeCompare(b.name));
}

export function searchArtists(artists: LibraryArtist[], term: string): LibraryArtist[] {
  return artists.filter((artist) => matchesSearch(term, artist.name));
}

export function albumsOfArtist(albums: LibraryAlbum[], name: string): LibraryAlbum[] {
  return albums.filter((album) => album.artist?.name === name);
}

export function pickArtistId(artists: { id?: string; name: string }[], name: string): string {
  const found = artists.find((artist) => artist.name === name) ?? artists[0];

  return found?.id ?? "";
}

export async function fetchCatalogArtistId(
  album: Pick<LibraryAlbum, "type" | "id">,
  name: string,
): Promise<string> {
  const music = await getMusicKit();

  try {
    const path = await catalogAlbumPath(album);
    const { data } = await music.api.music(path, { include: "artists" });
    const [first] = readItems(data);
    const relationships = (first as { relationships?: unknown } | undefined)?.relationships;

    return pickArtistId(readRelated(relationships, "artists", readArtistRef), name);
  } catch {
    return "";
  }
}

async function catalogAlbumPath({ type, id }: Pick<LibraryAlbum, "type" | "id">): Promise<string> {
  if (type === "library-albums") {
    return `/v1/me/library/albums/${encodeURIComponent(id)}/catalog`;
  }

  const storefront = await fetchStorefront();

  return `/v1/catalog/${storefront.id}/albums/${encodeURIComponent(id)}`;
}

export function catalogArtistIdQuery(album: LibraryAlbum | undefined, name: string) {
  return {
    queryKey: ["music-kit", "catalog-artist-id", album?.type, name],
    queryFn: () => fetchCatalogArtistId(album ?? { type: "library-albums", id: "" }, name),
    enabled: album !== undefined,
    staleTime: STALE,
  };
}
