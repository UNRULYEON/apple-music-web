import { vi } from "vitest";

export const PLAYBACK_STATES = {
  none: 0,
  loading: 1,
  playing: 2,
  paused: 3,
  stopped: 4,
  ended: 5,
  seeking: 6,
  waiting: 8,
  stalled: 9,
  completed: 10,
};

export const REPEAT_MODES = { none: 0, one: 1, all: 2 };
export const SHUFFLE_MODES = { off: 0, songs: 1 };

export type FakeMusicKit = ReturnType<typeof fakeMusicKit>;

export function fakeMusicKit() {
  const listeners: Record<string, ((event: never) => void)[]> = {};

  return {
    queue: { items: [] as MusicKit.MediaItem[], length: 0, isEmpty: true, position: 0 },
    queueIsEmpty: false,
    capabilities: {
      canPause: true,
      canSeek: true,
      canSetRepeatMode: true,
      canSetShuffleMode: true,
      canSkipToNextItem: true,
      canSkipToPreviousItem: true,
    },
    playbackState: PLAYBACK_STATES.none,
    isPlaying: false,
    currentPlaybackTime: 0,
    currentPlaybackDuration: 0,
    nowPlayingItemIndex: 0,
    shuffleMode: SHUFFLE_MODES.off,
    repeatMode: REPEAT_MODES.none,
    setQueue: vi.fn().mockResolvedValue(undefined),
    playNext: vi.fn().mockResolvedValue(undefined),
    playLater: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    stop: vi.fn(),
    seekToTime: vi.fn().mockResolvedValue(undefined),
    skipToNextItem: vi.fn().mockResolvedValue(undefined),
    skipToPreviousItem: vi.fn().mockResolvedValue(undefined),
    changeToMediaAtIndex: vi.fn().mockResolvedValue(undefined),
    api: { music: vi.fn().mockResolvedValue({ data: { data: [] } }) },
    addEventListener: vi.fn((name: string, listener: (event: never) => void) => {
      listeners[name] = [...(listeners[name] ?? []), listener];
    }),
    removeEventListener: vi.fn((name: string, listener: (event: never) => void) => {
      listeners[name] = (listeners[name] ?? []).filter((each) => each !== listener);
    }),
    emit(name: string, event?: unknown) {
      for (const listener of listeners[name] ?? []) {
        (listener as (value: unknown) => void)(event);
      }
    },
  };
}

export function stubMusicKitGlobals(): void {
  vi.stubGlobal("MusicKit", {
    PlaybackStates: PLAYBACK_STATES,
    PlayerRepeatMode: REPEAT_MODES,
    PlayerShuffleMode: SHUFFLE_MODES,
  });
}

export function songItem(id: string, name: string): MusicKit.MediaItem {
  return { id, attributes: { name, artistName: "The Band" } };
}
