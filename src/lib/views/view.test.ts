import { describe, expect, it } from "vitest";
import { isTopLevel, readView, viewKey } from "@/lib/views/view";

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
