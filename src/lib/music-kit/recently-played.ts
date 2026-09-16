import { queryOptions } from "@tanstack/react-query";
import { DEMO_LIBRARY } from "@/lib/demo/library";
import { demoQueryKey, readDemoMode } from "@/lib/demo/mode";
import { isRecord } from "@/lib/is-record";
import { fetchEveryPage } from "@/lib/music-kit/api";
import { type CatalogRef, fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import {
  type Artist,
  type Artwork,
  type Curator,
  readArtist,
  readArtwork,
  readCurator,
  readResource,
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
  const items = await fetchEveryPage(PATH, { types: TYPES.join(",") }, PAGE_SIZE, { until: limit });

  return items
    .map(readItem)
    .filter((item) => item !== undefined)
    .slice(0, limit);
}

async function fetchRecentlyPlayedFromCatalog(
  refs: readonly CatalogRef[],
): Promise<RecentlyPlayedItem[]> {
  const items = await fetchCatalogResources(refs);

  return items.map(readItem).filter((item) => item !== undefined);
}

function readItem(value: unknown): RecentlyPlayedItem | undefined {
  const resource = readResource(value);

  if (!resource || !isRecord(value) || !isKnownType(value.type)) {
    return undefined;
  }

  return {
    id: resource.id,
    type: value.type,
    name: resource.name,
    artist: readArtist(resource.attributes.artistName),
    curator: readCurator(resource.attributes.curatorName),
    artwork: readArtwork(resource.attributes.artwork),
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
