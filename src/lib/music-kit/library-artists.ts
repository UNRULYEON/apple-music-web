import { DEMO_LIBRARY } from "@/lib/demo/library";
import { demoQueryKey, readDemoMode } from "@/lib/demo/mode";
import type { LibraryAlbum } from "@/lib/music-kit/album";
import { fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artwork,
  hasNextPage,
  readArtistRef,
  readArtwork,
  readItems,
  readRelated,
} from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";
import { matchesSearch } from "@/lib/search";

const STALE = 60 * 60 * 1000;
const LIBRARY_ARTISTS_PATH = "/v1/me/library/artists";
const PAGE_SIZE = 100;

export type ArtistPictures = Record<string, Artwork>;

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
  const items = await fetchLibraryArtistsFrom(0);

  return readPictures(items, (attributes, relationships) => ({
    name: attributes.name,
    artwork: firstArtwork(relationships, "catalog"),
  }));
}

async function fetchLibraryArtistsFrom(offset: number): Promise<unknown[]> {
  const music = await getMusicKit();
  const { data } = await music.api.music(LIBRARY_ARTISTS_PATH, {
    include: "catalog",
    limit: PAGE_SIZE,
    offset,
  });
  const items = readItems(data);

  if (!hasNextPage(data) || items.length < PAGE_SIZE) {
    return items;
  }

  return [...items, ...(await fetchLibraryArtistsFrom(offset + PAGE_SIZE))];
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
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const { attributes, relationships } = item as {
      attributes?: Record<string, unknown>;
      relationships?: unknown;
    };
    const { name, artwork } = read(attributes ?? {}, relationships);

    if (typeof name === "string" && artwork && !Object.hasOwn(pictures, name)) {
      pictures[name] = artwork;
    }
  }

  return pictures;
}

function firstArtwork(relationships: unknown, name: string): Artwork | undefined {
  const [first] = readRelated(relationships, name, (value) =>
    readArtwork((value as { attributes?: { artwork?: unknown } } | null)?.attributes?.artwork),
  );

  return first;
}

export function artistPicturesQuery() {
  const isDemo = readDemoMode();

  return {
    queryKey: isDemo ? demoQueryKey("artist-pictures") : ["music-kit", "artist-pictures"],
    queryFn: isDemo ? () => fetchCatalogArtistPictures(DEMO_LIBRARY.albums) : fetchArtistPictures,
    staleTime: STALE,
  };
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
