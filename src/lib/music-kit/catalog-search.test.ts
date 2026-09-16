import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catalogSearchQuery, fetchCatalogSearch } from "@/lib/music-kit/catalog-search";
import { getMusicKit } from "@/lib/music-kit/instance";
import { fetchStorefront } from "@/lib/music-kit/storefront";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));

const music = vi.fn();

function results(sections: Record<string, unknown[]>) {
  const groups = Object.fromEntries(
    Object.entries(sections).map(([name, data]) => [name, { data }]),
  );

  return { data: { results: groups } };
}

beforeEach(() => {
  vi.mocked(getMusicKit).mockResolvedValue({
    api: { music },
  } as unknown as MusicKit.MusicKitInstance);
  vi.mocked(fetchStorefront).mockResolvedValue({ id: "nl", name: "Netherlands" });
  music.mockResolvedValue(results({}));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchCatalogSearch", () => {
  it("asks the storefront catalog for the three kinds", async () => {
    await fetchCatalogSearch("boygenius");

    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/search", {
      term: "boygenius",
      types: "artists,albums,playlists",
      limit: 10,
    });
  });

  it("asks nothing when the term holds no words", async () => {
    const found = await fetchCatalogSearch("   ");

    expect(music).not.toHaveBeenCalled();
    expect(found).toEqual({ artists: [], albums: [], playlists: [] });
  });

  it("names the artist of an album", async () => {
    music.mockResolvedValue(
      results({
        albums: [
          { id: "1", type: "albums", attributes: { name: "the record", artistName: "boygenius" } },
        ],
      }),
    );

    const found = await fetchCatalogSearch("the record");

    expect(found.albums).toEqual([{ id: "1", name: "the record", credit: "boygenius" }]);
  });

  it("gives an artist its first genre", async () => {
    music.mockResolvedValue(
      results({
        artists: [
          {
            id: "a.1",
            type: "artists",
            attributes: { name: "boygenius", genreNames: ["Alternative", "Rock"] },
          },
        ],
      }),
    );

    const found = await fetchCatalogSearch("boygenius");

    expect(found.artists).toEqual([{ id: "a.1", name: "boygenius", credit: "Alternative" }]);
  });

  it("names the curator of a playlist, or what it says about itself", async () => {
    music.mockResolvedValue(
      results({
        playlists: [
          {
            id: "p.1",
            type: "playlists",
            attributes: { name: "Today's Hits", curatorName: "Apple Music" },
          },
          {
            id: "p.2",
            type: "playlists",
            attributes: { name: "Quiet", description: { standard: "Songs for the dark" } },
          },
        ],
      }),
    );

    const found = await fetchCatalogSearch("hits");

    expect(found.playlists.map((playlist) => playlist.credit)).toEqual([
      "Apple Music",
      "Songs for the dark",
    ]);
  });

  it("drops an item that Apple sent without a name", async () => {
    music.mockResolvedValue(
      results({ albums: [{ id: "1", type: "albums", attributes: {} }, "broken"] }),
    );

    const found = await fetchCatalogSearch("nothing");

    expect(found.albums).toEqual([]);
  });

  it("stays empty when Apple sends no results at all", async () => {
    music.mockResolvedValue({ data: {} });

    const found = await fetchCatalogSearch("nothing");

    expect(found).toEqual({ artists: [], albums: [], playlists: [] });
  });
});

describe("catalogSearchQuery", () => {
  it("waits until a person types something", () => {
    expect(catalogSearchQuery("  ").enabled).toBe(false);
    expect(catalogSearchQuery("boygenius").enabled).toBe(true);
  });

  it("keeps each term apart", () => {
    expect(catalogSearchQuery("kid a").queryKey).toEqual(["music-kit", "catalog-search", "kid a"]);
  });
});
