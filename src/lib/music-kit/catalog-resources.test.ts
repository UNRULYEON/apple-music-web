import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCatalogResources } from "@/lib/music-kit/catalog-resources";
import { getMusicKit } from "@/lib/music-kit/instance";
import { fetchStorefront } from "@/lib/music-kit/storefront";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));

const music = vi.fn();

beforeEach(() => {
  vi.mocked(getMusicKit).mockResolvedValue({
    api: { music },
  } as unknown as MusicKit.MusicKitInstance);
  vi.mocked(fetchStorefront).mockResolvedValue({ id: "nl", name: "Netherlands" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchCatalogResources", () => {
  it("asks once for each type and keeps the order of the refs", async () => {
    music.mockImplementation(async (path: string) =>
      path.endsWith("/albums")
        ? {
            data: {
              data: [
                { type: "albums", id: "2" },
                { type: "albums", id: "1" },
              ],
            },
          }
        : { data: { data: [{ type: "playlists", id: "pl.1" }] } },
    );

    const found = await fetchCatalogResources([
      { type: "albums", id: "1" },
      { type: "playlists", id: "pl.1" },
      { type: "albums", id: "2" },
    ]);

    expect(found).toEqual([
      { type: "albums", id: "1" },
      { type: "playlists", id: "pl.1" },
      { type: "albums", id: "2" },
    ]);
    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/albums", { ids: "1,2" });
    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/playlists", { ids: "pl.1" });
  });

  it("leaves out an id that Apple Music does not hold", async () => {
    music.mockResolvedValue({ data: { data: [{ type: "albums", id: "1" }] } });

    await expect(
      fetchCatalogResources([
        { type: "albums", id: "1" },
        { type: "albums", id: "gone" },
      ]),
    ).resolves.toEqual([{ type: "albums", id: "1" }]);
  });

  it("asks for nothing when there are no refs", async () => {
    await expect(fetchCatalogResources([])).resolves.toEqual([]);
    expect(music).not.toHaveBeenCalled();
  });
});
