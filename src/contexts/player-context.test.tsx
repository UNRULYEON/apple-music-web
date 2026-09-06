// @vitest-environment happy-dom
import { PlayerProvider } from "@/contexts";
import { usePlayer } from "@/hooks";
import {
  fakeMusicKit,
  PLAYBACK_STATES,
  REPEAT_MODES,
  SHUFFLE_MODES,
  songItem,
  stubMusicKitGlobals,
  type FakeMusicKit,
} from "@/lib/music-kit/fake-music-kit";
import { hasDrm } from "@/lib/music-kit/drm";
import { getMusicKit } from "@/lib/music-kit/instance";
import { resetPlaybackTime } from "@/lib/music-kit/playback-time";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import type { Song } from "@/lib/music-kit/track";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/drm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/drm")>()),
  hasDrm: vi.fn(async () => true),
}));
vi.mock("@/lib/music-kit/storefront", () => ({
  fetchStorefront: vi.fn().mockResolvedValue({ id: "nl", name: "Netherlands" }),
}));

const SONGS: Song[] = [
  { id: "i.one", name: "One", playId: "111" },
  { id: "i.two", name: "Two", playId: "222" },
];

let music: FakeMusicKit;

beforeEach(() => {
  resetPlayerState();
  resetPlaybackTime();
  stubMusicKitGlobals();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);
  vi.mocked(hasDrm).mockResolvedValue(true);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function renderProvider() {
  const seen: { current?: ReturnType<typeof usePlayer> } = {};

  function Probe() {
    seen.current = usePlayer();
    return null;
  }

  render(
    <PlayerProvider>
      <Probe />
    </PlayerProvider>,
  );

  await waitFor(() => expect(music.addEventListener).toHaveBeenCalled());

  return seen;
}

describe("PlayerProvider", () => {
  it("plays nothing before a person starts a song", async () => {
    const seen = await renderProvider();

    expect(seen.current?.nowPlaying).toBeUndefined();
    expect(seen.current?.isPlaying).toBe(false);
  });

  it("hands the whole list to MusicKit when a person starts a song", async () => {
    const seen = await renderProvider();

    act(() => seen.current?.play(SONGS, { startAt: 1 }));

    await waitFor(() =>
      expect(music.setQueue).toHaveBeenCalledWith(
        expect.objectContaining({ songs: ["111", "222"], startWith: 1 }),
      ),
    );
  });

  it("shows what MusicKit plays", async () => {
    const seen = await renderProvider();

    music.queue.items = [songItem("111", "One"), songItem("222", "Two")];
    music.nowPlayingItemIndex = 1;
    music.playbackState = PLAYBACK_STATES.playing;

    act(() => music.emit("queueItemsDidChange", music.queue.items));
    act(() => seen.current?.toggle());
    act(() =>
      music.emit("playbackStateDidChange", { oldState: 0, state: PLAYBACK_STATES.playing }),
    );

    expect(seen.current?.nowPlaying?.name).toBe("Two");
    expect(seen.current?.queue).toHaveLength(2);
    expect(seen.current?.isPlaying).toBe(true);
  });

  it("moves through the queue that MusicKit holds", async () => {
    const seen = await renderProvider();

    music.queue.items = [songItem("1", "One"), songItem("2", "Two"), songItem("3", "Three")];
    act(() => music.emit("queueItemsDidChange", music.queue.items));

    act(() => seen.current?.next());

    await waitFor(() => expect(music.changeToMediaAtIndex).toHaveBeenCalledWith(1));
  });

  it("asks Apple for one song only, however fast a person skips", async () => {
    const seen = await renderProvider();

    vi.useFakeTimers();

    try {
      music.queue.items = [
        songItem("1", "One"),
        songItem("2", "Two"),
        songItem("3", "Three"),
        songItem("4", "Four"),
      ];
      act(() => music.emit("queueItemsDidChange", music.queue.items));

      // three taps while MusicKit is still on the first song
      act(() => seen.current?.next());
      act(() => seen.current?.next());
      act(() => seen.current?.next());

      expect(music.changeToMediaAtIndex).not.toHaveBeenCalled();

      // the bar has already moved on, so the taps feel answered
      expect(seen.current?.nowPlaying?.name).toBe("Four");

      await act(async () => {
        vi.advanceTimersByTime(200);
        await Promise.resolve();
      });

      expect(music.changeToMediaAtIndex).toHaveBeenCalledOnce();
      expect(music.changeToMediaAtIndex).toHaveBeenCalledWith(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stays on the last song when nothing repeats", async () => {
    const seen = await renderProvider();

    music.queue.items = [songItem("1", "One"), songItem("2", "Two")];
    music.nowPlayingItemIndex = 1;
    act(() => music.emit("queueItemsDidChange", music.queue.items));

    act(() => seen.current?.next());

    expect(music.changeToMediaAtIndex).not.toHaveBeenCalled();
  });

  it("goes round to the first song when the queue repeats", async () => {
    const seen = await renderProvider();

    music.queue.items = [songItem("1", "One"), songItem("2", "Two")];
    music.nowPlayingItemIndex = 1;
    music.repeatMode = REPEAT_MODES.all;
    act(() => music.emit("queueItemsDidChange", music.queue.items));

    act(() => seen.current?.next());

    await waitFor(() => expect(music.changeToMediaAtIndex).toHaveBeenCalledWith(0));
  });

  it("goes back a song", async () => {
    const seen = await renderProvider();

    music.queue.items = [songItem("1", "One"), songItem("2", "Two")];
    music.nowPlayingItemIndex = 1;
    act(() => music.emit("queueItemsDidChange", music.queue.items));

    act(() => seen.current?.previous());

    await waitFor(() => expect(music.changeToMediaAtIndex).toHaveBeenCalledWith(0));
  });

  it("pauses and plays again", async () => {
    const seen = await renderProvider();

    music.playbackState = PLAYBACK_STATES.playing;
    act(() =>
      music.emit("playbackStateDidChange", { oldState: 0, state: PLAYBACK_STATES.playing }),
    );

    act(() => seen.current?.toggle());
    await waitFor(() => expect(music.pause).toHaveBeenCalledOnce());

    music.playbackState = PLAYBACK_STATES.paused;
    act(() => music.emit("playbackStateDidChange", { oldState: 2, state: PLAYBACK_STATES.paused }));

    act(() => seen.current?.toggle());
    await waitFor(() => expect(music.play).toHaveBeenCalledOnce());
  });

  it("gives up on a song that is still loading when a person taps again", async () => {
    const seen = await renderProvider();

    music.queue.items = [songItem("1", "One")];
    act(() => music.emit("queueItemsDidChange", music.queue.items));
    act(() => seen.current?.toggle());

    music.playbackState = PLAYBACK_STATES.loading;
    act(() =>
      music.emit("playbackStateDidChange", { oldState: 0, state: PLAYBACK_STATES.loading }),
    );

    expect(seen.current?.isLoading).toBe(true);

    act(() => seen.current?.toggle());

    expect(seen.current?.isLoading).toBe(false);
    await waitFor(() => expect(music.pause).toHaveBeenCalledOnce());
  });

  it("keeps a paused player paused when the song finishes loading behind it", async () => {
    const seen = await renderProvider();

    music.queue.items = [songItem("1", "One")];
    act(() => music.emit("queueItemsDidChange", music.queue.items));
    act(() => seen.current?.toggle());
    act(() => seen.current?.toggle());

    // MusicKit loaded the song and started it, though nobody asked
    music.playbackState = PLAYBACK_STATES.playing;
    act(() =>
      music.emit("playbackStateDidChange", { oldState: 1, state: PLAYBACK_STATES.playing }),
    );

    expect(seen.current?.isPlaying).toBe(false);
    expect(seen.current?.isLoading).toBe(false);
    await waitFor(() => expect(music.pause).toHaveBeenCalledTimes(2));
  });

  it("turns the shuffle mode of MusicKit on and off", async () => {
    const seen = await renderProvider();

    act(() => seen.current?.toggleShuffle());
    await waitFor(() => expect(music.shuffleMode).toBe(SHUFFLE_MODES.songs));

    music.shuffleMode = SHUFFLE_MODES.songs;
    act(() => music.emit("shuffleModeDidChange", SHUFFLE_MODES.songs));
    expect(seen.current?.isShuffled).toBe(true);

    act(() => seen.current?.toggleShuffle());
    await waitFor(() => expect(music.shuffleMode).toBe(SHUFFLE_MODES.off));
  });

  it("cycles the repeat mode of MusicKit", async () => {
    const seen = await renderProvider();

    act(() => seen.current?.cycleRepeat());
    await waitFor(() => expect(music.repeatMode).toBe(REPEAT_MODES.all));

    music.repeatMode = REPEAT_MODES.all;
    act(() => music.emit("repeatModeDidChange", REPEAT_MODES.all));
    expect(seen.current?.repeat).toBe("queue");

    act(() => seen.current?.cycleRepeat());
    await waitFor(() => expect(music.repeatMode).toBe(REPEAT_MODES.one));
  });

  it("puts songs next and last through MusicKit", async () => {
    const seen = await renderProvider();

    act(() => seen.current?.playNext(SONGS));
    act(() => seen.current?.addToQueue(SONGS));

    await waitFor(() => expect(music.playNext).toHaveBeenCalledWith({ songs: ["111", "222"] }));
    expect(music.playLater).toHaveBeenCalledWith({ songs: ["111", "222"] });
  });

  it("builds the queue again when a key session breaks, so a person is not stuck", async () => {
    const seen = await renderProvider();

    music.queue.items = [songItem("1", "One"), songItem("2", "Two")];
    music.nowPlayingItemIndex = 1;
    act(() => music.emit("queueItemsDidChange", music.queue.items));
    expect(seen.current?.nowPlaying?.name).toBe("Two");

    act(() => music.emit("playbackSessionError", { error: { name: "MEDIA_KEY" } }));

    await waitFor(() =>
      expect(music.setQueue).toHaveBeenCalledWith(expect.objectContaining({ startWith: 1 })),
    );
  });

  it("does not build the queue again over and over", async () => {
    await renderProvider();

    music.queue.items = [songItem("1", "One")];
    act(() => music.emit("queueItemsDidChange", music.queue.items));

    act(() => music.emit("playbackSessionError", { error: { name: "MEDIA_KEY" } }));
    act(() => music.emit("playbackSessionError", { error: { name: "MEDIA_KEY" } }));
    act(() => music.emit("playbackSessionError", { error: { name: "MEDIA_KEY" } }));

    await waitFor(() => expect(music.setQueue).toHaveBeenCalledOnce());
  });

  it("plays nothing at all when the browser gives no DRM", async () => {
    vi.mocked(hasDrm).mockResolvedValue(false);

    const seen = await renderProvider();

    act(() => seen.current?.play(SONGS));

    expect(seen.current?.isLoading).toBe(true);

    await waitFor(() => expect(seen.current?.isLoading).toBe(false));

    expect(music.setQueue).not.toHaveBeenCalled();
    expect(seen.current?.isPlaying).toBe(false);
  });

  it("remembers the album or the playlist the queue was built from", async () => {
    const seen = await renderProvider();

    act(() => seen.current?.play(SONGS, { startAt: 0, from: { type: "albums", id: "a1" } }));

    await waitFor(() => expect(seen.current?.source).toEqual({ type: "albums", id: "a1" }));

    act(() => seen.current?.play(SONGS, { startAt: 0, from: { type: "playlists", id: "p1" } }));

    await waitFor(() => expect(seen.current?.source).toEqual({ type: "playlists", id: "p1" }));
  });

  it("forgets the source when a list is played without one", async () => {
    const seen = await renderProvider();

    act(() => seen.current?.play(SONGS, { from: { type: "albums", id: "a1" } }));
    await waitFor(() => expect(seen.current?.source).toBeDefined());

    act(() => seen.current?.play(SONGS));

    await waitFor(() => expect(seen.current?.source).toBeUndefined());
  });
});
