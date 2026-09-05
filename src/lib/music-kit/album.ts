import { getMusicKit } from "@/lib/music-kit/instance";
import {
  readArtist,
  readArtwork,
  readItems,
  type Artist,
  type Artwork,
} from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";

const TYPES = ["albums", "library-albums"] as const;
const INCLUDE = "tracks,artists";

export type AlbumType = (typeof TYPES)[number];

export interface AlbumArtist {
  id: string;
  name: string;
  artwork?: Artwork;
}

export interface Song {
  id: string;
  name: string;
  artist?: Artist;
  artwork?: Artwork;
  discNumber?: number;
  trackNumber?: number;
  durationInMillis?: number;
  contentRating?: string;
  previewUrl?: string;
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
    return `/v1/me/library/albums/${encodeURIComponent(id)}`;
  }

  const storefront = await fetchStorefront();

  return `/v1/catalog/${storefront.id}/albums/${encodeURIComponent(id)}`;
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
    notes: readNotes(attributes.editorialNotes),
    isComplete: attributes.isComplete === true,
    isSingle: attributes.isSingle === true,
    artists: readRelated(candidate.relationships, "artists", readAlbumArtist),
    songs: readRelated(candidate.relationships, "tracks", readSong),
  };
}

function readSong(value: unknown): Song | undefined {
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
    discNumber: readNumber(attributes.discNumber),
    trackNumber: readNumber(attributes.trackNumber),
    durationInMillis: readNumber(attributes.durationInMillis),
    contentRating: readText(attributes.contentRating),
    previewUrl: readPreviewUrl(attributes.previews),
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

function readRelated<T>(
  relationships: unknown,
  name: string,
  read: (value: unknown) => T | undefined,
): T[] {
  if (typeof relationships !== "object" || relationships === null) {
    return [];
  }

  const related: T[] = [];

  for (const item of readItems((relationships as Record<string, unknown>)[name])) {
    const parsed = read(item);

    if (parsed) {
      related.push(parsed);
    }
  }

  return related;
}

function readGenres(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((genre) => typeof genre === "string") : [];
}

function readNotes(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const { standard, short } = value as { standard?: unknown; short?: unknown };

  return readText(standard) ?? readText(short);
}

function readPreviewUrl(value: unknown): string | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const [first] = value;

  if (typeof first !== "object" || first === null) {
    return undefined;
  }

  return readText((first as { url?: unknown }).url);
}

function readText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
