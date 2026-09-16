// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/lib/music-kit/track";
import {
  showNowPlaying,
  showPlaybackState,
  showPosition,
  subscribeToMediaKeys,
} from "@/lib/player/media-session";

const SONG: Song = {
  id: "111",
  name: "Not Strong Enough",
  artist: { name: "boygenius" },
  artwork: { url: "https://example.test/{w}x{h}.jpg", width: 1200, height: 1200 },
};

const setActionHandler = vi.fn();
const setPositionState = vi.fn();
let media: {
  metadata: unknown;
  playbackState: string;
  setActionHandler: typeof setActionHandler;
  setPositionState?: typeof setPositionState;
};

function fakeMetadata(init: Record<string, unknown>) {
  return { ...init };
}

function fakeKeys() {
  return { play: vi.fn(), pause: vi.fn(), next: vi.fn(), previous: vi.fn(), seek: vi.fn() };
}

function stubMediaSession() {
  media = { metadata: null, playbackState: "none", setActionHandler, setPositionState };

  vi.stubGlobal("navigator", { mediaSession: media });
  vi.stubGlobal("MediaMetadata", fakeMetadata);
}

beforeEach(stubMediaSession);

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("showNowPlaying", () => {
  it("names the song and who made it", () => {
    showNowPlaying(SONG);

    expect(media.metadata).toMatchObject({
      title: "Not Strong Enough",
      artist: "boygenius",
    });
  });

  it("gives the artwork in three sizes", () => {
    showNowPlaying(SONG);

    expect((media.metadata as { artwork: unknown[] }).artwork).toEqual([
      { src: "https://example.test/96x96.jpg", sizes: "96x96", type: "image/jpeg" },
      { src: "https://example.test/192x192.jpg", sizes: "192x192", type: "image/jpeg" },
      { src: "https://example.test/512x512.jpg", sizes: "512x512", type: "image/jpeg" },
    ]);
  });

  it("empties the panel when the player holds nothing", () => {
    showNowPlaying(SONG);
    showNowPlaying(undefined);

    expect(media.metadata).toBeNull();
  });

  it("says nothing when the browser has no media session", () => {
    vi.stubGlobal("navigator", {});

    expect(() => showNowPlaying(SONG)).not.toThrow();
  });
});

describe("showPlaybackState", () => {
  it("follows the player", () => {
    showPlaybackState(true, true);
    expect(media.playbackState).toBe("playing");

    showPlaybackState(false, true);
    expect(media.playbackState).toBe("paused");
  });

  it("holds nothing when no song is in the player", () => {
    showPlaybackState(false, false);

    expect(media.playbackState).toBe("none");
  });
});

describe("showPosition", () => {
  it("gives the panel the place in the song", () => {
    showPosition(42.5, 210);

    expect(setPositionState).toHaveBeenCalledWith({
      position: 42.5,
      duration: 210,
      playbackRate: 1,
    });
  });

  it("keeps the place inside the song", () => {
    showPosition(900, 210);

    expect(setPositionState).toHaveBeenCalledWith(expect.objectContaining({ position: 210 }));
  });

  it("empties the bar when the song has no length yet", () => {
    showPosition(0, 0);

    expect(setPositionState).toHaveBeenCalledWith();
  });

  it("says nothing when the browser knows no position", () => {
    media.setPositionState = undefined;

    expect(() => showPosition(10, 100)).not.toThrow();
  });
});

describe("subscribeToMediaKeys", () => {
  it("takes a drag of the bar to the player", () => {
    const keys = fakeKeys();

    subscribeToMediaKeys(keys);

    const seekto = setActionHandler.mock.calls.find(([action]) => action === "seekto")?.[1];

    seekto({ seekTime: 61 });

    expect(keys.seek).toHaveBeenCalledWith(61);
  });

  it("takes every key the panel offers", () => {
    const keys = fakeKeys();

    subscribeToMediaKeys(keys);

    expect(setActionHandler.mock.calls.map(([action]) => action)).toEqual([
      "play",
      "pause",
      "nexttrack",
      "previoustrack",
      "seekto",
    ]);
    expect(setActionHandler).toHaveBeenCalledWith("nexttrack", keys.next);
  });

  it("gives every key back", () => {
    const stop = subscribeToMediaKeys(fakeKeys());

    setActionHandler.mockClear();
    stop();

    expect(setActionHandler.mock.calls.every(([, handler]) => handler === null)).toBe(true);
    expect(setActionHandler).toHaveBeenCalledTimes(5);
  });

  it("keeps going when the browser turns one key down", () => {
    setActionHandler.mockImplementation((action: string) => {
      if (action === "play") {
        throw new TypeError("Unsupported action.");
      }
    });

    expect(() => subscribeToMediaKeys(fakeKeys())).not.toThrow();
    expect(setActionHandler).toHaveBeenCalledTimes(5);
  });
});
