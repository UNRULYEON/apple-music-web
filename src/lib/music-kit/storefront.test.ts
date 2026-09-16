import { afterEach, describe, expect, it, vi } from "vitest";
import { getMusicKit } from "@/lib/music-kit/instance";
import { fetchStorefront } from "@/lib/music-kit/storefront";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const STOREFRONT = { data: { data: [{ id: "nl", attributes: { name: "Netherlands" } }] } };

function useMusicKit(token: string): {
  api: { music: ReturnType<typeof vi.fn> };
  musicUserToken: string;
} {
  const music = { api: { music: vi.fn().mockResolvedValue(STOREFRONT) }, musicUserToken: token };
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);

  return music;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchStorefront", () => {
  it("reads the storefront of the person", async () => {
    useMusicKit("token");

    await expect(fetchStorefront()).resolves.toEqual({ id: "nl", name: "Netherlands" });
  });

  it("asks Apple Music once for the same person", async () => {
    const music = useMusicKit("token");

    await fetchStorefront();
    await fetchStorefront();

    expect(music.api.music).toHaveBeenCalledOnce();
  });

  it("asks again when another person signs in", async () => {
    const music = useMusicKit("first");

    await fetchStorefront();
    music.musicUserToken = "second";
    await fetchStorefront();

    expect(music.api.music).toHaveBeenCalledTimes(2);
  });

  it("asks again after a failed request", async () => {
    const music = useMusicKit("token");
    music.api.music.mockRejectedValueOnce(new Error("offline"));

    await expect(fetchStorefront()).rejects.toThrow("offline");
    await expect(fetchStorefront()).resolves.toEqual({ id: "nl", name: "Netherlands" });
  });

  it("fails when Apple Music gives no storefront", async () => {
    const music = useMusicKit("token");
    music.api.music.mockResolvedValue({ data: { data: [] } });

    await expect(fetchStorefront()).rejects.toThrow("Apple Music returned no storefront.");
  });
});
