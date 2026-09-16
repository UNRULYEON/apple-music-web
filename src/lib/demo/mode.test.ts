// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { readDemoMode, setDemoMode, subscribeToDemoMode } from "@/lib/demo/mode";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import { libraryPlaylistsQuery } from "@/lib/music-kit/playlists";
import { recentlyPlayedQuery } from "@/lib/music-kit/recently-played";
import { STORAGE_KEYS } from "@/lib/storage/keys";

afterEach(() => {
  setDemoMode(false);
  localStorage.clear();
});

describe("setDemoMode", () => {
  it("is off at the start", () => {
    expect(readDemoMode()).toBe(false);
  });

  it("keeps the choice in the browser", () => {
    setDemoMode(true);
    expect(localStorage.getItem(STORAGE_KEYS.demoMode)).toBe("true");

    setDemoMode(false);
    expect(localStorage.getItem(STORAGE_KEYS.demoMode)).toBeNull();
  });

  it("tells a listener only when the mode changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToDemoMode(listener);

    setDemoMode(true);
    setDemoMode(true);
    unsubscribe();
    setDemoMode(false);

    expect(listener).toHaveBeenCalledOnce();
  });

  it("gives the library queries keys of their own", () => {
    const real = [libraryAlbumsQuery(), libraryPlaylistsQuery(), recentlyPlayedQuery()];

    setDemoMode(true);

    const demo = [libraryAlbumsQuery(), libraryPlaylistsQuery(), recentlyPlayedQuery()];

    expect(real.map((query) => query.queryKey[1])).not.toContain("demo");
    expect(demo.map((query) => query.queryKey.slice(0, 2))).toEqual([
      ["music-kit", "demo"],
      ["music-kit", "demo"],
      ["music-kit", "demo"],
    ]);
  });
});
