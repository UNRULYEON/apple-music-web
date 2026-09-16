import {
  DEMO_CURATOR,
  DEMO_LIBRARY,
  type DemoPlaylist,
  findDemoPlaylist,
} from "@/lib/demo/library";
import { demoQueryKey, readDemoMode } from "@/lib/demo/mode";
import { fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artwork,
  type Curator,
  hasNextPage,
  mosaicArtwork,
  readArtwork,
  readCurator,
  readItems,
  readRelated,
  readStandard,
  readText,
} from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";
import { readSong, type Song } from "@/lib/music-kit/track";

const PATH = "/v1/me/library/playlists";
const PAGE_SIZE = 100;

const TYPES = ["playlists", "library-playlists"] as const;
const INCLUDE = "tracks";
const SONG_PARAMS = { include: INCLUDE, "include[songs]": "artists" } as const;

export type PlaylistType = (typeof TYPES)[number];

export interface LibraryPlaylist {
  id: string;
  type: PlaylistType;
  name: string;
  description?: string;
  artwork?: Artwork;
  canEdit: boolean;
  hasCatalog: boolean;
  isPublic: boolean;
  dateAdded?: string;
}

export interface Playlist {
  id: string;
  type: PlaylistType;
  name: string;
  curator?: Curator;
  artwork?: Artwork;
  description?: string;
  playlistType?: string;
  lastModifiedDate?: string;
  dateAdded?: string;
  canEdit: boolean;
  hasCatalog: boolean;
  isPublic: boolean;
  songs: Song[];
}

export function isPlaylistType(value: unknown): value is PlaylistType {
  return TYPES.includes(value as PlaylistType);
}

export async function fetchLibraryPlaylists(): Promise<LibraryPlaylist[]> {
  const music = await getMusicKit();
  const playlists: LibraryPlaylist[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    // oxlint-disable-next-line no-await-in-loop
    const { data } = await music.api.music(PATH, { limit: PAGE_SIZE, offset });
    const items = readItems(data);

    for (const item of items) {
      const playlist = readLibraryPlaylist("library-playlists", item);

      if (playlist) {
        playlists.push(playlist);
      }
    }

    if (!hasNextPage(data) || items.length < PAGE_SIZE) {
      return playlists;
    }
  }
}

export const LIBRARY_PLAYLISTS_STALE = 5 * 60 * 1000;

export async function fetchDemoPlaylists(
  playlists: readonly DemoPlaylist[],
): Promise<LibraryPlaylist[]> {
  const ids = [...new Set(playlists.flatMap((playlist) => playlist.songs))];
  const items = await fetchCatalogResources(ids.map((id) => ({ type: "songs", id })));
  const artworkById = new Map(
    items
      .map(readSong)
      .filter((song) => song !== undefined)
      .map((song) => [song.id, song.artwork]),
  );

  return playlists.map((playlist) => ({
    id: playlist.id,
    type: "library-playlists",
    name: playlist.name,
    artwork: mosaicArtwork(playlist.songs.map((id) => artworkById.get(id))),
    canEdit: false,
    hasCatalog: false,
    isPublic: false,
  }));
}

async function fetchDemoPlaylist(playlist: DemoPlaylist): Promise<Playlist> {
  const items = await fetchCatalogResources(
    playlist.songs.map((id) => ({ type: "songs", id })),
    { include: "artists" },
  );
  const songs = items.map(readSong).filter((song) => song !== undefined);

  return {
    id: playlist.id,
    type: "library-playlists",
    name: playlist.name,
    curator: { name: DEMO_CURATOR },
    artwork: mosaicArtwork(songs.map((song) => song.artwork)),
    canEdit: false,
    hasCatalog: false,
    isPublic: false,
    songs,
  };
}

export function libraryPlaylistsQuery() {
  const isDemo = readDemoMode();

  return {
    queryKey: isDemo ? demoQueryKey("library-playlists") : ["music-kit", "library-playlists"],
    queryFn: isDemo ? () => fetchDemoPlaylists(DEMO_LIBRARY.playlists) : fetchLibraryPlaylists,
    staleTime: LIBRARY_PLAYLISTS_STALE,
  };
}

export async function fetchPlaylist(type: PlaylistType, id: string): Promise<Playlist> {
  const demo = findDemoPlaylist(id);

  if (demo) {
    return fetchDemoPlaylist(demo);
  }

  const path = await playlistPath(type, id);
  const music = await getMusicKit();
  const { data } = await music.api.music(path, SONG_PARAMS);
  const [first] = readItems(data);
  const playlist = readPlaylist(type, first);

  if (!playlist) {
    throw new Error(`Apple Music returned no playlist for ${id}.`);
  }

  return playlist;
}

async function playlistPath(type: PlaylistType, id: string): Promise<string> {
  if (type === "library-playlists") {
    return `${PATH}/${encodeURIComponent(id)}`;
  }

  const storefront = await fetchStorefront();

  return `/v1/catalog/${storefront.id}/playlists/${encodeURIComponent(id)}`;
}

function readPlaylist(type: PlaylistType, value: unknown): Playlist | undefined {
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
    curator: readCurator(attributes.curatorName),
    artwork: readArtwork(attributes.artwork),
    description: readStandard(attributes.description),
    playlistType: readText(attributes.playlistType),
    lastModifiedDate: readText(attributes.lastModifiedDate),
    dateAdded: readText(attributes.dateAdded),
    canEdit: attributes.canEdit === true,
    hasCatalog: attributes.hasCatalog === true,
    isPublic: attributes.isPublic === true,
    songs: readRelated(candidate.relationships, "tracks", readSong),
  };
}

function readLibraryPlaylist(type: PlaylistType, value: unknown): LibraryPlaylist | undefined {
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
    type,
    name: attributes.name,
    description: readStandard(attributes.description),
    artwork: readArtwork(attributes.artwork),
    canEdit: attributes.canEdit === true,
    hasCatalog: attributes.hasCatalog === true,
    isPublic: attributes.isPublic === true,
    dateAdded: readText(attributes.dateAdded),
  };
}
