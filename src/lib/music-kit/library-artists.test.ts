import { describe, expect, it } from "vitest";
import type { LibraryAlbum } from "@/lib/music-kit/album";
import {
  albumsOfArtist,
  pickArtistId,
  readLibraryArtists,
  searchArtists,
} from "@/lib/music-kit/library-artists";

function album(id: string, name: string, artist?: string, artwork?: string): LibraryAlbum {
  return {
    id,
    type: "library-albums",
    name,
    artist: artist === undefined ? undefined : { name: artist },
    artwork: artwork === undefined ? undefined : { url: artwork, width: 1200, height: 1200 },
  };
}

describe("readLibraryArtists", () => {
  it("counts the albums of each artist", () => {
    const artists = readLibraryArtists([
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
    const artists = readLibraryArtists([
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
    const [artist] = readLibraryArtists([
      album("1", "Kid A", "Radiohead"),
      album("2", "In Rainbows", "Radiohead", "https://example.test/rainbows"),
    ]);

    expect(artist?.artwork?.url).toBe("https://example.test/rainbows");
  });

  it("leaves out an album that names no artist", () => {
    expect(readLibraryArtists([album("1", "A voice memo")])).toEqual([]);
  });

  it("gives no artist for an empty library", () => {
    expect(readLibraryArtists([])).toEqual([]);
  });
});

describe("searchArtists", () => {
  const artists = readLibraryArtists([
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
    expect(pickArtistId([], "Radiohead")).toBe("");
  });

  it("gives no id for an artist that Apple Music does not hold", () => {
    expect(pickArtistId([{ name: "A friend" }], "A friend")).toBe("");
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
