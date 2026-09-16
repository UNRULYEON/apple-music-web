import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type Artwork,
  artworkUrl,
  mosaicArtwork,
  readArtist,
  readArtwork,
  readCurator,
} from "@/lib/music-kit/resource";

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

describe("readArtwork", () => {
  const source = { url: "https://example.com/image/{w}x{h}bb.jpg", width: 1200, height: 1200 };

  it("reads the colors and adds the leading hash", () => {
    const colors = {
      bgColor: "1d1d1f",
      textColor1: "f5f5f7",
      textColor2: "d2d2d7",
      textColor3: "a1a1a6",
      textColor4: "6e6e73",
    };

    expect(readArtwork({ ...source, ...colors })).toEqual({
      ...source,
      bgColor: "#1d1d1f",
      textColor1: "#f5f5f7",
      textColor2: "#d2d2d7",
      textColor3: "#a1a1a6",
      textColor4: "#6e6e73",
    });
  });

  it("gives no colors when the artwork has none", () => {
    expect(readArtwork(source)).toEqual({
      ...source,
      bgColor: undefined,
      textColor1: undefined,
      textColor2: undefined,
      textColor3: undefined,
      textColor4: undefined,
    });
  });

  it("gives no artwork for a value that is not artwork", () => {
    expect(readArtwork("boygenius")).toBeUndefined();
  });
});

function art(url: string): Artwork {
  return { url, width: 600, height: 600 };
}

describe("mosaicArtwork", () => {
  it("makes a mosaic of the first four different covers", () => {
    const mosaic = mosaicArtwork([
      art("a"),
      art("a"),
      art("b"),
      undefined,
      art("c"),
      art("d"),
      art("e"),
    ]);

    expect(mosaic?.url).toBe("a");
    expect(mosaic?.mosaic?.map((piece) => piece.url)).toEqual(["a", "b", "c", "d"]);
  });

  it("gives the first cover when there are fewer than four", () => {
    expect(mosaicArtwork([art("a"), art("b"), art("a")])).toEqual(art("a"));
  });

  it("gives nothing when no song has a cover", () => {
    expect(mosaicArtwork([undefined])).toBeUndefined();
  });
});
