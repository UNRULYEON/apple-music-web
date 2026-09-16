import { queryOptions } from "@tanstack/react-query";
import { isRecord } from "@/lib/is-record";
import { catalogPath, fetchEveryPage } from "@/lib/music-kit/api";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  type Artist,
  type Artwork,
  type Curator,
  hasNextPage,
  readArtist,
  readArtistRef,
  readArtwork,
  readCurator,
  readGenres,
  readItems,
  readRelated,
  readRelationships,
  readResource,
  readText,
} from "@/lib/music-kit/resource";
import { readSong, type Song } from "@/lib/music-kit/track";
import { matchesSearch } from "@/lib/search";

const STALE = 60 * 60 * 1000;

const VIEWS =
  "top-songs,full-albums,singles,featured-playlists,compilation-albums,appears-on-albums";

const LISTED_VIEWS = [
  "full-albums",
  "singles",
  "featured-playlists",
  "compilation-albums",
  "appears-on-albums",
];
const VIEW_LIMIT = 100;
const VIEW_LIMITS = Object.fromEntries(LISTED_VIEWS.map((name) => [`limit[${name}]`, VIEW_LIMIT]));

export interface ArtistAlbum {
  id: string;
  name: string;
  artist?: Artist;
  artwork?: Artwork;
  releaseDate?: string;
}

export interface ArtistPlaylist {
  id: string;
  name: string;
  curator?: Curator;
  artwork?: Artwork;
}

export interface ArtistDetail {
  id: string;
  name: string;
  artwork?: Artwork;
  genres: string[];
  topSongs: Song[];
  albums: ArtistAlbum[];
  singles: ArtistAlbum[];
  playlists: ArtistPlaylist[];
  compilations: ArtistAlbum[];
  appearsOn: ArtistAlbum[];
}

export function searchAlbums(albums: ArtistAlbum[], term: string): ArtistAlbum[] {
  return albums.filter((album) => matchesSearch(term, album.name, album.artist?.name));
}

export function searchPlaylists(playlists: ArtistPlaylist[], term: string): ArtistPlaylist[] {
  return playlists.filter((playlist) => matchesSearch(term, playlist.name));
}

export async function fetchArtist(id: string): Promise<ArtistDetail> {
  const path = await catalogPath("artists", id);
  const music = await getMusicKit();
  const { data } = await music.api.music(path, { views: VIEWS, ...VIEW_LIMITS });
  const [first] = readItems(data);
  const artist = readArtistDetail(await withEveryPage(path, first));

  if (!artist) {
    throw new Error(`Apple Music returned no artist for ${id}.`);
  }

  return artist;
}

async function withEveryPage(path: string, artist: unknown): Promise<unknown> {
  if (!isRecord(artist) || !isRecord(artist.views)) {
    return artist;
  }

  const views = artist.views;
  const listed = await Promise.all(
    LISTED_VIEWS.map(async (name) => {
      const view = views[name];
      const items = readItems(view);
      const rest = hasNextPage(view)
        ? await fetchEveryPage(`${path}/view/${name}`, {}, VIEW_LIMIT, { from: items.length })
        : [];

      return [name, { data: [...items, ...rest] }] as const;
    }),
  );

  return { ...artist, views: { ...views, ...Object.fromEntries(listed) } };
}

export function artistQuery(id: string) {
  return queryOptions({
    queryKey: ["music-kit", "artist", id],
    queryFn: () => fetchArtist(id),
    staleTime: STALE,
  });
}

export async function fetchSongArtists(id: string): Promise<Artist[]> {
  const path = await catalogPath("songs", id);
  const music = await getMusicKit();
  const { data } = await music.api.music(path, { include: "artists" });
  const [first] = readItems(data);

  return readRelated(readRelationships(first), "artists", readArtistRef);
}

export function songArtistsQuery(id?: string) {
  return queryOptions({
    queryKey: ["music-kit", "song-artists", id],
    queryFn: () => fetchSongArtists(id ?? ""),
    enabled: id !== undefined,
    staleTime: STALE,
  });
}

function readArtistDetail(value: unknown): ArtistDetail | undefined {
  const resource = readResource(value);

  if (!resource) {
    return undefined;
  }

  const { attributes, views } = resource;

  return {
    id: resource.id,
    name: resource.name,
    artwork: readArtwork(attributes.artwork),
    genres: readGenres(attributes.genreNames),
    topSongs: readRelated(views, "top-songs", readSong),
    albums: readRelated(views, "full-albums", readArtistAlbum),
    singles: readRelated(views, "singles", readArtistAlbum),
    playlists: readRelated(views, "featured-playlists", readArtistPlaylist),
    compilations: readRelated(views, "compilation-albums", readArtistAlbum),
    appearsOn: readRelated(views, "appears-on-albums", readArtistAlbum),
  };
}

function readArtistAlbum(value: unknown): ArtistAlbum | undefined {
  const resource = readResource(value);

  return (
    resource && {
      id: resource.id,
      name: resource.name,
      artist: readArtist(resource.attributes.artistName),
      artwork: readArtwork(resource.attributes.artwork),
      releaseDate: readText(resource.attributes.releaseDate),
    }
  );
}

function readArtistPlaylist(value: unknown): ArtistPlaylist | undefined {
  const resource = readResource(value);

  return (
    resource && {
      id: resource.id,
      name: resource.name,
      curator: readCurator(resource.attributes.curatorName),
      artwork: readArtwork(resource.attributes.artwork),
    }
  );
}
