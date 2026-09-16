import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LibraryAlbum } from "@/lib/music-kit/album";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  albumsOfArtist,
  fetchArtistPictures,
  fetchCatalogArtistPictures,
  groupLibraryArtists,
  pickArtistId,
  searchArtists,
  withPictures,
} from "@/lib/music-kit/library-artists";
import { fetchStorefront } from "@/lib/music-kit/storefront";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));

const music = vi.fn();

beforeEach(() => {
  vi.mocked(getMusicKit).mockResolvedValue({
    api: { music },
  } as unknown as MusicKit.MusicKitInstance);
  vi.mocked(fetchStorefront).mockResolvedValue({ id: "nl", name: "Netherlands" });
});

afterEach(() => {
  vi.clearAllMocks();
});

function picture(url: string) {
  return { url, width: 1000, height: 1000 };
}

function libraryArtist(name: string, artworkUrl?: string) {
  return {
    id: `r.${name}`,
    type: "library-artists",
    attributes: { name },
    relationships: {
      catalog: {
        data:
          artworkUrl === undefined
            ? []
            : [{ id: `c.${name}`, attributes: { name, artwork: picture(artworkUrl) } }],
      },
    },
  };
}

function album(id: string, name: string, artist?: string, artwork?: string): LibraryAlbum {
  return {
    id,
    type: "library-albums",
    name,
    artist: artist === undefined ? undefined : { name: artist },
    artwork: artwork === undefined ? undefined : { url: artwork, width: 1200, height: 1200 },
  };
}

describe("groupLibraryArtists", () => {
  it("counts the albums of each artist", () => {
    const artists = groupLibraryArtists([
      album("1", "Kid A", "Radiohead"),
      album("2", "In Rainbows", "Radiohead"),
      album("3", "Vespertine", "Björk"),
    ]);

    expect(artists).toEqual([
      { name: "Björk", albumCount: 1, artwork: undefined },
      { name: "Radiohead", albumCount: 2, artwork: undefined },
    ]);
  });

  it("sorts the artists by name", () => {
    const artists = groupLibraryArtists([
      album("1", "Blue", "Joni Mitchell"),
      album("2", "Aja", "Steely Dan"),
      album("3", "Bitches Brew", "Miles Davis"),
    ]);

    expect(artists.map((artist) => artist.name)).toEqual([
      "Joni Mitchell",
      "Miles Davis",
      "Steely Dan",
    ]);
  });

  it("takes the artwork of the first album that has one", () => {
    const [artist] = groupLibraryArtists([
      album("1", "Kid A", "Radiohead"),
      album("2", "In Rainbows", "Radiohead", "https://example.test/rainbows"),
    ]);

    expect(artist?.artwork?.url).toBe("https://example.test/rainbows");
  });

  it("leaves out an album that names no artist", () => {
    expect(groupLibraryArtists([album("1", "A voice memo")])).toEqual([]);
  });

  it("gives no artist for an empty library", () => {
    expect(groupLibraryArtists([])).toEqual([]);
  });
});

describe("searchArtists", () => {
  const artists = groupLibraryArtists([
    album("1", "Vespertine", "Björk"),
    album("2", "Kid A", "Radiohead"),
  ]);

  it("finds an artist without the accent marks", () => {
    expect(searchArtists(artists, "bjork").map((artist) => artist.name)).toEqual(["Björk"]);
  });

  it("keeps every artist for an empty term", () => {
    expect(searchArtists(artists, "")).toHaveLength(2);
  });
});

describe("pickArtistId", () => {
  const artists = [
    { id: "1", name: "Thom Yorke" },
    { id: "2", name: "Radiohead" },
  ];

  it("takes the artist the screen opened under", () => {
    expect(pickArtistId(artists, "Radiohead")).toBe("2");
  });

  it("takes the first artist when an album names more than the one asked for", () => {
    expect(pickArtistId(artists, "Radiohead & Friends")).toBe("1");
  });

  it("gives no id when the album names no artist", () => {
    expect(pickArtistId([], "Radiohead")).toBeUndefined();
  });

  it("gives no id for an artist that Apple Music does not hold", () => {
    expect(pickArtistId([{ name: "A friend" }], "A friend")).toBeUndefined();
  });
});

describe("albumsOfArtist", () => {
  it("gives the albums of one artist", () => {
    const albums = [
      album("1", "Kid A", "Radiohead"),
      album("2", "Vespertine", "Björk"),
      album("3", "In Rainbows", "Radiohead"),
    ];

    expect(albumsOfArtist(albums, "Radiohead").map((found) => found.id)).toEqual(["1", "3"]);
  });

  it("gives no album for a name the library does not hold", () => {
    expect(albumsOfArtist([album("1", "Kid A", "Radiohead")], "Björk")).toEqual([]);
  });
});

describe("withPictures", () => {
  it("gives an artist its own picture and keeps the album cover for the rest", () => {
    const artists = groupLibraryArtists([
      album("1", "Seychelles", "Masayoshi Takanaka", "cover-1"),
      album("2", "Headphones", "Een Glish", "cover-2"),
    ]);

    const shown = withPictures(artists, { "Masayoshi Takanaka": picture("takanaka") });

    expect(shown.map((artist) => artist.artwork?.url)).toEqual(["cover-2", "takanaka"]);
  });

  it("keeps the album covers while there are no pictures", () => {
    const artists = groupLibraryArtists([album("1", "Kid A", "Radiohead", "cover")]);

    expect(withPictures(artists, undefined)).toBe(artists);
  });

  it("does not take a name like constructor for a picture", () => {
    const artists = groupLibraryArtists([album("1", "Record", "constructor", "cover")]);

    expect(withPictures(artists, {})[0]?.artwork?.url).toBe("cover");
  });
});

describe("fetchArtistPictures", () => {
  it("reads the catalog picture of every library artist on every page", async () => {
    const full = Array.from({ length: 100 }, (_, index) => libraryArtist(`Artist ${index}`));
    music
      .mockResolvedValueOnce({
        data: {
          data: [libraryArtist("Radiohead", "radiohead"), ...full.slice(1)],
          next: "/v1/me/library/artists?offset=100",
        },
      })
      .mockResolvedValueOnce({ data: { data: [libraryArtist("Björk", "bjork")] } });

    const pictures = await fetchArtistPictures();

    expect(pictures).toEqual({ Radiohead: picture("radiohead"), Björk: picture("bjork") });
    expect(music).toHaveBeenCalledWith("/v1/me/library/artists", {
      include: "catalog",
      limit: 100,
      offset: 100,
    });
  });
});

describe("fetchCatalogArtistPictures", () => {
  it("names the picture of the first artist after the credit on the album", async () => {
    music.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "1779566450",
            type: "albums",
            attributes: { name: "KAYTRAMINÉ", artistName: "KAYTRAMINÉ, Aminé & KAYTRANADA" },
            relationships: {
              artists: {
                data: [
                  { id: "1", attributes: { name: "KAYTRAMINÉ", artwork: picture("kaytramine") } },
                  { id: "2", attributes: { name: "Aminé", artwork: picture("amine") } },
                ],
              },
            },
          },
        ],
      },
    });

    await expect(fetchCatalogArtistPictures(["1779566450"])).resolves.toEqual({
      "KAYTRAMINÉ, Aminé & KAYTRANADA": picture("kaytramine"),
    });
    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/albums", {
      include: "artists",
      ids: "1779566450",
    });
  });
});
