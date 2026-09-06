import {
  fakeMusicKit,
  stubMusicKitGlobals,
  type FakeMusicKit,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
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
