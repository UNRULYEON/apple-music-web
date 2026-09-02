import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMusicKit } from "@/lib/music-kit/instance";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const loadMusicKit = vi.mocked(getMusicKit);

async function loadModule() {
  vi.resetModules();
  return await import("./auth.ts");
}

function mockMusic(isAuthorized = false): MusicKit.MusicKitInstance {
  const music = {
    isAuthorized,
    authorize: vi.fn(async () => {
      music.isAuthorized = true;
      return "music-user-token";
    }),
    unauthorize: vi.fn(async () => {
      music.isAuthorized = false;
    }),
  };

  return music as unknown as MusicKit.MusicKitInstance;
}

beforeEach(() => {
  loadMusicKit.mockResolvedValue(mockMusic());
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("loadAuthorization", () => {
  it("starts as checking, before MusicKit answers", async () => {
    const { readAuthStatus } = await loadModule();

    expect(readAuthStatus()).toBe("checking");
  });

  it("reports a signed in user", async () => {
    const { loadAuthorization, readAuthStatus } = await loadModule();
    loadMusicKit.mockResolvedValue(mockMusic(true));

    await loadAuthorization();

    expect(readAuthStatus()).toBe("signed-in");
  });

  it("reports a user who has not signed in", async () => {
    const { loadAuthorization, readAuthStatus } = await loadModule();

    await loadAuthorization();

    expect(readAuthStatus()).toBe("signed-out");
  });

  it("reports signed out when MusicKit cannot start", async () => {
    const { loadAuthorization, readAuthStatus } = await loadModule();
    loadMusicKit.mockRejectedValue(new Error("MUSICKIT_DEVELOPER_TOKEN is not set."));

    await loadAuthorization();

    expect(readAuthStatus()).toBe("signed-out");
  });
});

describe("signIn", () => {
  it("opens the Apple flow and moves the store", async () => {
    const { signIn, readAuthStatus } = await loadModule();
    const music = mockMusic();
    loadMusicKit.mockResolvedValue(music);

    await signIn();

    expect(music.authorize).toHaveBeenCalledOnce();
    expect(readAuthStatus()).toBe("signed-in");
  });

  it("lets the error through so the dialog can show it", async () => {
    const { signIn } = await loadModule();
    const music = mockMusic();
    vi.mocked(music.authorize).mockRejectedValue(new Error("The user closed the window."));
    loadMusicKit.mockResolvedValue(music);

    await expect(signIn()).rejects.toThrow("The user closed the window.");
  });
});

describe("signOut", () => {
  it("ends the Apple session and moves the store", async () => {
    const { loadAuthorization, signOut, readAuthStatus } = await loadModule();
    const music = mockMusic(true);
    loadMusicKit.mockResolvedValue(music);
    await loadAuthorization();

    await signOut();

    expect(music.unauthorize).toHaveBeenCalledOnce();
    expect(readAuthStatus()).toBe("signed-out");
  });

  it("lets the error through so the button can show it", async () => {
    const { signOut } = await loadModule();
    const music = mockMusic(true);
    vi.mocked(music.unauthorize).mockRejectedValue(new Error("The network is down."));
    loadMusicKit.mockResolvedValue(music);

    await expect(signOut()).rejects.toThrow("The network is down.");
  });
});

describe("setAuthStatus", () => {
  it("tells every listener about a change", async () => {
    const { setAuthStatus, subscribeToAuthStatus } = await loadModule();
    const listener = vi.fn();
    subscribeToAuthStatus(listener);

    setAuthStatus("signed-in");

    expect(listener).toHaveBeenCalledOnce();
  });

  it("stays quiet when the status is the one it holds", async () => {
    const { setAuthStatus, subscribeToAuthStatus } = await loadModule();
    setAuthStatus("signed-in");
    const listener = vi.fn();
    subscribeToAuthStatus(listener);

    setAuthStatus("signed-in");

    expect(listener).not.toHaveBeenCalled();
  });

  it("tells a listener no more after it stops", async () => {
    const { setAuthStatus, subscribeToAuthStatus } = await loadModule();
    const listener = vi.fn();

    subscribeToAuthStatus(listener)();
    setAuthStatus("signed-in");

    expect(listener).not.toHaveBeenCalled();
  });
});
