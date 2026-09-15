import { DEMO_LIBRARY } from "@/lib/demo/library";
import { demoQueryKey, readDemoMode } from "@/lib/demo/mode";
import { fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  hasNextPage,
  readArtist,
  readArtwork,
  readItems,
  readNumber,
  readRelated,
  readStandard,
  readText,
  type Artist,
  type Artwork,
} from "@/lib/music-kit/resource";
import { isSameSong, readSong, type Song } from "@/lib/music-kit/track";
import { fetchStorefront } from "@/lib/music-kit/storefront";

const TYPES = ["albums", "library-albums"] as const;
const INCLUDE = "tracks,artists";
// the artists of each song, which name one artist at a time. Without this a song holds
// only the display string "A & B", which cannot be cut into artists a person can open.
const SONG_PARAMS = { include: INCLUDE, "include[songs]": "artists" } as const;
const LIBRARY_PATH = "/v1/me/library/albums";
const CATALOG_PATH = "/catalog";
const PAGE_SIZE = 100;

export type AlbumType = (typeof TYPES)[number];

export interface AlbumArtist {
  id: string;
  name: string;
  artwork?: Artwork;
}

export interface LibraryAlbum {
  id: string;
  type: AlbumType;
  name: string;
  artist?: Artist;
  artwork?: Artwork;
  catalogId?: string;
}

export interface Album {
  id: string;
  type: AlbumType;
  name: string;
  artist?: Artist;
  artwork?: Artwork;
  releaseDate?: string;
  trackCount?: number;
  genres: string[];
  copyright?: string;
  recordLabel?: string;
  notes?: string;
  isComplete: boolean;
  isSingle: boolean;
  artists: AlbumArtist[];
  songs: Song[];
}

export function isAlbumType(value: unknown): value is AlbumType {
  return TYPES.includes(value as AlbumType);
}

// the album counts as added only when the library holds every song on it. A part of an
// album marks its songs one by one instead.
export function isAlbumInLibrary(songs: Song[], trackCount?: number): boolean {
  return (
    songs.length > 0 &&
    songs.length === (trackCount ?? songs.length) &&
    songs.every((song) => song.inLibrary === true)
  );
}

// which songs of an album the library holds. The library song and the catalog song of
// the same music carry different ids, so the two lists join on the play id.
export function markInLibrary(songs: Song[], added?: Song[]): Song[] {
  if (!added) {
    return songs;
  }

  // oxlint-disable-next-line no-map-spread -- an album holds few songs
  return songs.map((song) => ({
    ...song,
    inLibrary: added.some((track) => isSameSong(track, song)),
  }));
}

export async function fetchAlbum(type: AlbumType, id: string): Promise<Album> {
  const path = await albumPath(type, id);
  const music = await getMusicKit();
  const { data } = await music.api.music(path, SONG_PARAMS);
  const [first] = readItems(data);
  const album = readAlbum(type, first);

  if (!album) {
    throw new Error(`Apple Music returned no album for ${id}.`);
  }

  return type === "library-albums" ? withCatalogSongs(album, id) : album;
}

// a library album holds only the songs a person added. The catalog album gives the whole
// track list, so the view can show which songs are missing from the library.
async function withCatalogSongs(album: Album, id: string): Promise<Album> {
  const catalog = await fetchCatalogAlbum(id);

  if (!catalog || catalog.songs.length === 0) {
    return album;
  }

  return {
    ...catalog,
    // the library ids, so the queue and the screen keep the name they opened under
    id: album.id,
    type: album.type,
    artwork: album.artwork ?? catalog.artwork,
  };
}

// the songs the library holds from one library album
export async function fetchLibraryAlbumSongs(id: string): Promise<Song[]> {
  const music = await getMusicKit();
  const path = `${LIBRARY_PATH}/${encodeURIComponent(id)}`;
  const { data } = await music.api.music(path, { include: "tracks" });
  const [first] = readItems(data);

  return readAlbum("library-albums", first)?.songs ?? [];
}

export function libraryAlbumSongsQuery(id?: string) {
  return {
    queryKey: ["music-kit", "library-album-songs", id],
    queryFn: () => fetchLibraryAlbumSongs(id ?? ""),
    enabled: id !== undefined,
    staleTime: LIBRARY_ALBUMS_STALE,
  };
}

async function fetchCatalogAlbum(id: string): Promise<Album | undefined> {
  const music = await getMusicKit();
  const path = `${LIBRARY_PATH}/${encodeURIComponent(id)}${CATALOG_PATH}`;

  try {
    const { data } = await music.api.music(path, SONG_PARAMS);
    const [first] = readItems(data);

    return readAlbum("albums", first);
  } catch {
    // music a person uploaded has no album in the catalog
    return undefined;
  }
}

async function albumPath(type: AlbumType, id: string): Promise<string> {
  if (type === "library-albums") {
    return `${LIBRARY_PATH}/${encodeURIComponent(id)}`;
  }

  const storefront = await fetchStorefront();

  return `/v1/catalog/${storefront.id}/albums/${encodeURIComponent(id)}`;
}

export async function fetchLibraryAlbums(): Promise<LibraryAlbum[]> {
  const music = await getMusicKit();
  const albums: LibraryAlbum[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    // oxlint-disable-next-line no-await-in-loop
    const { data } = await music.api.music(LIBRARY_PATH, { limit: PAGE_SIZE, offset });
    const items = readItems(data);

    for (const item of items) {
      const album = readLibraryAlbum("library-albums", item);

      if (album) {
        albums.push(album);
      }
    }

    if (!hasNextPage(data) || items.length < PAGE_SIZE) {
      return albums;
    }
  }
}

export async function fetchCatalogAlbums(ids: readonly string[]): Promise<LibraryAlbum[]> {
  const items = await fetchCatalogResources(ids.map((id) => ({ type: "albums", id })));

  return items
    .map((item) => readLibraryAlbum("albums", item))
    .filter((album) => album !== undefined);
}

function readLibraryAlbum(type: AlbumType, value: unknown): LibraryAlbum | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as { id?: unknown; attributes?: Record<string, unknown> };
  const attributes = candidate.attributes;

  if (typeof candidate.id !== "string" || typeof attributes?.name !== "string") {
    return undefined;
  }

  return {
    id: candidate.id,
    type,
    name: attributes.name,
    artist: readArtist(attributes.artistName),
    artwork: readArtwork(attributes.artwork),
    catalogId: readCatalogId(attributes.playParams),
  };
}

// the album in the catalog that a library album stands for
function readCatalogId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  return readText((value as { catalogId?: unknown }).catalogId);
}

function readAlbum(type: AlbumType, value: unknown): Album | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as {
    id?: unknown;
    attributes?: Record<string, unknown>;
    relationships?: unknown;
  };
  const attributes = candidate.attributes;

  if (typeof candidate.id !== "string" || typeof attributes?.name !== "string") {
    return undefined;
  }

  return {
    id: candidate.id,
    type,
    name: attributes.name,
    artist: readArtist(attributes.artistName),
    artwork: readArtwork(attributes.artwork),
    releaseDate: readText(attributes.releaseDate),
    trackCount: readNumber(attributes.trackCount),
    genres: readGenres(attributes.genreNames),
    copyright: readText(attributes.copyright),
    recordLabel: readText(attributes.recordLabel),
    notes: readStandard(attributes.editorialNotes),
    isComplete: attributes.isComplete === true,
    isSingle: attributes.isSingle === true,
    artists: readRelated(candidate.relationships, "artists", readAlbumArtist),
    songs: readRelated(candidate.relationships, "tracks", readSong),
  };
}

function readAlbumArtist(value: unknown): AlbumArtist | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as { id?: unknown; attributes?: Record<string, unknown> };
  const attributes = candidate.attributes;

  if (typeof candidate.id !== "string" || typeof attributes?.name !== "string") {
    return undefined;
  }

  return {
    id: candidate.id,
    name: attributes.name,
    artwork: readArtwork(attributes.artwork),
  };
}

function readGenres(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((genre) => typeof genre === "string") : [];
}

export const LIBRARY_ALBUMS_STALE = 5 * 60 * 1000;

// one place for the query, so the view and any early fetch cannot drift apart
export function libraryAlbumsQuery() {
  const isDemo = readDemoMode();

  return {
    queryKey: isDemo ? demoQueryKey("library-albums") : ["music-kit", "library-albums"],
    queryFn: isDemo ? () => fetchCatalogAlbums(DEMO_LIBRARY.albums) : fetchLibraryAlbums,
    select: sortAlbums,
    staleTime: LIBRARY_ALBUMS_STALE,
  };
}

export function sortAlbums(albums: LibraryAlbum[]): LibraryAlbum[] {
  return albums.toSorted((a, b) => a.name.localeCompare(b.name));
}
