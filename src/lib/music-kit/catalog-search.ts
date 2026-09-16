import { queryOptions } from "@tanstack/react-query";
import { isRecord } from "@/lib/is-record";
import { catalogPath } from "@/lib/music-kit/api";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artwork,
  readArtwork,
  readGenres,
  readItems,
  readResource,
  readStandard,
  readText,
} from "@/lib/music-kit/resource";

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

export async function fetchCatalogSearch(term: string): Promise<CatalogResults> {
  if (term.trim() === "") {
    return EMPTY;
  }

  const path = await catalogPath("search");
  const music = await getMusicKit();
  const { data } = await music.api.music(path, { term, types: TYPES, limit: LIMIT });
  const results = isRecord(data) && isRecord(data.results) ? data.results : {};

  return {
    artists: readGroup(results.artists, (attributes) => readGenres(attributes.genreNames)[0]),
    albums: readGroup(results.albums, (attributes) => readText(attributes.artistName)),
    playlists: readGroup(results.playlists, readPlaylistCredit),
  };
}

function readGroup(group: unknown, readCredit: ReadCredit): CatalogItem[] {
  return readItems(group)
    .map((value) => readItem(value, readCredit))
    .filter((item) => item !== undefined);
}

function readItem(value: unknown, readCredit: ReadCredit): CatalogItem | undefined {
  const resource = readResource(value);

  return (
    resource && {
      id: resource.id,
      name: resource.name,
      credit: readCredit(resource.attributes),
      artwork: readArtwork(resource.attributes.artwork),
    }
  );
}

function readPlaylistCredit(attributes: Record<string, unknown>): string | undefined {
  return readText(attributes.curatorName) ?? readStandard(attributes.description);
}

export function catalogSearchQuery(term: string) {
  return queryOptions({
    queryKey: ["music-kit", "catalog-search", term],
    queryFn: () => fetchCatalogSearch(term),
    enabled: term.trim() !== "",
    staleTime: STALE,
  });
}
