import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  fetchDemoPlaylists,
  fetchLibraryPlaylists,
  fetchPlaylist,
  isPlaylistType,
} from "@/lib/music-kit/playlists";
import { fetchStorefront } from "@/lib/music-kit/storefront";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));
vi.mock("@/lib/demo/library", () => {
  const playlist = {
    id: "demo.mix",
    name: "Mix",
    songs: ["s1", "s2"],
  };

  return {
    DEMO_CURATOR: "Amar Kisoensingh",
    DEMO_LIBRARY: { recentlyPlayed: [], albums: [], playlists: [playlist] },
    findDemoPlaylist: (id: string) => (id === playlist.id ? playlist : undefined),
  };
});

const loadMusicKit = vi.mocked(getMusicKit);
const loadStorefront = vi.mocked(fetchStorefront);
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

function mockPages(...pages: { data: unknown[]; next?: string }[]) {
  for (const page of pages) {
    music.mockResolvedValueOnce({ data: page });
  }
}

beforeEach(() => {
  loadMusicKit.mockResolvedValue({ api: { music } } as unknown as MusicKit.MusicKitInstance);
  loadStorefront.mockResolvedValue({ id: "nl", name: "Netherlands" });
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
        type: "library-playlists",
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

function playlistResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      data: [
        {
          id: "pl.u-123",
          type: "playlists",
          attributes: { name: "Late night" },
          ...overrides,
        },
      ],
    },
  };
}

function track(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: "songs",
    attributes: { name: `Track ${id}`, artistName: "boygenius", ...overrides },
  };
}

describe("isPlaylistType", () => {
  it("accepts a catalog playlist and a library playlist", () => {
    expect(isPlaylistType("playlists")).toBe(true);
    expect(isPlaylistType("library-playlists")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isPlaylistType("albums")).toBe(false);
    expect(isPlaylistType(undefined)).toBe(false);
  });
});

describe("fetchPlaylist", () => {
  it("asks the storefront catalog for the tracks", async () => {
    music.mockResolvedValue(playlistResponse());

    await fetchPlaylist("playlists", "pl.u-123");

    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/playlists/pl.u-123", {
      include: "tracks",
      "include[songs]": "artists",
    });
  });

  it("asks the library for a library playlist, and does not need a storefront", async () => {
    music.mockResolvedValue(playlistResponse());

    await fetchPlaylist("library-playlists", "p.AbCdEf");

    expect(music).toHaveBeenCalledWith("/v1/me/library/playlists/p.AbCdEf", {
      include: "tracks",
      "include[songs]": "artists",
    });
    expect(loadStorefront).not.toHaveBeenCalled();
  });

  it("reads the playlist and its tracks", async () => {
    music.mockResolvedValue(
      playlistResponse({
        attributes: {
          name: "Late night",
          curatorName: "Apple Music",
          description: { standard: "For the small hours." },
          playlistType: "editorial",
          lastModifiedDate: "2026-02-03T04:05:06Z",
          artwork: { url: "https://example.com/{w}x{h}bb.jpg", width: 3000, height: 3000 },
        },
        relationships: {
          tracks: { data: [track("s.1", { durationInMillis: 204000 }), track("s.2")] },
        },
      }),
    );

    const playlist = await fetchPlaylist("playlists", "pl.u-123");

    expect(playlist.name).toBe("Late night");
    expect(playlist.type).toBe("playlists");
    expect(playlist.curator).toEqual({ name: "Apple Music" });
    expect(playlist.description).toBe("For the small hours.");
    expect(playlist.playlistType).toBe("editorial");
    expect(playlist.lastModifiedDate).toBe("2026-02-03T04:05:06Z");
    expect(playlist.artwork?.width).toBe(3000);
    expect(playlist.songs).toHaveLength(2);
    expect(playlist.songs[0]?.durationInMillis).toBe(204000);
  });

  it("gives an empty track list when the playlist has no tracks", async () => {
    music.mockResolvedValue(playlistResponse());

    await expect(fetchPlaylist("playlists", "pl.u-123")).resolves.toMatchObject({ songs: [] });
  });

  it("throws when the API describes no playlist", async () => {
    music.mockResolvedValue({ data: { data: [] } });

    await expect(fetchPlaylist("playlists", "pl.u-123")).rejects.toThrow(
      "Apple Music returned no playlist for pl.u-123.",
    );
  });
});

function catalogSong(id: string, cover: string) {
  return {
    id,
    type: "songs",
    attributes: { name: `Song ${id}`, artwork: { url: cover, width: 600, height: 600 } },
  };
}

describe("fetchDemoPlaylists", () => {
  it("gives a playlist with fewer than four albums the cover of its first song", async () => {
    music.mockResolvedValueOnce({
      data: { data: [catalogSong("s1", "cover-1"), catalogSong("s2", "cover-2")] },
    });

    const [playlist] = await fetchDemoPlaylists([
      { id: "demo.mix", name: "Mix", songs: ["s1", "s2"] },
    ]);

    expect(playlist).toMatchObject({
      id: "demo.mix",
      type: "library-playlists",
      name: "Mix",
      artwork: { url: "cover-1" },
    });
    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/songs", { ids: "s1,s2" });
  });
});

describe("fetchPlaylist for a demo playlist", () => {
  it("builds the playlist out of its songs in the catalog", async () => {
    music.mockResolvedValueOnce({
      data: { data: [catalogSong("s2", "cover-2"), catalogSong("s1", "cover-1")] },
    });

    const playlist = await fetchPlaylist("library-playlists", "demo.mix");

    expect(playlist.name).toBe("Mix");
    expect(playlist.curator).toEqual({ name: "Amar Kisoensingh" });
    expect(playlist.songs.map((song) => song.id)).toEqual(["s1", "s2"]);
    expect(playlist.artwork?.url).toBe("cover-1");
    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/songs", {
      include: "artists",
      ids: "s1,s2",
    });
  });
});
