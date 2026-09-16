import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artwork,
  readArtwork,
  readItems,
  readStandard,
  readText,
} from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";

const TYPES = "artists,albums,playlists";
const LIMIT = 10;
const STALE = 5 * 60 * 1000;

export interface CatalogItem {
  id: string;
  name: string;
  credit?: string;
  artwork?: Artwork;
}

export interface CatalogResults {
  artists: CatalogItem[];
  albums: CatalogItem[];
  playlists: CatalogItem[];
}

type ReadCredit = (attributes: Record<string, unknown>) => string | undefined;

const EMPTY: CatalogResults = { artists: [], albums: [], playlists: [] };

export async function searchCatalog(term: string): Promise<CatalogResults> {
  if (term.trim() === "") {
    return EMPTY;
  }

  const storefront = await fetchStorefront();
  const music = await getMusicKit();
  const { data } = await music.api.music(`/v1/catalog/${storefront.id}/search`, {
    term,
    types: TYPES,
    limit: LIMIT,
  });
  const results = readResults(data);

  return {
    artists: readGroup(results.artists, readFirstGenre),
    albums: readGroup(results.albums, (attributes) => readText(attributes.artistName)),
    playlists: readGroup(results.playlists, readPlaylistCredit),
  };
}

function readGroup(group: unknown, readCredit: ReadCredit): CatalogItem[] {
  const items: CatalogItem[] = [];

  for (const value of readItems(group)) {
    const item = readItem(value, readCredit);

    if (item) {
      items.push(item);
    }
  }

  return items;
}

function readItem(value: unknown, readCredit: ReadCredit): CatalogItem | undefined {
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
    credit: readCredit(attributes),
    artwork: readArtwork(attributes.artwork),
  };
}

function readFirstGenre(attributes: Record<string, unknown>): string | undefined {
  const genres = attributes.genreNames;

  return Array.isArray(genres) ? readText(genres[0]) : undefined;
}

function readPlaylistCredit(attributes: Record<string, unknown>): string | undefined {
  return readText(attributes.curatorName) ?? readStandard(attributes.description);
}

function readResults(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null) {
    return {};
  }

  const results = (data as { results?: unknown }).results;

  return typeof results === "object" && results !== null
    ? (results as Record<string, unknown>)
    : {};
}

export function catalogSearchQuery(term: string) {
  return {
    queryKey: ["music-kit", "catalog-search", term],
    queryFn: () => searchCatalog(term),
    enabled: term.trim() !== "",
    staleTime: STALE,
  };
}
