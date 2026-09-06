// @vitest-environment happy-dom
import { Player } from "@/components/player";
import { PlayerProvider } from "@/contexts";
import {
  fakeMusicKit,
  PLAYBACK_STATES,
  REPEAT_MODES,
  SHUFFLE_MODES,
  stubMusicKitGlobals,
  type FakeMusicKit,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const ARTWORK = '[data-slot="player-artwork"]';
const COVER = { url: "https://example.com/{w}x{h}{c}.{f}", width: 300, height: 300 };
const OTHER_COVER = { ...COVER, url: "https://example.com/other-{w}x{h}{c}.{f}" };

function item(id: string, name: string, artwork = COVER, artistName = "The Band") {
  return { id, attributes: { name, artistName, artwork } };
}

let music: FakeMusicKit;

beforeEach(() => {
  resetPlayerState();
  stubMusicKitGlobals();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function renderPlayer() {
  render(
    <PlayerProvider>
      <Player />
    </PlayerProvider>,
  );

  await waitFor(() => expect(music.addEventListener).toHaveBeenCalled());
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
});
