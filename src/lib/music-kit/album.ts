import { queryOptions } from "@tanstack/react-query";
import { DEMO_LIBRARY } from "@/lib/demo/library";
import { demoQueryKey, readDemoMode } from "@/lib/demo/mode";
import { isRecord } from "@/lib/is-record";
import { catalogPath, fetchEveryPage } from "@/lib/music-kit/api";
import { fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artist,
  type Artwork,
  readArtist,
  readArtwork,
  readGenres,
  readItems,
  readNumber,
  readRelated,
  readResource,
  readStandard,
  readText,
} from "@/lib/music-kit/resource";
import { isSameSong, readSong, type Song } from "@/lib/music-kit/track";

const TYPES = ["albums", "library-albums"] as const;
const INCLUDE = "tracks,artists";
const SONG_PARAMS = { include: INCLUDE, "include[songs]": "artists" } as const;
const LIBRARY_PATH = "/v1/me/library/albums";
const CATALOG_PATH = "/catalog";
const PAGE_SIZE = 100;
const STALE = 5 * 60 * 1000;

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

export function isAlbumInLibrary(songs: Song[], trackCount?: number): boolean {
  return (
    songs.length > 0 &&
    songs.length === (trackCount ?? songs.length) &&
    songs.every((song) => song.inLibrary === true)
  );
}

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

async function withCatalogSongs(album: Album, id: string): Promise<Album> {
  const catalog = await fetchCatalogAlbum(id);

  if (!catalog || catalog.songs.length === 0) {
    return album;
  }

  return {
    ...catalog,
    id: album.id,
    type: album.type,
    artwork: album.artwork ?? catalog.artwork,
  };
}

export async function fetchLibraryAlbumSongs(id: string): Promise<Song[]> {
  const music = await getMusicKit();
  const path = `${LIBRARY_PATH}/${encodeURIComponent(id)}`;
  const { data } = await music.api.music(path, { include: "tracks" });
  const [first] = readItems(data);

  return readAlbum("library-albums", first)?.songs ?? [];
}

export function albumQuery(type: AlbumType, id: string) {
  return queryOptions({
    queryKey: ["music-kit", "album", type, id],
    queryFn: () => fetchAlbum(type, id),
    staleTime: STALE,
  });
}

export function libraryAlbumSongsQuery(id?: string) {
  return queryOptions({
    queryKey: ["music-kit", "library-album-songs", id],
    queryFn: () => fetchLibraryAlbumSongs(id ?? ""),
    enabled: id !== undefined,
    staleTime: STALE,
  });
}

async function fetchCatalogAlbum(id: string): Promise<Album | undefined> {
  const music = await getMusicKit();
  const path = `${LIBRARY_PATH}/${encodeURIComponent(id)}${CATALOG_PATH}`;

  try {
    const { data } = await music.api.music(path, SONG_PARAMS);
    const [first] = readItems(data);

    return readAlbum("albums", first);
  } catch {
    return undefined;
  }
}

async function albumPath(type: AlbumType, id: string): Promise<string> {
  return type === "library-albums"
    ? `${LIBRARY_PATH}/${encodeURIComponent(id)}`
    : catalogPath("albums", id);
}

export async function fetchLibraryAlbums(): Promise<LibraryAlbum[]> {
  const items = await fetchEveryPage(LIBRARY_PATH, {}, PAGE_SIZE);

  return items
    .map((item) => readLibraryAlbum("library-albums", item))
    .filter((album) => album !== undefined);
}

export async function fetchCatalogAlbums(ids: readonly string[]): Promise<LibraryAlbum[]> {
  const items = await fetchCatalogResources(ids.map((id) => ({ type: "albums", id })));

  return items
    .map((item) => readLibraryAlbum("albums", item))
    .filter((album) => album !== undefined);
}

function readLibraryAlbum(type: AlbumType, value: unknown): LibraryAlbum | undefined {
  const resource = readResource(value);

  if (!resource) {
    return undefined;
  }

  const { attributes } = resource;

  return {
    id: resource.id,
    type,
    name: resource.name,
    artist: readArtist(attributes.artistName),
    artwork: readArtwork(attributes.artwork),
    catalogId: readCatalogId(attributes.playParams),
  };
}

function readCatalogId(value: unknown): string | undefined {
  return isRecord(value) ? readText(value.catalogId) : undefined;
}

function readAlbum(type: AlbumType, value: unknown): Album | undefined {
  const resource = readResource(value);

  if (!resource) {
    return undefined;
  }

  const { attributes, relationships } = resource;

  return {
    id: resource.id,
    type,
    name: resource.name,
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
    artists: readRelated(relationships, "artists", readAlbumArtist),
    songs: readRelated(relationships, "tracks", readSong),
  };
}

function readAlbumArtist(value: unknown): AlbumArtist | undefined {
  const resource = readResource(value);

  return (
    resource && {
      id: resource.id,
      name: resource.name,
      artwork: readArtwork(resource.attributes.artwork),
    }
  );
}

export function libraryAlbumsQuery() {
  const isDemo = readDemoMode();

  return queryOptions({
    queryKey: isDemo ? demoQueryKey("library-albums") : ["music-kit", "library-albums"],
    queryFn: isDemo ? () => fetchCatalogAlbums(DEMO_LIBRARY.albums) : fetchLibraryAlbums,
    select: sortAlbums,
    staleTime: STALE,
  });
}

export function sortAlbums(albums: LibraryAlbum[]): LibraryAlbum[] {
  return albums.toSorted((a, b) => a.name.localeCompare(b.name));
}
