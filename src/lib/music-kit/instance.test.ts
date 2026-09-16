import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const APP = { name: "Apple Music Web", build: "1.0.0" };

let loadedListeners: (() => void)[];
let configure: ReturnType<typeof vi.fn>;
let music: MusicKit.MusicKitInstance;

async function loadModule() {
  vi.resetModules();
  const { getDeveloperToken } = await import("@/lib/music-kit/developer-token");
  const { getMusicKit } = await import("./instance.ts");

  return { getMusicKit, developerToken: vi.mocked(getDeveloperToken) };
}

function stubBrowser({ scriptReady }: { scriptReady: boolean }): void {
  loadedListeners = [];
  music = { isAuthorized: false } as MusicKit.MusicKitInstance;
  configure = vi.fn(async () => music);

  vi.stubGlobal("window", { MusicKit: scriptReady ? { configure } : {} });
  vi.stubGlobal("document", {
    addEventListener: vi.fn((_event: string, handler: () => void) => {
      loadedListeners.push(handler);
    }),
  });
  vi.stubGlobal("MusicKit", { configure, getInstance: () => music });
}

beforeEach(() => {
  stubBrowser({ scriptReady: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("getMusicKit", () => {
  it("configures MusicKit with the token from the server", async () => {
    const { getMusicKit } = await loadModule();

    await expect(getMusicKit()).resolves.toBe(music);
    expect(configure).toHaveBeenCalledWith({
      developerToken: "test-developer-token",
      app: APP,
      suppressErrorDialog: true,
    });
  });

  it("waits for the musickitloaded event while the script has no configure", async () => {
    stubBrowser({ scriptReady: false });
    const { getMusicKit } = await loadModule();

    const pending = getMusicKit();
    await Promise.resolve();

    expect(configure).not.toHaveBeenCalled();
    expect(loadedListeners).toHaveLength(1);

    loadedListeners[0]?.();

    await expect(pending).resolves.toBe(music);
    expect(configure).toHaveBeenCalledOnce();
  });

  it("configures once for callers that arrive together", async () => {
    const { getMusicKit } = await loadModule();

    const [first, second] = await Promise.all([getMusicKit(), getMusicKit()]);

    expect(first).toBe(second);
    expect(configure).toHaveBeenCalledOnce();
  });

  it("configures once across later calls", async () => {
    const { getMusicKit } = await loadModule();

    await getMusicKit();
    await getMusicKit();

    expect(configure).toHaveBeenCalledOnce();
  });

  it("retries after a failure instead of replaying the error", async () => {
    const { getMusicKit, developerToken } = await loadModule();
    developerToken.mockRejectedValueOnce(new Error("MUSICKIT_DEVELOPER_TOKEN is not set."));

    await expect(getMusicKit()).rejects.toThrow("MUSICKIT_DEVELOPER_TOKEN is not set.");
    await expect(getMusicKit()).resolves.toBe(music);
    expect(configure).toHaveBeenCalledOnce();
  });

  it("passes a rejected configure call on to the caller", async () => {
    const { getMusicKit } = await loadModule();
    configure.mockRejectedValue(new Error("Unauthorized"));

    await expect(getMusicKit()).rejects.toThrow("Unauthorized");
  });
});
