import { matchesSearch } from "@/lib/search";
import {
  readArtist,
  readArtistRef,
  readRelated,
  readArtwork,
  readNumber,
  readText,
  type Artist,
  type Artwork,
} from "@/lib/music-kit/resource";

export interface Song {
  id: string;
  name: string;
  artist?: Artist;
  // every artist of the song, each with an id of its own. Apple sends these only when
  // the request asks for them, so a song can hold none and still show its artist text.
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

// a person looks for a song by what the list shows of it: its name and who plays it
export function searchSongs(songs: Song[], term: string): Song[] {
  return songs.filter((song) => matchesSearch(term, song.name, song.artist?.name));
}

// a song in the library and the song the player queues from the catalog
// hold the same music under two ids
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

// a song in the library plays from its catalog id when it has one
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
