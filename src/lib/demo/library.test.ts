import { describe, expect, it } from "vitest";
import { DEMO_LIBRARY, isDemoSource } from "@/lib/demo/library";

describe("isDemoSource", () => {
  it("knows an album of the demo", () => {
    expect(isDemoSource({ type: "albums", id: DEMO_LIBRARY.albums[0] ?? "" })).toBe(true);
  });

  it("knows a playlist of the demo", () => {
    expect(isDemoSource({ type: "library-playlists", id: "demo.salsa-classics" })).toBe(true);
  });

  it("does not know an album or a playlist from somewhere else", () => {
    expect(isDemoSource({ type: "albums", id: "0" })).toBe(false);
    expect(isDemoSource({ type: "library-albums", id: DEMO_LIBRARY.albums[0] ?? "" })).toBe(false);
    expect(isDemoSource({ type: "library-playlists", id: "p.1" })).toBe(false);
  });

  it("does not know a queue without a source", () => {
    expect(isDemoSource(undefined)).toBe(false);
  });
});
