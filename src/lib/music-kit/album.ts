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
import { readSong, type Song } from "@/lib/music-kit/track";
import { fetchStorefront } from "@/lib/music-kit/storefront";

const TYPES = ["albums", "library-albums"] as const;
const INCLUDE = "tracks,artists";
const LIBRARY_PATH = "/v1/me/library/albums";
const PAGE_SIZE = 100;

export type AlbumType = (typeof TYPES)[number];

export interface AlbumArtist {
  id: string;
  name: string;
  artwork?: Artwork;
}

export interface LibraryAlbum {
  id: string;
  name: string;
  artist?: Artist;
  artwork?: Artwork;
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

export async function fetchAlbum(type: AlbumType, id: string): Promise<Album> {
  const path = await albumPath(type, id);
  const music = await getMusicKit();
  const { data } = await music.api.music(path, { include: INCLUDE });
  const [first] = readItems(data);
  const album = readAlbum(type, first);

  if (!album) {
    throw new Error(`Apple Music returned no album for ${id}.`);
  }

  return album;
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
      const album = readLibraryAlbum(item);

      if (album) {
        albums.push(album);
      }
    }

    if (!hasNextPage(data) || items.length < PAGE_SIZE) {
      return albums;
    }
  }
}

function readLibraryAlbum(value: unknown): LibraryAlbum | undefined {
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
    artist: readArtist(attributes.artistName),
    artwork: readArtwork(attributes.artwork),
  };
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
  return {
    queryKey: ["music-kit", "library-albums"],
    queryFn: fetchLibraryAlbums,
    staleTime: LIBRARY_ALBUMS_STALE,
  };
}
