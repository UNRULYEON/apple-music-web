// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readAuthStatus, setAuthStatus } from "@/lib/music-kit/auth";
import {
  dropToken,
  forgetSession,
  keepSession,
  readSavedAt,
  restoreToken,
} from "@/lib/music-kit/dev-session";
import { getMusicKit } from "@/lib/music-kit/instance";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const loadMusicKit = vi.mocked(getMusicKit);
const SAVED_KEY = "music-kit-devtools.saved-token";

// Setting musicUserToken writes the token to memory and to storage in one step,
// and it moves isAuthorized with it.
function mockMusic(token = "") {
  let current = token;

  const music = {
    isAuthorized: Boolean(token),
    get musicUserToken(): string {
      return current;
    },
    set musicUserToken(next: string) {
      current = next;
      music.isAuthorized = Boolean(next);
    },
  };

  loadMusicKit.mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);

  return music;
}

beforeEach(() => {
  setAuthStatus("checking");
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("keepSession", () => {
  it("keeps the live token and dates the copy", async () => {
    mockMusic("a-music-user-token");

    await expect(keepSession()).resolves.toBe(true);
    expect(readSavedAt()).toEqual(expect.any(String));
  });

  it("keeps nothing when nobody is signed in", async () => {
    mockMusic();

    await expect(keepSession()).resolves.toBe(false);
    expect(localStorage.getItem(SAVED_KEY)).toBeNull();
  });

  it("keeps nothing when MusicKit cannot start", async () => {
    loadMusicKit.mockRejectedValue(new Error("MUSICKIT_DEVELOPER_TOKEN is not set."));

    await expect(keepSession()).resolves.toBe(false);
  });

  it("skips a token it already holds", async () => {
    mockMusic("a-music-user-token");
    await keepSession();

    await expect(keepSession()).resolves.toBe(false);
  });

  it("replaces the copy after a sign in with another token", async () => {
    mockMusic("first-token");
    await keepSession();
    const music = mockMusic("second-token");
    await keepSession();

    music.musicUserToken = "";
    await restoreToken();

    expect(music.musicUserToken).toBe("second-token");
  });

  it("ignores a copy that is not readable", async () => {
    localStorage.setItem(SAVED_KEY, "not json");

    expect(readSavedAt()).toBeUndefined();
  });
});

describe("dropToken", () => {
  it("takes the token out of MusicKit and moves the store", async () => {
    const music = mockMusic("a-music-user-token");

    await dropToken();

    expect(music.musicUserToken).toBe("");
    expect(music.isAuthorized).toBe(false);
    expect(readAuthStatus()).toBe("signed-out");
  });

  it("keeps the copy, so a restore still works", async () => {
    mockMusic("a-music-user-token");
    await keepSession();

    await dropToken();

    expect(readSavedAt()).toEqual(expect.any(String));
  });
});

describe("restoreToken", () => {
  it("puts the kept token back without an Apple window", async () => {
    const music = mockMusic("a-music-user-token");
    await keepSession();
    await dropToken();

    await expect(restoreToken()).resolves.toBe(true);
    expect(music.musicUserToken).toBe("a-music-user-token");
    expect(readAuthStatus()).toBe("signed-in");
  });

  it("restores nothing when there is no copy", async () => {
    mockMusic();

    await expect(restoreToken()).resolves.toBe(false);
    expect(readAuthStatus()).toBe("checking");
  });
});

describe("forgetSession", () => {
  it("drops the copy", async () => {
    mockMusic("a-music-user-token");
    await keepSession();

    forgetSession();

    expect(readSavedAt()).toBeUndefined();
  });
});
