import { hasDrm } from "@/lib/music-kit/drm";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubKeySystems(available: string[]): ReturnType<typeof vi.fn> {
  const request = vi.fn(async (keySystem: string) => {
    if (!available.includes(keySystem)) {
      throw new Error("NotSupportedError");
    }

    return {} as MediaKeySystemAccess;
  });

  vi.stubGlobal("navigator", { requestMediaKeySystemAccess: request });

  return request;
}

describe("hasDrm", () => {
  it("finds FairPlay in Safari", async () => {
    stubKeySystems(["com.apple.fps"]);

    expect(await hasDrm()).toBe(true);
  });

  it("finds Widevine in Chrome", async () => {
    stubKeySystems(["com.widevine.alpha"]);

    expect(await hasDrm()).toBe(true);
  });

  it("stops at the first key system that works", async () => {
    const request = stubKeySystems(["com.apple.fps", "com.widevine.alpha"]);

    await hasDrm();

    expect(request).toHaveBeenCalledOnce();
  });

  it("reports a browser that gives no DRM", async () => {
    const request = stubKeySystems([]);

    expect(await hasDrm()).toBe(false);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("reports a browser that does not know the media keys at all", async () => {
    vi.stubGlobal("navigator", {});

    expect(await hasDrm()).toBe(false);
  });
});
