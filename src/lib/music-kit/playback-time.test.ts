import {
  fakeMusicKit,
  stubMusicKitGlobals,
  type FakeMusicKit,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  dropPlaybackTime,
  holdPlaybackTime,
  readHeldPlaybackTime,
  readPlaybackTime,
  resetPlaybackTime,
  subscribeToPlaybackTime,
} from "@/lib/music-kit/playback-time";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

let music: FakeMusicKit;

beforeEach(async () => {
  resetPlaybackTime();
  stubMusicKitGlobals();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);

  subscribeToPlaybackTime(() => {});
  await vi.waitFor(() => expect(music.addEventListener).toHaveBeenCalled());
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("subscribeToPlaybackTime", () => {
  it("starts at nothing", () => {
    expect(readPlaybackTime()).toEqual({ position: 0, duration: 0 });
  });

  it("follows the place MusicKit has come to", () => {
    music.currentPlaybackTime = 42;
    music.currentPlaybackDuration = 210;
    music.emit("playbackTimeDidChange", {
      currentPlaybackTime: 42,
      currentPlaybackDuration: 210,
      currentPlaybackTimeRemaining: 168,
    });

    expect(readPlaybackTime()).toEqual({ position: 42, duration: 210 });
  });

  it("tells the listeners only when the time moved", () => {
    const listener = vi.fn();
    subscribeToPlaybackTime(listener);

    music.currentPlaybackTime = 5;
    music.emit("playbackTimeDidChange", {
      currentPlaybackTime: 5,
      currentPlaybackDuration: 0,
      currentPlaybackTimeRemaining: 0,
    });
    music.emit("playbackTimeDidChange", {
      currentPlaybackTime: 5,
      currentPlaybackDuration: 0,
      currentPlaybackTimeRemaining: 0,
    });

    expect(listener).toHaveBeenCalledOnce();
  });

  it("goes back to the start of a new song", () => {
    music.currentPlaybackTime = 42;
    music.emit("playbackTimeDidChange", {
      currentPlaybackTime: 42,
      currentPlaybackDuration: 210,
      currentPlaybackTimeRemaining: 168,
    });

    music.currentPlaybackTime = 0;
    music.emit("nowPlayingItemDidChange", {});

    expect(readPlaybackTime().position).toBe(0);
  });

  it("keeps a time that MusicKit does not give yet at nothing", () => {
    music.currentPlaybackTime = Number.NaN;
    music.currentPlaybackDuration = Number.NaN;
    music.emit("nowPlayingItemDidChange", {});

    expect(readPlaybackTime()).toEqual({ position: 0, duration: 0 });
  });

  it("stops telling a listener that has gone", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToPlaybackTime(listener);

    unsubscribe();
    music.currentPlaybackTime = 9;
    music.emit("playbackTimeDidChange", {
      currentPlaybackTime: 9,
      currentPlaybackDuration: 0,
      currentPlaybackTimeRemaining: 0,
    });

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("the held place", () => {
  it("shows the held place in place of the time of the song", () => {
    music.currentPlaybackTime = 3;
    music.emit("playbackTimeDidChange", { currentPlaybackTime: 3 });

    holdPlaybackTime(42);

    expect(readPlaybackTime().position).toBe(42);
    expect(readHeldPlaybackTime()).toBe(42);
  });

  it("keeps the length of the song while it holds the place", () => {
    music.currentPlaybackDuration = 180;
    music.emit("playbackDurationDidChange", { currentPlaybackDuration: 180 });

    holdPlaybackTime(42);

    expect(readPlaybackTime().duration).toBe(180);
  });

  it("holds the place while the song is still at its start", () => {
    holdPlaybackTime(42);

    for (const at of [0, 0.3, 1.1]) {
      music.currentPlaybackTime = at;
      music.emit("playbackTimeDidChange", { currentPlaybackTime: at });
    }

    expect(readPlaybackTime().position).toBe(42);
    expect(readHeldPlaybackTime()).toBe(42);
  });

  it("takes the bar back by itself once the song arrives at the place", () => {
    holdPlaybackTime(42);

    music.currentPlaybackTime = 42.2;
    music.emit("playbackTimeDidChange", { currentPlaybackTime: 42.2 });

    expect(readHeldPlaybackTime()).toBeUndefined();
    expect(readPlaybackTime().position).toBe(42.2);
  });

  it("lets the song have the bar back", () => {
    holdPlaybackTime(42);
    music.currentPlaybackTime = 3;
    music.emit("playbackTimeDidChange", { currentPlaybackTime: 3 });

    expect(readPlaybackTime().position).toBe(42);

    dropPlaybackTime();

    expect(readPlaybackTime().position).toBe(3);
    expect(readHeldPlaybackTime()).toBeUndefined();
  });

  it("tells the listeners when it takes the bar and when it gives it back", () => {
    const listener = vi.fn();
    subscribeToPlaybackTime(listener);

    holdPlaybackTime(42);
    expect(listener).toHaveBeenCalledTimes(1);

    dropPlaybackTime();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("gives back the same time until it changes, so a reader sees no false change", () => {
    holdPlaybackTime(42);

    expect(readPlaybackTime()).toBe(readPlaybackTime());

    music.currentPlaybackTime = 3;
    music.emit("playbackTimeDidChange", { currentPlaybackTime: 3 });

    expect(readPlaybackTime()).toBe(readPlaybackTime());
  });
});
