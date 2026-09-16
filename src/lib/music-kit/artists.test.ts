import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ArtistAlbum,
  type ArtistPlaylist,
  fetchArtist,
  fetchSongArtists,
  searchAlbums,
  searchPlaylists,
} from "@/lib/music-kit/artists";
import { getMusicKit } from "@/lib/music-kit/instance";
import { fetchStorefront } from "@/lib/music-kit/storefront";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));

const music = vi.fn();

function artistResponse(attributes: Record<string, unknown>, views: unknown = {}) {
  return { data: { data: [{ id: "1440846798", type: "artists", attributes, views }] } };
}

function album(id: string, attributes: Record<string, unknown> = {}) {
  return {
    id,
    type: "albums",
    attributes: { name: `Album ${id}`, artistName: "boygenius", ...attributes },
  };
}

function playlist(id: string) {
  return {
    id,
    type: "playlists",
    attributes: { name: `Playlist ${id}`, curatorName: "Apple Music" },
  };
}

function song(id: string) {
  return { id, type: "songs", attributes: { name: `Song ${id}`, artistName: "boygenius" } };
}

beforeEach(() => {
  vi.mocked(getMusicKit).mockResolvedValue({
    api: { music },
  } as unknown as MusicKit.MusicKitInstance);
  vi.mocked(fetchStorefront).mockResolvedValue({ id: "nl", name: "Netherlands" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchArtist", () => {
  it("asks the storefront catalog for the artist", async () => {
    music.mockResolvedValue(artistResponse({ name: "boygenius" }));

    await fetchArtist("1440846798");

    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/artists/1440846798", {
      views:
        "top-songs,full-albums,singles,featured-playlists,compilation-albums,appears-on-albums",
      "limit[full-albums]": 100,
      "limit[singles]": 100,
      "limit[featured-playlists]": 100,
      "limit[compilation-albums]": 100,
      "limit[appears-on-albums]": 100,
    });
    expect(music).toHaveBeenCalledOnce();
  });

  it("asks for the rest of a view that holds more than one page", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => album(`a${index}`));
    const secondPage = Array.from({ length: 100 }, (_, index) => album(`a${index + 100}`));

    music
      .mockResolvedValueOnce(
        artistResponse(
          { name: "Masayoshi Takanaka" },
          {
            "full-albums": {
              data: firstPage,
              next: "/v1/catalog/nl/artists/1440846798/view/full-albums?offset=100",
            },
          },
        ),
      )
      .mockResolvedValueOnce({
        data: {
          data: secondPage,
          next: "/v1/catalog/nl/artists/1440846798/view/full-albums?offset=200",
        },
      })
      .mockResolvedValueOnce({ data: { data: [album("a200")] } });

    const artist = await fetchArtist("1440846798");

    expect(artist.albums).toHaveLength(201);
    expect(artist.albums.at(-1)?.id).toBe("a200");
    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/artists/1440846798/view/full-albums", {
      limit: 100,
      offset: 100,
    });
    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/artists/1440846798/view/full-albums", {
      limit: 100,
      offset: 200,
    });
  });

  it("reads the name, the artwork and the genres", async () => {
    music.mockResolvedValue(
      artistResponse({
        name: "boygenius",
        genreNames: ["Alternative", 7],
        artwork: { url: "https://example.com/{w}x{h}{c}.{f}", width: 3000, height: 3000 },
      }),
    );

    await expect(fetchArtist("1440846798")).resolves.toMatchObject({
      id: "1440846798",
      name: "boygenius",
      genres: ["Alternative"],
      artwork: { width: 3000, height: 3000 },
    });
  });

  it("gives no genres to an artist that has none", async () => {
    music.mockResolvedValue(artistResponse({ name: "boygenius" }));

    await expect(fetchArtist("1440846798")).resolves.toMatchObject({ genres: [] });
  });

  it("reads the top songs, the albums and the singles out of the views", async () => {
    music.mockResolvedValue(
      artistResponse(
        { name: "boygenius" },
        {
          "top-songs": { data: [song("1"), song("2")] },
          "full-albums": { data: [album("a1")] },
          singles: { data: [album("s1"), album("s2")] },
        },
      ),
    );

    const artist = await fetchArtist("1440846798");

    expect(artist.topSongs.map((track) => track.id)).toEqual(["1", "2"]);
    expect(artist.albums.map((one) => one.id)).toEqual(["a1"]);
    expect(artist.singles.map((one) => one.id)).toEqual(["s1", "s2"]);
  });

  it("reads the artist playlists, the compilations and the albums it appears on", async () => {
    music.mockResolvedValue(
      artistResponse(
        { name: "boygenius" },
        {
          "featured-playlists": { data: [playlist("pl.1")] },
          "compilation-albums": { data: [album("c1")] },
          "appears-on-albums": { data: [album("o1", { artistName: "Phoebe Bridgers" })] },
        },
      ),
    );

    const artist = await fetchArtist("1440846798");

    expect(artist.playlists).toEqual([
      { id: "pl.1", name: "Playlist pl.1", curator: { name: "Apple Music" }, artwork: undefined },
    ]);
    expect(artist.compilations.map((one) => one.id)).toEqual(["c1"]);
    expect(artist.appearsOn.map((one) => one.artist?.name)).toEqual(["Phoebe Bridgers"]);
  });

  it("keeps the day an album came out, which the tile shows as a year", async () => {
    music.mockResolvedValue(
      artistResponse(
        { name: "boygenius" },
        { "full-albums": { data: [album("a1", { releaseDate: "2023-03-31" })] } },
      ),
    );

    const artist = await fetchArtist("1440846798");

    expect(artist.albums[0]?.releaseDate).toBe("2023-03-31");
  });

  it("gives empty lists for an artist that comes with no views at all", async () => {
    music.mockResolvedValue(artistResponse({ name: "boygenius" }));

    const artist = await fetchArtist("1440846798");

    expect(artist.topSongs).toEqual([]);
    expect(artist.albums).toEqual([]);
    expect(artist.singles).toEqual([]);
    expect(artist.playlists).toEqual([]);
    expect(artist.compilations).toEqual([]);
    expect(artist.appearsOn).toEqual([]);
  });

  it("complains when Apple Music sends back no artist", async () => {
    music.mockResolvedValue({ data: { data: [] } });

    await expect(fetchArtist("0")).rejects.toThrow("Apple Music returned no artist for 0.");
  });
});

describe("searchAlbums", () => {
  const ALBUMS: ArtistAlbum[] = [
    { id: "1", name: "The record", artist: { name: "boygenius" } },
    { id: "2", name: "The film", artist: { name: "boygenius" } },
    { id: "3", name: "Debut", artist: { name: "Björk" } },
  ];

  it("gives back every album while a person has typed nothing", () => {
    expect(searchAlbums(ALBUMS, "")).toHaveLength(3);
  });

  it("looks at the name of the album", () => {
    expect(searchAlbums(ALBUMS, "film").map((one) => one.id)).toEqual(["2"]);
  });

  it("looks at who made it, accent marks and all", () => {
    expect(searchAlbums(ALBUMS, "bjork").map((one) => one.id)).toEqual(["3"]);
  });

  it("gives back no album when nothing matches", () => {
    expect(searchAlbums(ALBUMS, "nirvana")).toEqual([]);
  });
});

describe("searchPlaylists", () => {
  const playlists: ArtistPlaylist[] = [
    { id: "pl.1", name: "boygenius Essentials" },
    { id: "pl.2", name: "Inspired by boygenius" },
  ];

  it("looks at the name of the playlist", () => {
    expect(searchPlaylists(playlists, "essentials").map((one) => one.id)).toEqual(["pl.1"]);
  });
});

describe("fetchSongArtists", () => {
  it("asks the storefront catalog for the artists of the song", async () => {
    music.mockResolvedValue({ data: { data: [] } });

    await fetchSongArtists("1440857782");

    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/songs/1440857782", {
      include: "artists",
    });
  });

  it("names every artist of the song, each with an id of its own", async () => {
    music.mockResolvedValue({
      data: {
        data: [
          {
            id: "1440857782",
            type: "songs",
            relationships: {
              artists: {
                data: [
                  { id: "1", type: "artists", attributes: { name: "Kendrick Lamar" } },
                  { id: "2", type: "artists", attributes: { name: "SZA" } },
                ],
              },
            },
          },
        ],
      },
    });

    await expect(fetchSongArtists("1440857782")).resolves.toEqual([
      { id: "1", name: "Kendrick Lamar" },
      { id: "2", name: "SZA" },
    ]);
  });

  it("gives no artist for a song Apple Music does not know", async () => {
    music.mockResolvedValue({ data: { data: [] } });

    await expect(fetchSongArtists("0")).resolves.toEqual([]);
  });
});
