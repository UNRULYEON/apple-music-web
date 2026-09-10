import { isSameSong, readSong, searchSongs, type Song } from "@/lib/music-kit/track";
import { describe, expect, it } from "vitest";

describe("isSameSong", () => {
  it("holds a song against itself", () => {
    const song = { id: "s1", name: "First" };

    expect(isSameSong(song, song)).toBe(true);
  });

  it("holds a song in the library against the catalog song it plays", () => {
    const inLibrary = { id: "i.abc", name: "First", playId: "s1" };
    const inQueue = { id: "s1", name: "First" };

    expect(isSameSong(inQueue, inLibrary)).toBe(true);
  });

  it("keeps two songs apart", () => {
    expect(isSameSong({ id: "s1", name: "First" }, { id: "s2", name: "Second" })).toBe(false);
  });

  it("keeps two songs apart that both play by their own id", () => {
    const one = { id: "i.abc", name: "First" };
    const other = { id: "i.def", name: "Second" };

    expect(isSameSong(one, other)).toBe(false);
  });

  it("says no when a song is missing", () => {
    expect(isSameSong(undefined, { id: "s1", name: "First" })).toBe(false);
  });
});

describe("readSong", () => {
  it("takes the catalog id of a library song as the id it plays by", () => {
    const song = readSong({
      id: "i.abc",
      attributes: { name: "First", playParams: { id: "i.abc", catalogId: "s1" } },
    });

    expect(song?.id).toBe("i.abc");
    expect(song?.playId).toBe("s1");
  });
});

describe("searchSongs", () => {
  const SONGS: Song[] = [
    { id: "1", name: "Without You Without Them", artist: { name: "boygenius" } },
    { id: "2", name: "$20", artist: { name: "boygenius" } },
    { id: "3", name: "Nameless", artist: { name: "Björk" } },
  ];

  it("gives back every song while a person has typed nothing", () => {
    expect(searchSongs(SONGS, "")).toHaveLength(3);
  });

  it("looks at the name of the song", () => {
    expect(searchSongs(SONGS, "without").map((song) => song.id)).toEqual(["1"]);
  });

  it("looks at who plays it, accent marks and all", () => {
    expect(searchSongs(SONGS, "bjork").map((song) => song.id)).toEqual(["3"]);
  });

  it("gives back no song when nothing matches", () => {
    expect(searchSongs(SONGS, "nirvana")).toEqual([]);
  });
});
