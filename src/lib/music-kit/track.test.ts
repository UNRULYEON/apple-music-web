import { isSameSong, readSong } from "@/lib/music-kit/track";
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
