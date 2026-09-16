import { afterEach, describe, expect, it, vi } from "vitest";
import { getMusicKit } from "@/lib/music-kit/instance";
import { applyVolume, fetchVolume, FULL_VOLUME } from "@/lib/music-kit/volume";
import { stubMusicKit } from "@/test/fake-music-kit";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

function mockMusic(volume = FULL_VOLUME) {
  const music = { volume };

  stubMusicKit(music);

  return music;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchVolume", () => {
  it("gives back what this tab plays at", async () => {
    mockMusic(0.4);

    await expect(fetchVolume()).resolves.toBe(0.4);
  });

  it("gives back the loudest when MusicKit cannot start", async () => {
    vi.mocked(getMusicKit).mockRejectedValue(new Error("MusicKit is not there."));

    await expect(fetchVolume()).resolves.toBe(FULL_VOLUME);
  });
});

describe("applyVolume", () => {
  it("puts the volume on the player of this tab", async () => {
    const music = mockMusic();

    await applyVolume(0.25);

    expect(music.volume).toBe(0.25);
  });
});
