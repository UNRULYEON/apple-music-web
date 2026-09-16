import { queryOptions } from "@tanstack/react-query";
import { DEMO_LIBRARY } from "@/lib/demo/library";
import { demoQueryKey, readDemoMode } from "@/lib/demo/mode";
import { isRecord } from "@/lib/is-record";
import type { LibraryAlbum } from "@/lib/music-kit/album";
import { catalogPath, fetchEveryPage } from "@/lib/music-kit/api";
import { fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artwork,
  readArtistRef,
  readArtwork,
  readItems,
  readRelated,
  readRelationships,
} from "@/lib/music-kit/resource";
import { matchesSearch } from "@/lib/search";

const STALE = 60 * 60 * 1000;
const LIBRARY_ARTISTS_PATH = "/v1/me/library/artists";
const LIBRARY_ALBUMS_PATH = "/v1/me/library/albums";
const PAGE_SIZE = 100;

export type ArtistPictures = Record<string, Artwork>;

export interface LibraryArtist {
  name: string;
  albumCount: number;
  artwork?: Artwork;
}

export function groupLibraryArtists(albums: LibraryAlbum[]): LibraryArtist[] {
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

export function withPictures(
  artists: LibraryArtist[],
  pictures: ArtistPictures | undefined,
): LibraryArtist[] {
  if (!pictures) {
    return artists;
  }

  return artists.map((artist) => ({
    name: artist.name,
    albumCount: artist.albumCount,
    artwork: Object.hasOwn(pictures, artist.name) ? pictures[artist.name] : artist.artwork,
  }));
}

export async function fetchArtistPictures(): Promise<ArtistPictures> {
  const items = await fetchEveryPage(LIBRARY_ARTISTS_PATH, { include: "catalog" }, PAGE_SIZE);

  return readPictures(items, (attributes, relationships) => ({
    name: attributes.name,
    artwork: firstArtwork(relationships, "catalog"),
  }));
}

export async function fetchCatalogArtistPictures(
  albumIds: readonly string[],
): Promise<ArtistPictures> {
  const items = await fetchCatalogResources(
    albumIds.map((id) => ({ type: "albums", id })),
    { include: "artists" },
  );

  return readPictures(items, (attributes, relationships) => ({
    name: attributes.artistName,
    artwork: firstArtwork(relationships, "artists"),
  }));
}

function readPictures(
  items: unknown[],
  read: (
    attributes: Record<string, unknown>,
    relationships: unknown,
  ) => { name: unknown; artwork?: Artwork },
): ArtistPictures {
  const pictures: ArtistPictures = {};

  for (const item of items) {
    if (!isRecord(item)) {
      continue;
    }

    const attributes = isRecord(item.attributes) ? item.attributes : {};
    const { name, artwork } = read(attributes, item.relationships);

    if (typeof name === "string" && artwork && !Object.hasOwn(pictures, name)) {
      pictures[name] = artwork;
    }
  }

  return pictures;
}

function firstArtwork(relationships: unknown, name: string): Artwork | undefined {
  const [first] = readRelated(relationships, name, (value) =>
    isRecord(value) && isRecord(value.attributes)
      ? readArtwork(value.attributes.artwork)
      : undefined,
  );

  return first;
}

export function artistPicturesQuery() {
  const isDemo = readDemoMode();

  return queryOptions({
    queryKey: isDemo ? demoQueryKey("artist-pictures") : ["music-kit", "artist-pictures"],
    queryFn: isDemo ? () => fetchCatalogArtistPictures(DEMO_LIBRARY.albums) : fetchArtistPictures,
    staleTime: STALE,
  });
}

export function searchArtists(artists: LibraryArtist[], term: string): LibraryArtist[] {
  return artists.filter((artist) => matchesSearch(term, artist.name));
}

export function albumsOfArtist(albums: LibraryAlbum[], name: string): LibraryAlbum[] {
  return albums.filter((album) => album.artist?.name === name);
}

export function pickArtistId(
  artists: { id?: string; name: string }[],
  name: string,
): string | undefined {
  const found = artists.find((artist) => artist.name === name) ?? artists[0];

  return found?.id;
}

async function fetchCatalogArtistId(
  album: Pick<LibraryAlbum, "type" | "id">,
  name: string,
): Promise<string | null> {
  const music = await getMusicKit();

  try {
    const path =
      album.type === "library-albums"
        ? `${LIBRARY_ALBUMS_PATH}/${encodeURIComponent(album.id)}/catalog`
        : await catalogPath("albums", album.id);
    const { data } = await music.api.music(path, { include: "artists" });
    const [first] = readItems(data);

    return (
      pickArtistId(readRelated(readRelationships(first), "artists", readArtistRef), name) ?? null
    );
  } catch {
    return null;
  }
}

export function catalogArtistIdQuery(album: LibraryAlbum | undefined, name: string) {
  return queryOptions({
    queryKey: ["music-kit", "catalog-artist-id", album?.type, name],
    queryFn: () => fetchCatalogArtistId(album ?? { type: "library-albums", id: "" }, name),
    enabled: album !== undefined,
    staleTime: STALE,
  });
}
