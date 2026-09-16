import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catalogPath, fetchEveryPage } from "@/lib/music-kit/api";
import { fetchStorefront } from "@/lib/music-kit/storefront";
import { stubMusicKit } from "@/test/fake-music-kit";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));

const music = vi.fn();

function page(ids: string[], next?: string): { data: { data: { id: string }[]; next?: string } } {
  return { data: { data: ids.map((id) => ({ id })), next } };
}

beforeEach(() => {
  stubMusicKit({
    api: { music },
  });
  vi.mocked(fetchStorefront).mockResolvedValue({ id: "nl", name: "Netherlands" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("catalogPath", () => {
  it("builds a path in the storefront of the person", async () => {
    await expect(catalogPath("albums", "1440857781")).resolves.toBe(
      "/v1/catalog/nl/albums/1440857781",
    );
  });

  it("encodes each segment", async () => {
    await expect(catalogPath("songs", "a/b")).resolves.toBe("/v1/catalog/nl/songs/a%2Fb");
  });
});

describe("fetchEveryPage", () => {
  it("follows the pages until Apple Music has no next page", async () => {
    music.mockResolvedValueOnce(page(["1", "2"], "/next")).mockResolvedValueOnce(page(["3"]));

    const items = await fetchEveryPage("/v1/me/library/albums", { include: "catalog" }, 2);

    expect(items).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }]);
    expect(music).toHaveBeenNthCalledWith(1, "/v1/me/library/albums", {
      include: "catalog",
      limit: 2,
      offset: 0,
    });
    expect(music).toHaveBeenNthCalledWith(2, "/v1/me/library/albums", {
      include: "catalog",
      limit: 2,
      offset: 2,
    });
  });

  it("starts at the offset it is given", async () => {
    music.mockResolvedValueOnce(page(["3"]));

    await fetchEveryPage("/path", {}, 2, { from: 4 });

    expect(music).toHaveBeenCalledWith("/path", { limit: 2, offset: 4 });
  });

  it("stops at the limit it is given", async () => {
    music.mockResolvedValue(page(["1", "2"], "/next"));

    const items = await fetchEveryPage("/path", {}, 2, { until: 4 });

    expect(items).toHaveLength(4);
    expect(music).toHaveBeenCalledTimes(2);
  });
});
