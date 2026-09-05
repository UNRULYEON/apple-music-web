import {
  readArtist,
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
  artwork?: Artwork;
  discNumber?: number;
  trackNumber?: number;
  durationInMillis?: number;
  contentRating?: string;
  previewUrl?: string;
}

export function readSong(value: unknown): Song | undefined {
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
