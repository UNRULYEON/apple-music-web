import { getMusicKit } from "@/lib/music-kit/instance";
import { FULL_VOLUME, readVolume, setVolume } from "@/lib/music-kit/volume";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const loadMusicKit = vi.mocked(getMusicKit);

function mockMusic(volume = FULL_VOLUME) {
  const music = { volume };

  loadMusicKit.mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);

  return music;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("readVolume", () => {
  it("gives back what this tab plays at", async () => {
    mockMusic(0.4);

    await expect(readVolume()).resolves.toBe(0.4);
  });

  it("gives back the loudest when MusicKit cannot start", async () => {
    loadMusicKit.mockRejectedValue(new Error("MusicKit is not there."));

    await expect(readVolume()).resolves.toBe(FULL_VOLUME);
  });
});

describe("setVolume", () => {
  it("puts the volume on the player of this tab", async () => {
    const music = mockMusic();

    await setVolume(0.25);

    expect(music.volume).toBe(0.25);
  });
});
