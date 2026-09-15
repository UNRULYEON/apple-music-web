import { getMusicKit } from "@/lib/music-kit/instance";
import {
  readArtist,
  readArtistRef,
  readArtwork,
  readCurator,
  readItems,
  readRelated,
  readText,
  type Artist,
  type Artwork,
  type Curator,
} from "@/lib/music-kit/resource";
import { matchesSearch } from "@/lib/search";
import { readSong, type Song } from "@/lib/music-kit/track";
import { fetchStorefront } from "@/lib/music-kit/storefront";

const STALE = 60 * 60 * 1000;

// what the screen shows. Apple sends a view only when the request names it.
const VIEWS =
  "top-songs,full-albums,singles,featured-playlists,compilation-albums,appears-on-albums";

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

// a person looks for an album by what the tile shows: its name and who made it
export function searchAlbums(albums: ArtistAlbum[], term: string): ArtistAlbum[] {
  return albums.filter((album) => matchesSearch(term, album.name, album.artist?.name));
}

export function searchPlaylists(playlists: ArtistPlaylist[], term: string): ArtistPlaylist[] {
  return playlists.filter((playlist) => matchesSearch(term, playlist.name));
}

export async function fetchArtist(id: string): Promise<ArtistDetail> {
  const storefront = await fetchStorefront();
  const music = await getMusicKit();
  const path = `/v1/catalog/${storefront.id}/artists/${encodeURIComponent(id)}`;
  const { data } = await music.api.music(path, { views: VIEWS });
  const [first] = readItems(data);
  const artist = readArtistDetail(first);

  if (!artist) {
    throw new Error(`Apple Music returned no artist for ${id}.`);
  }

  return artist;
}

export function artistQuery(id: string) {
  return {
    queryKey: ["music-kit", "artist", id],
    queryFn: () => fetchArtist(id),
    staleTime: STALE,
  };
}

// the artists of one song. The player builds its queue out of MusicKit media items,
// which name the artists in one string and hold no artist of their own, so the catalog
// is asked for them.
export async function fetchSongArtists(id: string): Promise<Artist[]> {
  const storefront = await fetchStorefront();
  const music = await getMusicKit();
  const path = `/v1/catalog/${storefront.id}/songs/${encodeURIComponent(id)}`;
  const { data } = await music.api.music(path, { include: "artists" });
  const [first] = readItems(data);
  const relationships = (first as { relationships?: unknown } | undefined)?.relationships;

  return readRelated(relationships, "artists", readArtistRef);
}

export function songArtistsQuery(id?: string) {
  return {
    queryKey: ["music-kit", "song-artists", id],
    queryFn: () => fetchSongArtists(id ?? ""),
    enabled: id !== undefined,
    staleTime: STALE,
  };
}

function readArtistDetail(value: unknown): ArtistDetail | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as {
    id?: unknown;
    attributes?: Record<string, unknown>;
    views?: unknown;
  };
  const attributes = candidate.attributes;

  if (typeof candidate.id !== "string" || typeof attributes?.name !== "string") {
    return undefined;
  }

  return {
    id: candidate.id,
    name: attributes.name,
    artwork: readArtwork(attributes.artwork),
    genres: readGenres(attributes.genreNames),
    // a view holds its items under the same key a relationship does
    topSongs: readRelated(candidate.views, "top-songs", readSong),
    albums: readRelated(candidate.views, "full-albums", readArtistAlbum),
    singles: readRelated(candidate.views, "singles", readArtistAlbum),
    playlists: readRelated(candidate.views, "featured-playlists", readArtistPlaylist),
    compilations: readRelated(candidate.views, "compilation-albums", readArtistAlbum),
    appearsOn: readRelated(candidate.views, "appears-on-albums", readArtistAlbum),
  };
}

function readArtistAlbum(value: unknown): ArtistAlbum | undefined {
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
    releaseDate: readText(attributes.releaseDate),
  };
}

function readArtistPlaylist(value: unknown): ArtistPlaylist | undefined {
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
    curator: readCurator(attributes.curatorName),
    artwork: readArtwork(attributes.artwork),
  };
}

function readGenres(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((genre) => typeof genre === "string") : [];
}
