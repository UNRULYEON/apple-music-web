import type { LibraryAlbum } from "@/lib/music-kit/album";
import { getMusicKit } from "@/lib/music-kit/instance";
import { readArtistRef, readItems, readRelated, type Artwork } from "@/lib/music-kit/resource";
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

export async function fetchCatalogArtistId(albumId: string, name: string): Promise<string> {
  const music = await getMusicKit();
  const path = `/v1/me/library/albums/${encodeURIComponent(albumId)}/catalog`;

  try {
    const { data } = await music.api.music(path, { include: "artists" });
    const [first] = readItems(data);
    const relationships = (first as { relationships?: unknown } | undefined)?.relationships;

    return pickArtistId(readRelated(relationships, "artists", readArtistRef), name);
  } catch {
    return "";
  }
}

export function catalogArtistIdQuery(albumId: string | undefined, name: string) {
  return {
    queryKey: ["music-kit", "catalog-artist-id", name],
    queryFn: () => fetchCatalogArtistId(albumId ?? "", name),
    enabled: albumId !== undefined,
    staleTime: STALE,
  };
}
