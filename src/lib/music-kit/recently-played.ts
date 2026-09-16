import { queryOptions } from "@tanstack/react-query";
import { DEMO_LIBRARY } from "@/lib/demo/library";
import { demoQueryKey, readDemoMode } from "@/lib/demo/mode";
import { type CatalogRef, fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artist,
  type Artwork,
  type Curator,
  hasNextPage,
  readArtist,
  readArtwork,
  readCurator,
  readItems,
} from "@/lib/music-kit/resource";

const PATH = "/v1/me/recent/played";
const PAGE_SIZE = 10;
const LIMIT = 100;
const STALE = 5 * 60 * 1000;

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

export async function fetchRecentlyPlayedFromCatalog(
  refs: readonly CatalogRef[],
): Promise<RecentlyPlayedItem[]> {
  const items = await fetchCatalogResources(refs);

  return items.map(readItem).filter((item) => item !== undefined);
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

export function recentlyPlayedQuery() {
  const isDemo = readDemoMode();

  return queryOptions({
    queryKey: isDemo ? demoQueryKey("recently-played") : ["music-kit", "recently-played", LIMIT],
    queryFn: isDemo
      ? () => fetchRecentlyPlayedFromCatalog(DEMO_LIBRARY.recentlyPlayed)
      : () => fetchRecentlyPlayed(LIMIT),
    staleTime: STALE,
  });
}
