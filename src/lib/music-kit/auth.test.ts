import { afterEach, describe, expect, it, vi } from "vitest";
import { loadAuthorization, signIn } from "@/lib/music-kit/auth";
import { getMusicKit } from "@/lib/music-kit/instance";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const loadMusicKit = vi.mocked(getMusicKit);

function mockMusic(isAuthorized = false): MusicKit.MusicKitInstance {
  const music = {
    isAuthorized,
    authorize: vi.fn(async () => {
      music.isAuthorized = true;
      return "music-user-token";
    }),
  };

  return music as unknown as MusicKit.MusicKitInstance;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("loadAuthorization", () => {
  it("reports a signed in user", async () => {
    loadMusicKit.mockResolvedValue(mockMusic(true));

    await expect(loadAuthorization()).resolves.toBe(true);
  });

  it("reports a user who has not signed in", async () => {
    loadMusicKit.mockResolvedValue(mockMusic(false));

    await expect(loadAuthorization()).resolves.toBe(false);
  });

  it("reports false when MusicKit cannot start", async () => {
    loadMusicKit.mockRejectedValue(new Error("MUSICKIT_DEVELOPER_TOKEN is not set."));

    await expect(loadAuthorization()).resolves.toBe(false);
  });
});

describe("signIn", () => {
  it("opens the Apple flow and reports the new state", async () => {
    const music = mockMusic();
    loadMusicKit.mockResolvedValue(music);

    await expect(signIn()).resolves.toBe(true);
    expect(music.authorize).toHaveBeenCalledOnce();
  });

  it("lets the error through so the dialog can show it", async () => {
    const music = mockMusic();
    vi.mocked(music.authorize).mockRejectedValue(new Error("The user closed the window."));
    loadMusicKit.mockResolvedValue(music);

    await expect(signIn()).rejects.toThrow("The user closed the window.");
  });
});
