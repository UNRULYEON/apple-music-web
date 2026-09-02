import { describe, expect, it } from "vitest";
import { readView } from "@/lib/views/view";

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
