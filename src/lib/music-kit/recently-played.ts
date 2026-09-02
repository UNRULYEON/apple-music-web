import { getMusicKit } from "@/lib/music-kit/instance";
import {
  hasNextPage,
  readArtist,
  readArtwork,
  readCurator,
  readItems,
  type Artist,
  type Artwork,
  type Curator,
} from "@/lib/music-kit/resource";

const PATH = "/v1/me/recent/played";
const PAGE_SIZE = 10;

const TYPES = ["albums", "library-albums", "playlists", "library-playlists", "stations"] as const;

export type RecentlyPlayedType = (typeof TYPES)[number];

export interface RecentlyPlayedItem {
  id: string;
  type: RecentlyPlayedType;
  name: string;
  artist?: Artist;
  curator?: Curator;
  artwork?: Artwork;
}

export async function fetchRecentlyPlayed(limit = PAGE_SIZE): Promise<RecentlyPlayedItem[]> {
  const music = await getMusicKit();
  const played: RecentlyPlayedItem[] = [];

  for (let offset = 0; offset < limit; offset += PAGE_SIZE) {
    // oxlint-disable-next-line no-await-in-loop
    const { data } = await music.api.music(PATH, {
      types: TYPES.join(","),
      limit: PAGE_SIZE,
      offset,
    });
    const items = readItems(data);

    for (const item of items) {
      const parsed = readItem(item);

      if (parsed) {
        played.push(parsed);
      }
    }

    if (!hasNextPage(data) || items.length < PAGE_SIZE) {
      break;
    }
  }

  return played.slice(0, limit);
}

function readItem(value: unknown): RecentlyPlayedItem | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as { id?: unknown; type?: unknown; attributes?: Record<string, unknown> };
  const attributes = candidate.attributes;

  if (
    typeof candidate.id !== "string" ||
    !isKnownType(candidate.type) ||
    typeof attributes?.name !== "string"
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    type: candidate.type,
    name: attributes.name,
    artist: readArtist(attributes.artistName),
    curator: readCurator(attributes.curatorName),
    artwork: readArtwork(attributes.artwork),
  };
}

function isKnownType(value: unknown): value is RecentlyPlayedType {
  return TYPES.includes(value as RecentlyPlayedType);
}
