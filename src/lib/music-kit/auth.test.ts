import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMusicKit } from "@/lib/music-kit/instance";
import { createMusicKitAuth } from "./auth.ts";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const loadMusicKit = vi.mocked(getMusicKit);

function mockMusicKit(
  { isAuthorized }: { isAuthorized: boolean } = { isAuthorized: false },
): MusicKit.MusicKitInstance {
  const music = {
    isAuthorized,
    musicUserToken: isAuthorized ? "music-user-token" : "",
    authorize: vi.fn(async () => {
      music.isAuthorized = true;
      return "music-user-token";
    }),
    unauthorize: vi.fn(async () => {
      music.isAuthorized = false;
    }),
    api: { music: vi.fn() },
  };

  return music as unknown as MusicKit.MusicKitInstance;
}

beforeEach(() => {
  vi.stubGlobal("document", {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("createMusicKitAuth", () => {
  describe("ensureLoaded", () => {
    it("does not touch MusicKit on the server", async () => {
      vi.stubGlobal("document", undefined);
      const auth = createMusicKitAuth();

      expect(loadMusicKit).not.toHaveBeenCalled();
      expect(auth.isAuthorized).toBe(false);
    });

    it("reads the state of a signed in user", async () => {
      loadMusicKit.mockResolvedValue(mockMusicKit({ isAuthorized: true }));
      const auth = createMusicKitAuth();
      await auth.ensureLoaded();

      expect(auth.isAuthorized).toBe(true);
    });

    it("stays unauthorized when MusicKit cannot start", async () => {
      loadMusicKit.mockRejectedValue(new Error("MUSICKIT_DEVELOPER_TOKEN is not set."));
      const auth = createMusicKitAuth();

      await expect(auth.ensureLoaded()).resolves.toBeUndefined();
      expect(auth.isAuthorized).toBe(false);
    });

    it("drops the state when the user is no longer signed in", async () => {
      const musicKit = mockMusicKit({ isAuthorized: true });
      loadMusicKit.mockResolvedValue(musicKit);
      const auth = createMusicKitAuth();
      await auth.ensureLoaded();

      musicKit.isAuthorized = false;
      await auth.ensureLoaded();

      expect(auth.isAuthorized).toBe(false);
    });
  });

  describe("signIn", () => {
    it("opens the Apple flow and keeps the new state", async () => {
      const musicKit = mockMusicKit();
      loadMusicKit.mockResolvedValue(musicKit);
      const auth = createMusicKitAuth();

      await auth.signIn();

      expect(musicKit.authorize).toHaveBeenCalledOnce();
      expect(auth.isAuthorized).toBe(true);
    });

    it("lets the error through so the login page can show it", async () => {
      const musicKit = mockMusicKit();
      vi.mocked(musicKit.authorize).mockRejectedValue(new Error("The user closed the window."));
      loadMusicKit.mockResolvedValue(musicKit);
      const auth = createMusicKitAuth();

      await expect(auth.signIn()).rejects.toThrow("The user closed the window.");
      expect(auth.isAuthorized).toBe(false);
    });
  });

  describe("signOut", () => {
    it("invalidates the music user token and clears the state", async () => {
      const musicKit = mockMusicKit({ isAuthorized: true });
      loadMusicKit.mockResolvedValue(musicKit);
      const auth = createMusicKitAuth();
      await auth.ensureLoaded();

      await auth.signOut();

      expect(musicKit.unauthorize).toHaveBeenCalledOnce();
      expect(auth.isAuthorized).toBe(false);
    });
  });
});
