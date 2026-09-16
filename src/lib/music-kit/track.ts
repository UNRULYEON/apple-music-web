import {
  type Artist,
  type Artwork,
  readArtist,
  readArtistRef,
  readArtwork,
  readNumber,
  readRelated,
  readText,
} from "@/lib/music-kit/resource";
import { matchesSearch } from "@/lib/search";

export interface Song {
  id: string;
  name: string;
  artist?: Artist;
  artists?: Artist[];
  artwork?: Artwork;
  discNumber?: number;
  trackNumber?: number;
  durationInMillis?: number;
  contentRating?: string;
  previewUrl?: string;
  playId?: string;
  inLibrary?: boolean;
}

export function searchSongs(songs: Song[], term: string): Song[] {
  return songs.filter((song) => matchesSearch(term, song.name, song.artist?.name));
}

export function isExplicit(song: Song): boolean {
  return song.contentRating === "explicit";
}

export function discStarts(songs: Song[]): Map<number, number> {
  const starts = new Map<number, number>();
  let current: number | undefined;

  songs.forEach((song, index) => {
    if (song.discNumber !== undefined && song.discNumber !== current) {
      current = song.discNumber;
      starts.set(index, current);
    }
  });

  return starts.size > 1 ? starts : new Map();
}

export function isSameSong(one?: Song, other?: Song): boolean {
  if (!one || !other) {
    return false;
  }

  return songIds(one).some((id) => songIds(other).includes(id));
}

function songIds(song: Song): string[] {
  return song.playId ? [song.id, song.playId] : [song.id];
}

export function readSong(value: unknown): Song | undefined {
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
    name: attributes.name,
    artist: readArtist(attributes.artistName),
    artists: readRelated(candidate.relationships, "artists", readArtistRef),
    artwork: readArtwork(attributes.artwork),
    discNumber: readNumber(attributes.discNumber),
    trackNumber: readNumber(attributes.trackNumber),
    durationInMillis: readNumber(attributes.durationInMillis),
    contentRating: readText(attributes.contentRating),
    previewUrl: readPreviewUrl(attributes.previews),
    playId: readPlayId(attributes.playParams),
    inLibrary: attributes.inLibrary === true ? true : undefined,
  };
}

function readPlayId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const params = value as { id?: unknown; catalogId?: unknown };

  return readText(params.catalogId) ?? readText(params.id);
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
