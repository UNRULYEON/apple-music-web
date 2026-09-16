import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fakeMusicKit,
  type FakeMusicKit,
  PLAYBACK_STATES,
  REPEAT_MODES,
  SHUFFLE_MODES,
  songItem,
  stubMusicKitGlobals,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  nextRepeatMode,
  readPlayerState,
  resetPlayerState,
  subscribeToPlayer,
  toMusicKitRepeat,
} from "@/lib/music-kit/player-state";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

let music: FakeMusicKit;

beforeEach(async () => {
  resetPlayerState();
  stubMusicKitGlobals();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);

  music.queue.items = [songItem("1", "First"), songItem("2", "Second"), songItem("3", "Third")];
  subscribeToPlayer(() => {});
  await vi.waitFor(() => expect(music.addEventListener).toHaveBeenCalled());
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("subscribeToPlayer", () => {
  it("listens again after MusicKit failed to load", async () => {
    resetPlayerState();
    vi.mocked(getMusicKit).mockRejectedValueOnce(new Error("no MusicKit"));
    music.addEventListener.mockClear();

    subscribeToPlayer(() => {});
    await new Promise((resolve) => setTimeout(resolve));

    subscribeToPlayer(() => {});
    await vi.waitFor(() => expect(music.addEventListener).toHaveBeenCalled());
  });

  it("reads the queue that MusicKit holds", () => {
    const state = readPlayerState();

    expect(state.queue.map((song) => song.name)).toEqual(["First", "Second", "Third"]);
  });

  it("follows the song that MusicKit plays", () => {
    music.nowPlayingItemIndex = 1;
    music.emit("queuePositionDidChange", { position: 1 });

    const state = readPlayerState();

    expect(state.nowPlaying?.name).toBe("Second");
    expect(state.index).toBe(1);
    expect(state.upNext.map((song) => song.name)).toEqual(["Third"]);
  });

  it("tells the app when MusicKit plays", () => {
    music.playbackState = PLAYBACK_STATES.playing;
    music.emit("playbackStateDidChange", { oldState: 0, state: PLAYBACK_STATES.playing });

    expect(readPlayerState().isPlaying).toBe(true);
    expect(readPlayerState().isLoading).toBe(false);
  });

  it.each([
    ["loading", PLAYBACK_STATES.loading],
    ["waiting", PLAYBACK_STATES.waiting],
    ["stalled", PLAYBACK_STATES.stalled],
  ])("tells the app that the song is still coming while %s", (_name, state) => {
    music.playbackState = state;
    music.emit("playbackStateDidChange", { oldState: 0, state });

    expect(readPlayerState().isLoading).toBe(true);
    expect(readPlayerState().isPlaying).toBe(false);
  });

  it("follows the shuffle mode of MusicKit", () => {
    music.shuffleMode = SHUFFLE_MODES.songs;
    music.emit("shuffleModeDidChange", SHUFFLE_MODES.songs);

    expect(readPlayerState().isShuffled).toBe(true);
  });

  it("follows the repeat mode of MusicKit", () => {
    music.repeatMode = REPEAT_MODES.one;
    music.emit("repeatModeDidChange", REPEAT_MODES.one);

    expect(readPlayerState().repeat).toBe("song");

    music.repeatMode = REPEAT_MODES.all;
    music.emit("repeatModeDidChange", REPEAT_MODES.all);

    expect(readPlayerState().repeat).toBe("queue");
  });

  it("tells a listener when something changes", () => {
    const listener = vi.fn();
    subscribeToPlayer(listener);

    music.emit("playbackStateDidChange", { oldState: 0, state: PLAYBACK_STATES.playing });

    expect(listener).toHaveBeenCalled();
  });

  it("takes a new queue from MusicKit", () => {
    music.queue.items = [songItem("9", "Only")];
    music.emit("queueItemsDidChange", music.queue.items);

    expect(readPlayerState().queue.map((song) => song.name)).toEqual(["Only"]);
  });
});

describe("what MusicKit allows", () => {
  it("takes the skip capabilities from MusicKit", () => {
    music.capabilities.canSkipToNextItem = false;
    music.capabilities.canSkipToPreviousItem = true;
    music.emit("capabilitiesChanged");

    const state = readPlayerState();

    expect(state.canSkipNext).toBe(false);
    expect(state.canSkipPrevious).toBe(true);
  });
});

describe("nextRepeatMode", () => {
  it("cycles off, queue, song, off", () => {
    expect(nextRepeatMode("off")).toBe("queue");
    expect(nextRepeatMode("queue")).toBe("song");
    expect(nextRepeatMode("song")).toBe("off");
  });
});

describe("toMusicKitRepeat", () => {
  it("speaks the numbers MusicKit uses", () => {
    expect(toMusicKitRepeat("off")).toBe(REPEAT_MODES.none);
    expect(toMusicKitRepeat("queue")).toBe(REPEAT_MODES.all);
    expect(toMusicKitRepeat("song")).toBe(REPEAT_MODES.one);
  });
});
