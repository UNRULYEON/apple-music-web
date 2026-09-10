import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAlbum,
  fetchLibraryAlbums,
  fetchLibraryAlbumSongs,
  isAlbumInLibrary,
  isAlbumType,
  markInLibrary,
} from "@/lib/music-kit/album";
import type { Song } from "@/lib/music-kit/track";
import { getMusicKit } from "@/lib/music-kit/instance";
import { fetchStorefront } from "@/lib/music-kit/storefront";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));

const loadMusicKit = vi.mocked(getMusicKit);
const loadStorefront = vi.mocked(fetchStorefront);
const music = vi.fn();

function albumResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      data: [
        {
          id: "1440857781",
          type: "albums",
          attributes: { name: "The record", artistName: "boygenius" },
          ...overrides,
        },
      ],
    },
  };
}

function libraryAlbum(id: string) {
  return { id, type: "library-albums", attributes: { name: `Album ${id}` } };
}

function song(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: "songs",
    attributes: { name: `Song ${id}`, artistName: "boygenius", ...overrides },
  };
}

beforeEach(() => {
  loadMusicKit.mockResolvedValue({ api: { music } } as unknown as MusicKit.MusicKitInstance);
  loadStorefront.mockResolvedValue({ id: "nl", name: "Netherlands" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchAlbum", () => {
  it("asks the storefront catalog for the songs and the artists", async () => {
    music.mockResolvedValue(albumResponse());

    await fetchAlbum("albums", "1440857781");

    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/albums/1440857781", {
      include: "tracks,artists",
      "include[songs]": "artists",
    });
  });

  it("asks the library for a library album, and does not need a storefront", async () => {
    music.mockResolvedValue(albumResponse());

    await fetchAlbum("library-albums", "l.AbCdEf");

    expect(music).toHaveBeenCalledWith("/v1/me/library/albums/l.AbCdEf", {
      include: "tracks,artists",
      "include[songs]": "artists",
    });
    expect(loadStorefront).not.toHaveBeenCalled();
  });

  it("reads the album, its songs, and its artists", async () => {
    music.mockResolvedValue(
      albumResponse({
        attributes: {
          name: "The record",
          artistName: "boygenius",
          artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 3000, height: 3000 },
          releaseDate: "2023-03-31",
          trackCount: 12,
          genreNames: ["Alternative", 7, "Rock"],
          copyright: "℗ 2023 Interscope",
          recordLabel: "Interscope Records",
          editorialNotes: { standard: "Three friends, one band." },
          isComplete: true,
          isSingle: false,
        },
        relationships: {
          artists: {
            data: [{ id: "1440846798", type: "artists", attributes: { name: "boygenius" } }],
          },
          tracks: {
            data: [
              song("1", {
                name: "Without You Without Them",
                discNumber: 1,
                trackNumber: 1,
                durationInMillis: 96000,
                contentRating: "clean",
                previews: [{ url: "https://example.com/preview.m4a" }],
              }),
            ],
          },
        },
      }),
    );

    await expect(fetchAlbum("albums", "1440857781")).resolves.toEqual({
      id: "1440857781",
      type: "albums",
      name: "The record",
      artist: { name: "boygenius" },
      artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 3000, height: 3000 },
      releaseDate: "2023-03-31",
      trackCount: 12,
      genres: ["Alternative", "Rock"],
      copyright: "℗ 2023 Interscope",
      recordLabel: "Interscope Records",
      notes: "Three friends, one band.",
      isComplete: true,
      isSingle: false,
      artists: [{ id: "1440846798", name: "boygenius", artwork: undefined }],
      songs: [
        {
          id: "1",
          name: "Without You Without Them",
          artist: { name: "boygenius" },
          artists: [],
          artwork: undefined,
          discNumber: 1,
          trackNumber: 1,
          durationInMillis: 96000,
          contentRating: "clean",
          previewUrl: "https://example.com/preview.m4a",
        },
      ],
    });
  });

  it("gives empty lists for an album that comes without relationships", async () => {
    music.mockResolvedValue(albumResponse());

    const album = await fetchAlbum("albums", "1440857781");

    expect(album.songs).toEqual([]);
    expect(album.artists).toEqual([]);
    expect(album.genres).toEqual([]);
  });

  it("keeps the songs it can read, and drops the ones it cannot", async () => {
    music.mockResolvedValue(
      albumResponse({
        relationships: {
          tracks: { data: [song("1"), { id: "2", type: "songs" }, { type: "songs" }] },
        },
      }),
    );

    await expect(fetchAlbum("albums", "1440857781")).resolves.toMatchObject({
      songs: [expect.objectContaining({ id: "1" })],
    });
  });

  it("uses the short note when there is no standard note", async () => {
    music.mockResolvedValue(
      albumResponse({
        attributes: { name: "The record", editorialNotes: { short: "Three friends." } },
      }),
    );

    await expect(fetchAlbum("albums", "1440857781")).resolves.toMatchObject({
      notes: "Three friends.",
    });
  });

  it("fails when Apple Music sends back no album", async () => {
    music.mockResolvedValue({ data: { data: [] } });

    await expect(fetchAlbum("albums", "0")).rejects.toThrow("Apple Music returned no album for 0.");
  });
});

function libraryResponse(songs: unknown[]) {
  return {
    data: {
      data: [
        {
          id: "l.AbCdEf",
          type: "library-albums",
          attributes: { name: "The record", trackCount: 12 },
          relationships: { tracks: { data: songs } },
        },
      ],
    },
  };
}

function catalogResponse(songs: unknown[]) {
  return {
    data: {
      data: [
        {
          id: "1440857781",
          type: "albums",
          attributes: { name: "The record", trackCount: 12 },
          relationships: { tracks: { data: songs } },
        },
      ],
    },
  };
}

describe("fetchAlbum for a library album", () => {
  it("asks the catalog album for the whole track list", async () => {
    music.mockResolvedValueOnce(libraryResponse([])).mockResolvedValueOnce(catalogResponse([]));

    await fetchAlbum("library-albums", "l.AbCdEf");

    expect(music).toHaveBeenCalledWith("/v1/me/library/albums/l.AbCdEf/catalog", {
      include: "tracks,artists",
      "include[songs]": "artists",
    });
  });

  it("shows the whole catalog track list, and keeps the library id", async () => {
    music
      .mockResolvedValueOnce(libraryResponse([song("i.one", { playParams: { catalogId: "1" } })]))
      .mockResolvedValueOnce(catalogResponse([song("1"), song("2")]));

    const album = await fetchAlbum("library-albums", "l.AbCdEf");

    expect(album.id).toBe("l.AbCdEf");
    expect(album.type).toBe("library-albums");
    expect(album.songs.map((track) => track.id)).toEqual(["1", "2"]);
  });

  it("keeps the library songs when the album has no catalog", async () => {
    music
      .mockResolvedValueOnce(libraryResponse([song("i.one")]))
      .mockRejectedValueOnce(new Error("404"));

    const album = await fetchAlbum("library-albums", "l.AbCdEf");

    expect(album.songs.map((track) => track.id)).toEqual(["i.one"]);
  });
});

describe("fetchLibraryAlbumSongs", () => {
  it("reads the songs the library holds", async () => {
    music.mockResolvedValue(libraryResponse([song("i.one"), song("i.two")]));

    await expect(fetchLibraryAlbumSongs("l.AbCdEf")).resolves.toMatchObject([
      { id: "i.one" },
      { id: "i.two" },
    ]);
    expect(music).toHaveBeenCalledWith("/v1/me/library/albums/l.AbCdEf", { include: "tracks" });
  });

  it("gives no songs when the album is gone", async () => {
    music.mockResolvedValue({ data: { data: [] } });

    await expect(fetchLibraryAlbumSongs("l.AbCdEf")).resolves.toEqual([]);
  });
});

describe("markInLibrary", () => {
  it("marks a catalog song that the library holds under another id", () => {
    const songs = markInLibrary(
      [
        { id: "1", name: "One", playId: "1" },
        { id: "2", name: "Two", playId: "2" },
      ],
      [{ id: "i.one", name: "One", playId: "1" }],
    );

    expect(songs.map((track) => track.inLibrary)).toEqual([true, false]);
  });

  it("leaves the songs alone while the library is unknown", () => {
    const songs: Song[] = [{ id: "1", name: "One" }];

    expect(markInLibrary(songs, undefined)).toBe(songs);
  });
});

describe("fetchLibraryAlbums", () => {
  it("reads the name, the artist, and the artwork", async () => {
    music.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "l.AbCdEf",
            attributes: {
              name: "The record",
              artistName: "boygenius",
              artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 3000, height: 3000 },
            },
          },
        ],
      },
    });

    await expect(fetchLibraryAlbums()).resolves.toEqual([
      {
        id: "l.AbCdEf",
        name: "The record",
        artist: { name: "boygenius" },
        artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 3000, height: 3000 },
      },
    ]);
    expect(music).toHaveBeenCalledWith("/v1/me/library/albums", { limit: 100, offset: 0 });
  });

  it("reads every page until a page is not full", async () => {
    const full = Array.from({ length: 100 }, (_, index) => libraryAlbum(`l.${index}`));
    music.mockResolvedValueOnce({
      data: { data: full, next: "/v1/me/library/albums?offset=100" },
    });
    music.mockResolvedValueOnce({ data: { data: [libraryAlbum("l.100")] } });

    const albums = await fetchLibraryAlbums();

    expect(albums).toHaveLength(101);
    expect(music).toHaveBeenLastCalledWith("/v1/me/library/albums", { limit: 100, offset: 100 });
  });

  it("drops an album that carries no name", async () => {
    music.mockResolvedValueOnce({
      data: { data: [{ id: "l.1", attributes: {} }, libraryAlbum("l.2")] },
    });

    await expect(fetchLibraryAlbums()).resolves.toMatchObject([{ id: "l.2" }]);
  });
});

describe("readLibraryAlbum", () => {
  it("keeps the catalog album a library album stands for", async () => {
    music.mockResolvedValue({
      data: {
        data: [
          {
            id: "l.1",
            type: "library-albums",
            attributes: { name: "The record", playParams: { id: "l.1", catalogId: "1440857781" } },
          },
        ],
      },
    });

    await expect(fetchLibraryAlbums()).resolves.toMatchObject([{ catalogId: "1440857781" }]);
  });

  it("leaves the catalog album out when the library album has none", async () => {
    music.mockResolvedValue({
      data: { data: [{ id: "l.1", type: "library-albums", attributes: { name: "Home tape" } }] },
    });

    const [album] = await fetchLibraryAlbums();

    expect(album?.catalogId).toBeUndefined();
  });
});

describe("isAlbumType", () => {
  it.each(["albums", "library-albums"])("knows %s", (type) => {
    expect(isAlbumType(type)).toBe(true);
  });

  it.each([
    ["a playlist", "playlists"],
    ["a station", "stations"],
    ["no value", undefined],
  ])("does not take %s for an album", (_name, value) => {
    expect(isAlbumType(value)).toBe(false);
  });
});

function songsOf(songs: { inLibrary?: boolean }[]): Song[] {
  return songs.map((track, i) => ({ id: `s${i}`, name: `Song ${i}`, ...track }));
}

describe("isAlbumInLibrary", () => {
  it("takes an album whose songs are all in the library", () => {
    expect(isAlbumInLibrary(songsOf([{ inLibrary: true }, { inLibrary: true }]), 2)).toBe(true);
  });

  it("does not take an album with a song outside the library", () => {
    expect(isAlbumInLibrary(songsOf([{ inLibrary: true }, {}]), 2)).toBe(false);
  });

  it("does not take an album that shows fewer songs than it has", () => {
    expect(isAlbumInLibrary(songsOf([{ inLibrary: true }]), 12)).toBe(false);
  });

  it("does not take an album with no songs", () => {
    expect(isAlbumInLibrary(songsOf([]))).toBe(false);
  });
});
