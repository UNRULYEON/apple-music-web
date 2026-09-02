import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMusicKit } from "@/lib/music-kit/instance";
import { fetchLibraryPlaylists } from "@/lib/music-kit/playlists";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const loadMusicKit = vi.mocked(getMusicKit);
const music = vi.fn();

function playlistItem(id: string) {
  return {
    id,
    type: "library-playlists",
    attributes: {
      name: `Playlist ${id}`,
      canEdit: true,
      hasCatalog: false,
      isPublic: false,
    },
  };
}

function mockPages(...pages: Array<{ data: unknown[]; next?: string }>) {
  for (const page of pages) {
    music.mockResolvedValueOnce({ data: page });
  }
}

beforeEach(() => {
  loadMusicKit.mockResolvedValue({ api: { music } } as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchLibraryPlaylists", () => {
  it("reads the name, the artwork, and the description", async () => {
    mockPages({
      data: [
        {
          id: "p.1",
          attributes: {
            name: "Late night",
            canEdit: true,
            hasCatalog: true,
            isPublic: false,
            dateAdded: "2026-01-02T03:04:05Z",
            description: { standard: "For the small hours." },
            artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 3000, height: 3000 },
          },
        },
      ],
    });

    await expect(fetchLibraryPlaylists()).resolves.toEqual([
      {
        id: "p.1",
        name: "Late night",
        description: "For the small hours.",
        artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 3000, height: 3000 },
        canEdit: true,
        hasCatalog: true,
        isPublic: false,
        dateAdded: "2026-01-02T03:04:05Z",
      },
    ]);
  });

  it("reads every page until a page is not full", async () => {
    const full = Array.from({ length: 100 }, (_, index) => playlistItem(`p.${index}`));
    mockPages(
      { data: full, next: "/v1/me/library/playlists?offset=100" },
      { data: [playlistItem("p.100")] },
    );

    const playlists = await fetchLibraryPlaylists();

    expect(playlists).toHaveLength(101);
    expect(music).toHaveBeenCalledTimes(2);
    expect(music).toHaveBeenLastCalledWith("/v1/me/library/playlists", { limit: 100, offset: 100 });
  });

  it("drops an item the API cannot describe", async () => {
    mockPages({ data: [playlistItem("p.1"), { id: "p.2" }, { attributes: { name: "No id" } }] });

    await expect(fetchLibraryPlaylists()).resolves.toHaveLength(1);
  });

  it("stops on a full last page, which has no next", async () => {
    mockPages({ data: Array.from({ length: 100 }, (_, index) => playlistItem(`p.${index}`)) });

    await expect(fetchLibraryPlaylists()).resolves.toHaveLength(100);
    expect(music).toHaveBeenCalledOnce();
  });

  it("gives an empty list when the library has no playlists", async () => {
    mockPages({ data: [] });

    await expect(fetchLibraryPlaylists()).resolves.toEqual([]);
  });
});
