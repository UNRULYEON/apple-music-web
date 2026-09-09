// @vitest-environment happy-dom
import { Player } from "@/components/player";
import { PlayerProvider } from "@/contexts";
import { usePlayer } from "@/hooks";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { HOME } from "@/lib/views/view";
import type { Song } from "@/lib/music-kit/track";
import {
  fakeMusicKit,
  PLAYBACK_STATES,
  REPEAT_MODES,
  SHUFFLE_MODES,
  stubMusicKitGlobals,
  type FakeMusicKit,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import { resetPlaybackTime } from "@/lib/music-kit/playback-time";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

// the player sits in the shell, above the router, so the tests give it the view alone.
// Not opening the screen a person is already on is useView's own rule.
const openView = vi.fn();

vi.mock("@/hooks/use-view", () => ({
  useView: () => ({ view: HOME, open: openView, close: vi.fn(), canClose: false }),
}));
vi.mock("@/lib/music-kit/drm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/drm")>()),
  hasDrm: vi.fn(async () => true),
}));

const SONGS: Song[] = [
  { id: "i.one", name: "One", playId: "111" },
  { id: "i.two", name: "Two", playId: "222" },
];

const ARTWORK = '[data-slot="player-artwork"]';
const ELAPSED = '[data-slot="player-elapsed"]';
const LENGTH = '[data-slot="player-length"]';

const TEXT_NODE = 3;

function clock(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);

  if (!found) {
    throw new Error(`The player shows no ${selector}.`);
  }

  return found;
}

// a rolling number keeps the text a person reads in one span of its own and a copy of
// it out of sight, which it measures against, so only the first one is read here
function reads(selector: string): string {
  return [...clock(selector).childNodes]
    .map((node) =>
      node.nodeType === TEXT_NODE
        ? node.textContent
        : (node as Element).querySelector(".rn-value")?.textContent,
    )
    .join("");
}

function elapsed(): string {
  return reads(ELAPSED);
}
const COVER = { url: "https://example.com/{w}x{h}{c}.{f}", width: 300, height: 300 };
const OTHER_COVER = { ...COVER, url: "https://example.com/other-{w}x{h}{c}.{f}" };

function item(id: string, name: string, artwork = COVER, artistName = "The Band") {
  return { id, attributes: { name, artistName, artwork } };
}

function setViewport(mobile: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width") ? mobile : !mobile,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

let music: FakeMusicKit;

beforeEach(() => {
  resetPlayerState();
  resetPlaybackTime();
  setViewport(false);
  stubMusicKitGlobals();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function renderPlayer() {
  const seen: { current?: ReturnType<typeof usePlayer> } = {};

  function Probe() {
    seen.current = usePlayer();
    return null;
  }

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <PlayerProvider>
        <Player />
        <Probe />
      </PlayerProvider>
    </QueryClientProvider>,
  );

  await waitFor(() => expect(music.addEventListener).toHaveBeenCalled());

  return seen;
}

function loadQueue(items: MusicKit.MediaItem[], index = 0) {
  music.queue.items = items;
  music.nowPlayingItemIndex = index;
  act(() => music.emit("queueItemsDidChange", items));
}

// a person pressing play is what makes the app want sound at all
function start() {
  fireEvent.click(screen.getByLabelText("Play"));
}

// the progress bar reaches MusicKit only once the bar itself is on screen
async function waitForSeekBar() {
  await waitFor(() =>
    expect(music.addEventListener).toHaveBeenCalledWith(
      "playbackTimeDidChange",
      expect.any(Function),
    ),
  );
}

function setTime(position: number, duration: number) {
  music.currentPlaybackTime = position;
  music.currentPlaybackDuration = duration;
  act(() =>
    music.emit("playbackTimeDidChange", {
      currentPlaybackTime: position,
      currentPlaybackDuration: duration,
      currentPlaybackTimeRemaining: duration - position,
    }),
  );
}

function setState(state: number) {
  music.playbackState = state;
  act(() => music.emit("playbackStateDidChange", { oldState: 0, state }));
}

describe("Player", () => {
  it("shows nothing while MusicKit holds no song", async () => {
    await renderPlayer();

    expect(screen.queryByLabelText("Shuffle")).toBeNull();
  });

  it("shows the song that MusicKit plays", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);

    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.getByLabelText("Repeat off")).toBeTruthy();
  });

  it("swaps the name when MusicKit moves to the next song", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);
    music.nowPlayingItemIndex = 1;
    act(() => music.emit("queuePositionDidChange", { position: 1 }));

    expect(screen.getByText("Second")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("First")).toBeNull());
  });

  it("leaves the artwork and the artist alone inside one album", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);
    const artwork = document.querySelector(ARTWORK);
    const artist = screen.getByText("The Band");

    music.nowPlayingItemIndex = 1;
    act(() => music.emit("queuePositionDidChange", { position: 1 }));

    expect(document.querySelectorAll(ARTWORK)).toHaveLength(1);
    expect(document.querySelector(ARTWORK)).toBe(artwork);
    expect(screen.getByText("The Band")).toBe(artist);
  });

  it("swaps the artwork and the artist for a song from somewhere else", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second", OTHER_COVER, "Someone Else")]);
    music.nowPlayingItemIndex = 1;
    act(() => music.emit("queuePositionDidChange", { position: 1 }));

    expect(document.querySelectorAll(ARTWORK)).toHaveLength(2);
    expect(screen.getByText("Someone Else")).toBeTruthy();
  });

  it("shows that a song is still coming, and gives up on it when tapped", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    start();
    setState(PLAYBACK_STATES.loading);

    fireEvent.click(screen.getByLabelText("Stop loading"));

    await waitFor(() => expect(music.pause).toHaveBeenCalledOnce());
  });

  it("plays again after a person gave up on the loading", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    setState(PLAYBACK_STATES.paused);

    start();

    await waitFor(() => expect(music.play).toHaveBeenCalledOnce());
  });

  it("turns the shuffle mode of MusicKit on from the bar", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);

    fireEvent.click(screen.getByLabelText("Shuffle"));

    await waitFor(() => expect(music.shuffleMode).toBe(SHUFFLE_MODES.songs));
  });

  it("cycles the repeat mode of MusicKit from the bar", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);

    fireEvent.click(screen.getByLabelText("Repeat off"));

    await waitFor(() => expect(music.repeatMode).toBe(REPEAT_MODES.all));
  });

  it("turns the skip buttons off while MusicKit says they do nothing", async () => {
    await renderPlayer();

    music.capabilities.canSkipToNextItem = false;
    music.capabilities.canSkipToPreviousItem = false;
    loadQueue([item("1", "First")]);

    expect(screen.getByLabelText<HTMLButtonElement>("Next song").disabled).toBe(true);
    expect(screen.getByLabelText<HTMLButtonElement>("Previous song").disabled).toBe(true);
  });

  it("turns them on again when MusicKit allows a skip", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);

    expect(screen.getByLabelText<HTMLButtonElement>("Next song").disabled).toBe(false);
  });

  it("never shows a play icon on the way to a new song", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);
    start();
    setState(PLAYBACK_STATES.playing);
    expect(screen.getByLabelText("Pause")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Next song"));

    // MusicKit goes through stopped, where it neither plays nor loads
    setState(PLAYBACK_STATES.stopped);
    expect(screen.queryByLabelText("Play")).toBeNull();
    expect(screen.getByLabelText("Stop loading")).toBeTruthy();

    setState(PLAYBACK_STATES.loading);
    expect(screen.getByLabelText("Stop loading")).toBeTruthy();

    setState(PLAYBACK_STATES.playing);
    expect(screen.getByLabelText("Pause")).toBeTruthy();
  });

  it("shows the play icon again when a person gives up on the new song", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);
    start();
    setState(PLAYBACK_STATES.playing);

    fireEvent.click(screen.getByLabelText("Next song"));
    setState(PLAYBACK_STATES.stopped);

    fireEvent.click(screen.getByLabelText("Stop loading"));

    expect(screen.getByLabelText("Play")).toBeTruthy();
  });

  it("stays paused when a person pauses a song that is still loading", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    start();
    setState(PLAYBACK_STATES.loading);
    expect(screen.getByLabelText("Stop loading")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Stop loading"));

    // nothing on the screen says a song is still coming
    expect(screen.getByLabelText("Play")).toBeTruthy();
    expect(screen.queryByLabelText("Stop loading")).toBeNull();

    // MusicKit finished loading behind the scenes and started the song anyway
    setState(PLAYBACK_STATES.playing);

    expect(screen.getByLabelText("Play")).toBeTruthy();
    await waitFor(() => expect(music.pause).toHaveBeenCalledTimes(2));
  });

  it("loads again when a person asks for the song a second time", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    start();
    setState(PLAYBACK_STATES.loading);
    fireEvent.click(screen.getByLabelText("Stop loading"));

    fireEvent.click(screen.getByLabelText("Play"));

    expect(screen.getByLabelText("Stop loading")).toBeTruthy();

    setState(PLAYBACK_STATES.playing);

    expect(screen.getByLabelText("Pause")).toBeTruthy();
  });

  it("shows how far the song has come and how long it is", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    await waitForSeekBar();
    setTime(42, 210);

    expect(elapsed()).toBe("0:42");
    expect(reads(LENGTH)).toBe("3:30");
  });

  it("cycles the end of the bar between the length and what is left", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    await waitForSeekBar();
    setTime(42, 210);

    fireEvent.click(clock(LENGTH));
    expect(reads(LENGTH)).toBe("-2:48");

    fireEvent.click(clock(LENGTH));
    expect(reads(LENGTH)).toBe("3:30");
  });

  it("drops a place asked for in the song before this one", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);
    await waitForSeekBar();
    setTime(42, 210);

    fireEvent.keyDown(screen.getByLabelText("Seek"), { key: "PageUp" });
    expect(elapsed()).toBe("0:57");

    music.nowPlayingItemIndex = 1;
    act(() => music.emit("queuePositionDidChange", { position: 1 }));
    setTime(0, 180);

    expect(elapsed()).toBe("0:00");
  });

  it("keeps the time a person picked through the next song", async () => {
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);
    await waitForSeekBar();
    setTime(42, 210);

    fireEvent.click(clock(LENGTH));

    music.nowPlayingItemIndex = 1;
    act(() => music.emit("queuePositionDidChange", { position: 1 }));
    setTime(0, 180);

    expect(reads(LENGTH)).toBe("-3:00");
  });

  it("shows the length from the catalog before MusicKit opens the song", async () => {
    await renderPlayer();

    loadQueue([{ id: "1", attributes: { name: "First", durationInMillis: 180_000 } }]);
    await waitForSeekBar();

    expect(reads(LENGTH)).toBe("3:00");
  });

  it("seeks in the song when a person moves the bar", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    await waitForSeekBar();
    setTime(42, 210);

    fireEvent.keyDown(screen.getByLabelText("Seek"), { key: "ArrowRight" });

    await waitFor(() => expect(music.seekToTime).toHaveBeenCalledWith(43));
  });

  it("holds the bar where a person put it until MusicKit gets there", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    await waitForSeekBar();
    setTime(42, 210);

    fireEvent.keyDown(screen.getByLabelText("Seek"), { key: "PageUp" });

    expect(elapsed()).toBe("0:57");

    // MusicKit is still back where the song was
    setTime(43, 210);
    expect(elapsed()).toBe("0:57");

    setTime(57, 210);
    await waitFor(() => expect(elapsed()).toBe("0:57"));
  });

  it("turns the bar off while nothing knows how long the song is", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    await waitForSeekBar();

    expect(screen.getByLabelText<HTMLInputElement>("Seek").disabled).toBe(true);
  });

  it("keeps every control and the queue on a wide viewport", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);

    expect(screen.getByLabelText("Shuffle")).toBeTruthy();
    expect(screen.getByLabelText("Previous song")).toBeTruthy();
    expect(screen.getByLabelText("Repeat off")).toBeTruthy();
    expect(screen.getByLabelText("Queue")).toBeTruthy();
  });

  it("keeps only play and skip on a narrow viewport", async () => {
    setViewport(true);
    await renderPlayer();

    loadQueue([item("1", "First")]);

    expect(screen.queryByLabelText("Shuffle")).toBeNull();
    expect(screen.queryByLabelText("Previous song")).toBeNull();
    expect(screen.queryByLabelText("Repeat off")).toBeNull();
    expect(screen.queryByLabelText("Queue")).toBeNull();

    expect(screen.getByLabelText("Play")).toBeTruthy();
    expect(screen.getByLabelText("Next song")).toBeTruthy();
  });

  it("still plays and skips from the narrow viewport", async () => {
    setViewport(true);
    await renderPlayer();

    loadQueue([item("1", "First"), item("2", "Second")]);

    start();
    await waitFor(() => expect(music.play).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByLabelText("Next song"));
    expect(screen.getByText("Second")).toBeTruthy();
  });

  it("shows the song but no progress bar on a narrow viewport", async () => {
    setViewport(true);
    await renderPlayer();

    loadQueue([item("1", "First")]);

    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.getByText("The Band")).toBeTruthy();
    expect(screen.queryByLabelText("Seek")).toBeNull();
  });

  it("goes away when a person signs out", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);
    expect(screen.getByText("First")).toBeTruthy();

    act(() => setAuthStatus("signed-out"));

    await waitFor(() => expect(screen.queryByText("First")).toBeNull());
    expect(screen.queryByLabelText("Play")).toBeNull();
  });

  it("opens the album the queue was built from when a person taps the artwork", async () => {
    const seen = await renderPlayer();

    act(() => seen.current?.play(SONGS, { from: { type: "albums", id: "a1" } }));
    loadQueue([item("1", "First")]);

    fireEvent.click(await screen.findByLabelText("Show the album"));

    expect(openView).toHaveBeenCalledWith({ name: "detail", type: "albums", id: "a1" });
  });

  it("opens it from the song title as well", async () => {
    const seen = await renderPlayer();

    act(() => seen.current?.play(SONGS, { from: { type: "library-playlists", id: "p.1" } }));
    loadQueue([item("1", "First")]);

    fireEvent.click(await screen.findByRole("button", { name: "First" }));

    expect(openView).toHaveBeenCalledWith({ name: "detail", type: "library-playlists", id: "p.1" });
  });

  it("names the playlist a queue came from", async () => {
    const seen = await renderPlayer();

    act(() => seen.current?.play(SONGS, { from: { type: "playlists", id: "p.1" } }));
    loadQueue([item("1", "First")]);

    expect(await screen.findByLabelText("Show the playlist")).toBeTruthy();
  });

  it("leaves the song as plain text when the queue came from nowhere", async () => {
    await renderPlayer();

    loadQueue([item("1", "First")]);

    expect(screen.queryByLabelText("Show the album")).toBeNull();
    expect(screen.queryByRole("button", { name: "First" })).toBeNull();
  });
});
