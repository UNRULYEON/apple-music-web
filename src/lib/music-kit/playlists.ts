import { queryOptions } from "@tanstack/react-query";
import {
  DEMO_CURATOR,
  DEMO_LIBRARY,
  type DemoPlaylist,
  findDemoPlaylist,
} from "@/lib/demo/library";
import { demoQueryKey, readDemoMode } from "@/lib/demo/mode";
import { catalogPath, fetchEveryPage } from "@/lib/music-kit/api";
import { fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artwork,
  type Curator,
  mosaicArtwork,
  readArtwork,
  readCurator,
  readItems,
  readRelated,
  readResource,
  readStandard,
  readText,
} from "@/lib/music-kit/resource";
import { readSong, type Song } from "@/lib/music-kit/track";

const PATH = "/v1/me/library/playlists";
const PAGE_SIZE = 100;
const STALE = 5 * 60 * 1000;

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
  const items = await fetchEveryPage(PATH, {}, PAGE_SIZE);

  return items
    .map((item) => readLibraryPlaylist("library-playlists", item))
    .filter((playlist) => playlist !== undefined);
}

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

  return queryOptions({
    queryKey: isDemo ? demoQueryKey("library-playlists") : ["music-kit", "library-playlists"],
    queryFn: isDemo ? () => fetchDemoPlaylists(DEMO_LIBRARY.playlists) : fetchLibraryPlaylists,
    staleTime: STALE,
  });
}

export function playlistQuery(type: PlaylistType, id: string) {
  return queryOptions({
    queryKey: ["music-kit", "playlist", type, id],
    queryFn: () => fetchPlaylist(type, id),
    staleTime: STALE,
  });
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
  return type === "library-playlists"
    ? `${PATH}/${encodeURIComponent(id)}`
    : catalogPath("playlists", id);
}

function readPlaylist(type: PlaylistType, value: unknown): Playlist | undefined {
  const resource = readResource(value);

  if (!resource) {
    return undefined;
  }

  const { attributes, relationships } = resource;

  return {
    id: resource.id,
    type,
    name: resource.name,
    curator: readCurator(attributes.curatorName),
    artwork: readArtwork(attributes.artwork),
    description: readStandard(attributes.description),
    playlistType: readText(attributes.playlistType),
    lastModifiedDate: readText(attributes.lastModifiedDate),
    dateAdded: readText(attributes.dateAdded),
    canEdit: attributes.canEdit === true,
    hasCatalog: attributes.hasCatalog === true,
    isPublic: attributes.isPublic === true,
    songs: readRelated(relationships, "tracks", readSong),
  };
}

function readLibraryPlaylist(type: PlaylistType, value: unknown): LibraryPlaylist | undefined {
  const resource = readResource(value);

  if (!resource) {
    return undefined;
  }

  const { attributes } = resource;

  return {
    id: resource.id,
    type,
    name: resource.name,
    description: readStandard(attributes.description),
    artwork: readArtwork(attributes.artwork),
    canEdit: attributes.canEdit === true,
    hasCatalog: attributes.hasCatalog === true,
    isPublic: attributes.isPublic === true,
    dateAdded: readText(attributes.dateAdded),
  };
}
