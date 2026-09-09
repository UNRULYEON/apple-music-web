import { getMusicKit } from "@/lib/music-kit/instance";
import { fetchSongSource, songSourceQuery } from "@/lib/music-kit/song-source";
import { fetchStorefront } from "@/lib/music-kit/storefront";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));

const music = vi.fn();

function songResponse(relationships?: unknown) {
  return { data: { data: [{ id: "1440857785", type: "songs", relationships }] } };
}

beforeEach(() => {
  vi.mocked(getMusicKit).mockResolvedValue({
    api: { music },
  } as unknown as MusicKit.MusicKitInstance);
  vi.mocked(fetchStorefront).mockResolvedValue({ id: "nl", name: "Netherlands" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchSongSource", () => {
  it("asks the storefront catalog for the album of the song", async () => {
    music.mockResolvedValue(songResponse());

    await fetchSongSource("1440857785");

    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/songs/1440857785", { include: "albums" });
  });

  it("gives back the album the song sits on", async () => {
    music.mockResolvedValue(
      songResponse({ albums: { data: [{ id: "1440857781", type: "albums" }] } }),
    );

    await expect(fetchSongSource("1440857785")).resolves.toEqual({
      type: "albums",
      id: "1440857781",
    });
  });

  it("gives back nothing when the song sits on no album", async () => {
    music.mockResolvedValue(songResponse({ albums: { data: [] } }));

    await expect(fetchSongSource("1440857785")).resolves.toBeNull();
  });

  it("gives back nothing when Apple Music sends back no song", async () => {
    music.mockResolvedValue({ data: { data: [] } });

    await expect(fetchSongSource("0")).resolves.toBeNull();
  });
});

describe("songSourceQuery", () => {
  it("asks for nothing without a song", () => {
    const query = songSourceQuery();

    expect(query.enabled).toBe(false);
    expect(query.queryFn()).toBeNull();
  });

  it("asks for the album of the song it is given", () => {
    expect(songSourceQuery("1440857785").enabled).toBe(true);
  });
});
