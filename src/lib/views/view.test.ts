import { describe, expect, it } from "vitest";
import { canSearch, isTopLevel, readView, searchLabel, viewKey } from "@/lib/views/view";

describe("readView", () => {
  it("reads the home view", () => {
    expect(readView({ name: "home" })).toEqual({ name: "home" });
  });

  it("reads the settings view", () => {
    expect(readView({ name: "settings" })).toEqual({ name: "settings" });
  });

  it("reads a list view", () => {
    expect(readView({ name: "list", list: "recently-played" })).toEqual({
      name: "list",
      list: "recently-played",
    });
  });

  it("reads a detail view", () => {
    expect(readView({ name: "detail", type: "artists", id: "1440846798" })).toEqual({
      name: "detail",
      type: "artists",
      id: "1440846798",
    });
  });

  it("takes an album", () => {
    expect(readView({ name: "detail", type: "albums", id: "a.1" })).toEqual({
      name: "detail",
      type: "albums",
      id: "a.1",
    });
  });

  it("drops the extra keys of a detail view", () => {
    expect(readView({ name: "detail", type: "albums", id: "a.1", list: "songs" })).toEqual({
      name: "detail",
      type: "albums",
      id: "a.1",
    });
  });

  it.each([
    ["no value", undefined],
    ["a string", "detail"],
    ["an unknown name", { name: "artist" }],
    ["a list without a name in the set", { name: "list", list: "movies" }],
    ["a detail without an id", { name: "detail", type: "albums" }],
    ["a detail with an id that is not a string", { name: "detail", type: "albums", id: 1 }],
    ["a detail with an unknown type", { name: "detail", type: "movies", id: "a.1" }],
    // a station only plays, so it has no screen to go back to
    ["a station", { name: "detail", type: "stations", id: "ra.1" }],
  ])("gives no view for %s", (_name, value) => {
    expect(readView(value)).toBeUndefined();
  });
});

describe("isTopLevel", () => {
  it.each([
    ["home", { name: "home" } as const],
    ["a list", { name: "list", list: "recently-played" } as const],
  ])("says %s is a destination", (_name, view) => {
    expect(isTopLevel(view)).toBe(true);
  });

  it.each([
    ["a detail", { name: "detail", type: "albums", id: "a.1" } as const],
    ["settings", { name: "settings" } as const],
  ])("says %s sits on top of a destination", (_name, view) => {
    expect(isTopLevel(view)).toBe(false);
  });
});

describe("viewKey", () => {
  it.each([
    ["a list", { name: "list", list: "albums" } as const, "list:albums"],
    [
      "a destination",
      { name: "detail", type: "library-albums", id: "l.1" } as const,
      "detail:library-albums:l.1",
    ],
    ["the settings", { name: "settings" } as const, "settings"],
  ])("names %s", (_name, view, key) => {
    expect(viewKey(view)).toBe(key);
  });

  // both show the recently played songs, so both keep one place
  it("gives home and recently played one name", () => {
    expect(viewKey({ name: "home" })).toBe(viewKey({ name: "list", list: "recently-played" }));
  });

  it("keeps the lists apart", () => {
    expect(viewKey({ name: "list", list: "albums" })).not.toBe(
      viewKey({ name: "list", list: "recently-played" }),
    );
  });

  it("keeps two destinations of one type apart", () => {
    expect(viewKey({ name: "detail", type: "albums", id: "1" })).not.toBe(
      viewKey({ name: "detail", type: "albums", id: "2" }),
    );
  });
});

describe("canSearch", () => {
  it.each([
    ["home", { name: "home" } as const],
    ["recently played", { name: "list", list: "recently-played" } as const],
    ["albums", { name: "list", list: "albums" } as const],
    ["an album", { name: "detail", type: "albums", id: "a.1" } as const],
    ["a playlist", { name: "detail", type: "playlists", id: "p.1" } as const],
    ["an artist", { name: "detail", type: "artists", id: "1440846798" } as const],
  ])("gives a search box to %s", (_name, view) => {
    expect(canSearch(view)).toBe(true);
  });

  it.each([
    ["settings", { name: "settings" } as const],
    ["songs", { name: "list", list: "songs" } as const],
  ])("gives no search box to %s", (_name, view) => {
    expect(canSearch(view)).toBe(false);
  });
});

describe("searchLabel", () => {
  it("names the list a person is on", () => {
    expect(searchLabel({ name: "list", list: "albums" })).toBe("Search albums");
    expect(searchLabel({ name: "list", list: "playlists" })).toBe("Search playlists");
  });

  it("gives home the words of recently played, which it shows", () => {
    expect(searchLabel({ name: "home" })).toBe("Search recently played");
    expect(searchLabel({ name: "list", list: "recently-played" })).toBe("Search recently played");
  });

  it("names the screen a person opened", () => {
    expect(searchLabel({ name: "detail", type: "library-albums", id: "l.1" })).toBe(
      "Search this album",
    );
    expect(searchLabel({ name: "detail", type: "playlists", id: "p.1" })).toBe(
      "Search this playlist",
    );
    expect(searchLabel({ name: "detail", type: "artists", id: "a.1" })).toBe("Search this artist");
  });
});
