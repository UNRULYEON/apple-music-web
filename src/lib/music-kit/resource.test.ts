import { afterEach, describe, expect, it, vi } from "vitest";
import { artworkUrl, readArtist, readCurator, type Artwork } from "@/lib/music-kit/resource";

function artwork(overrides: Partial<Artwork> = {}): Artwork {
  return {
    url: "https://example.com/image/{w}x{h}bb.jpg",
    width: 1200,
    height: 1200,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("artworkUrl", () => {
  it("fills in the width and the height", () => {
    vi.stubGlobal("devicePixelRatio", 1);

    expect(artworkUrl(artwork(), 40)).toBe("https://example.com/image/40x40bb.jpg");
  });

  it("multiplies the size by the device pixel ratio", () => {
    vi.stubGlobal("devicePixelRatio", 3);

    expect(artworkUrl(artwork(), 40)).toBe("https://example.com/image/120x120bb.jpg");
  });

  it("does not ask for more pixels than the source has", () => {
    vi.stubGlobal("devicePixelRatio", 2);

    expect(artworkUrl(artwork({ width: 90, height: 60 }), 100)).toBe(
      "https://example.com/image/90x60bb.jpg",
    );
  });

  it("fills in the crop and the format", () => {
    vi.stubGlobal("devicePixelRatio", 1);

    expect(artworkUrl(artwork({ url: "https://example.com/image/{w}x{h}{c}.{f}" }), 64)).toBe(
      "https://example.com/image/64x64bb.jpg",
    );
  });
});

describe("readArtist", () => {
  it("reads a name into an artist", () => {
    expect(readArtist("boygenius")).toEqual({ name: "boygenius" });
  });

  it.each([
    ["no value", undefined],
    ["a number", 1],
    ["an object", { name: "boygenius" }],
  ])("gives no artist for %s", (_name, value) => {
    expect(readArtist(value)).toBeUndefined();
  });
});

describe("readCurator", () => {
  it("reads a name into a curator", () => {
    expect(readCurator("Apple Music")).toEqual({ name: "Apple Music" });
  });

  it("gives no curator for a value that is not a name", () => {
    expect(readCurator(undefined)).toBeUndefined();
  });
});
