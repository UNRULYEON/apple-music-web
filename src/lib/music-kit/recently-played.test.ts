import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRecentlyPlayed } from "@/lib/music-kit/recently-played";
import { stubMusicKit } from "@/test/fake-music-kit";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const music = vi.fn();

function albumItem(id: string) {
  return {
    id,
    type: "albums",
    attributes: { name: `Album ${id}`, artistName: "Someone" },
  };
}

function mockPages(...pages: { data: unknown[]; next?: string }[]) {
  for (const page of pages) {
    music.mockResolvedValueOnce({ data: page });
  }
}

function fullPage(offset: number) {
  return Array.from({ length: 10 }, (_, index) => albumItem(`a.${offset + index}`));
}

beforeEach(() => {
  stubMusicKit({ api: { music } });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchRecentlyPlayed", () => {
  it("asks for every card-like type", async () => {
    mockPages({ data: [] });

    await fetchRecentlyPlayed();

    expect(music).toHaveBeenCalledWith("/v1/me/recent/played", {
      types: "albums,library-albums,playlists,library-playlists,stations",
      limit: 10,
      offset: 0,
    });
  });

  it("names the artist of an album and the curator of a playlist", async () => {
    mockPages({
      data: [
        {
          id: "a.1",
          type: "albums",
          attributes: {
            name: "The record",
            artistName: "boygenius",
            artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 1200, height: 1200 },
          },
        },
        {
          id: "pl.1",
          type: "playlists",
          attributes: { name: "Today at Apple", curatorName: "Apple Music" },
        },
        { id: "st.1", type: "stations", attributes: { name: "Beats 1" } },
      ],
    });

    await expect(fetchRecentlyPlayed()).resolves.toEqual([
      {
        id: "a.1",
        type: "albums",
        name: "The record",
        artist: { name: "boygenius" },
        curator: undefined,
        artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 1200, height: 1200 },
      },
      {
        id: "pl.1",
        type: "playlists",
        name: "Today at Apple",
        artist: undefined,
        curator: { name: "Apple Music" },
        artwork: undefined,
      },
      {
        id: "st.1",
        type: "stations",
        name: "Beats 1",
        artist: undefined,
        curator: undefined,
        artwork: undefined,
      },
    ]);
  });

  it("reads more pages for a longer row, and stops at the limit", async () => {
    mockPages(
      { data: fullPage(0), next: "/v1/me/recent/played?offset=10" },
      { data: fullPage(10), next: "/v1/me/recent/played?offset=20" },
    );

    const played = await fetchRecentlyPlayed(15);

    expect(played).toHaveLength(15);
    expect(music).toHaveBeenCalledTimes(2);
    expect(music).toHaveBeenLastCalledWith("/v1/me/recent/played", {
      types: "albums,library-albums,playlists,library-playlists,stations",
      limit: 10,
      offset: 10,
    });
  });

  it("stops early when the user has played little", async () => {
    mockPages({ data: [albumItem("a.1")] });

    await expect(fetchRecentlyPlayed(30)).resolves.toHaveLength(1);
    expect(music).toHaveBeenCalledOnce();
  });

  it("stops on a full last page, which has no next", async () => {
    mockPages({ data: fullPage(0) });

    await expect(fetchRecentlyPlayed(30)).resolves.toHaveLength(10);
    expect(music).toHaveBeenCalledOnce();
  });

  it("drops a type it cannot show as a card", async () => {
    mockPages({
      data: [albumItem("a.1"), { id: "ar.1", type: "artists", attributes: { name: "Someone" } }],
    });

    await expect(fetchRecentlyPlayed()).resolves.toHaveLength(1);
  });
});
