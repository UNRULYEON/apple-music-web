import { fetchArtist, searchAlbums, type ArtistAlbum } from "@/lib/music-kit/artists";
import { getMusicKit } from "@/lib/music-kit/instance";
import { fetchStorefront } from "@/lib/music-kit/storefront";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/storefront", () => ({ fetchStorefront: vi.fn() }));

const music = vi.fn();

function artistResponse(attributes: Record<string, unknown>, views: unknown = {}) {
  return { data: { data: [{ id: "1440846798", type: "artists", attributes, views }] } };
}

function album(id: string, attributes: Record<string, unknown> = {}) {
  return {
    id,
    type: "albums",
    attributes: { name: `Album ${id}`, artistName: "boygenius", ...attributes },
  };
}

function song(id: string) {
  return { id, type: "songs", attributes: { name: `Song ${id}`, artistName: "boygenius" } };
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

describe("fetchArtist", () => {
  it("asks the storefront catalog for the artist", async () => {
    music.mockResolvedValue(artistResponse({ name: "boygenius" }));

    await fetchArtist("1440846798");

    expect(music).toHaveBeenCalledWith("/v1/catalog/nl/artists/1440846798", {
      views: "top-songs,full-albums,singles",
    });
  });

  it("reads the name, the artwork and the genres", async () => {
    music.mockResolvedValue(
      artistResponse({
        name: "boygenius",
        genreNames: ["Alternative", 7],
        artwork: { url: "https://example.com/{w}x{h}{c}.{f}", width: 3000, height: 3000 },
      }),
    );

    await expect(fetchArtist("1440846798")).resolves.toMatchObject({
      id: "1440846798",
      name: "boygenius",
      genres: ["Alternative"],
      artwork: { width: 3000, height: 3000 },
    });
  });

  it("gives no genres to an artist that has none", async () => {
    music.mockResolvedValue(artistResponse({ name: "boygenius" }));

    await expect(fetchArtist("1440846798")).resolves.toMatchObject({ genres: [] });
  });

  it("reads the top songs, the albums and the singles out of the views", async () => {
    music.mockResolvedValue(
      artistResponse(
        { name: "boygenius" },
        {
          "top-songs": { data: [song("1"), song("2")] },
          "full-albums": { data: [album("a1")] },
          singles: { data: [album("s1"), album("s2")] },
        },
      ),
    );

    const artist = await fetchArtist("1440846798");

    expect(artist.topSongs.map((track) => track.id)).toEqual(["1", "2"]);
    expect(artist.albums.map((one) => one.id)).toEqual(["a1"]);
    expect(artist.singles.map((one) => one.id)).toEqual(["s1", "s2"]);
  });

  it("keeps the day an album came out, which the tile shows as a year", async () => {
    music.mockResolvedValue(
      artistResponse(
        { name: "boygenius" },
        { "full-albums": { data: [album("a1", { releaseDate: "2023-03-31" })] } },
      ),
    );

    const artist = await fetchArtist("1440846798");

    expect(artist.albums[0]?.releaseDate).toBe("2023-03-31");
  });

  it("gives empty lists for an artist that comes with no views at all", async () => {
    music.mockResolvedValue(artistResponse({ name: "boygenius" }));

    const artist = await fetchArtist("1440846798");

    expect(artist.topSongs).toEqual([]);
    expect(artist.albums).toEqual([]);
    expect(artist.singles).toEqual([]);
  });

  it("complains when Apple Music sends back no artist", async () => {
    music.mockResolvedValue({ data: { data: [] } });

    await expect(fetchArtist("0")).rejects.toThrow("Apple Music returned no artist for 0.");
  });
});

describe("searchAlbums", () => {
  const ALBUMS: ArtistAlbum[] = [
    { id: "1", name: "The record", artist: { name: "boygenius" } },
    { id: "2", name: "The film", artist: { name: "boygenius" } },
    { id: "3", name: "Debut", artist: { name: "Björk" } },
  ];

  it("gives back every album while a person has typed nothing", () => {
    expect(searchAlbums(ALBUMS, "")).toHaveLength(3);
  });

  it("looks at the name of the album", () => {
    expect(searchAlbums(ALBUMS, "film").map((one) => one.id)).toEqual(["2"]);
  });

  it("looks at who made it, accent marks and all", () => {
    expect(searchAlbums(ALBUMS, "bjork").map((one) => one.id)).toEqual(["3"]);
  });

  it("gives back no album when nothing matches", () => {
    expect(searchAlbums(ALBUMS, "nirvana")).toEqual([]);
  });
});
