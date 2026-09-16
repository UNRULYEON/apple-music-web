// @vitest-environment happy-dom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider } from "@/contexts";
import {
  fakeMusicKit,
  type FakeMusicKit,
  stubMusicKitGlobals,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import { playSongs } from "@/lib/music-kit/playback";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import type { Song } from "@/lib/music-kit/track";
import { showPlayingSong, TrackList } from "./track-list";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/playback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/playback")>()),
  playSongs: vi.fn().mockResolvedValue(undefined),
}));

const ARTWORK = { url: "https://example.test/{w}x{h}{c}.{f}", width: 600, height: 600 };

const SONGS: Song[] = [
  { id: "s0", name: "First", artwork: ARTWORK, trackNumber: 2 },
  { id: "s1", name: "Second", artwork: ARTWORK, trackNumber: 5 },
  { id: "s2", name: "Third", artwork: ARTWORK, trackNumber: 9 },
];

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

const ALBUM = { type: "albums", id: "a1" } as const;
const OTHER_ALBUM = { type: "albums", id: "a2" } as const;
const LIBRARY_PLAYLIST = { type: "library-playlists", id: "p1" } as const;

const LIBRARY_SONGS: Song[] = SONGS.map((song, i) => ({
  ...song,
  id: `i.${song.id}`,
  playId: `c${i}`,
}));

function renderList(props: Partial<ComponentProps<typeof TrackList>> = {}) {
  render(
    <PlayerProvider>
      <TrackList songs={SONGS} {...props} />
    </PlayerProvider>,
  );
}

function nowPlaying(index: number, songs: Song[] = SONGS) {
  music.queue.items = songs.map((song) => ({
    id: song.playId ?? song.id,
    attributes: { name: song.name },
  }));
  music.nowPlayingItemIndex = index;
  act(() => music.emit("queueItemsDidChange", music.queue.items));
}

describe("TrackList", () => {
  it("gives the whole album to the player, starting at the song that a person clicks", async () => {
    renderList();

    fireEvent.click(screen.getByText("Third"));

    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalledWith(SONGS, { startAt: 2 }));
  });

  it("starts at the first song when a person clicks the first row", async () => {
    renderList();

    fireEvent.click(screen.getByText("First"));

    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalledWith(SONGS, { startAt: 0 }));
  });

  it("tells the player which album the songs came from", async () => {
    renderList({ source: ALBUM });

    fireEvent.click(screen.getByText("Third"));

    await waitFor(() =>
      expect(vi.mocked(playSongs)).toHaveBeenCalledWith(SONGS, { startAt: 2, from: ALBUM }),
    );
  });

  it("names a song by the number Apple Music gives it, not by its place in the list", () => {
    renderList({ source: ALBUM });

    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("9")).toBeTruthy();
    expect(screen.queryByText("1")).toBeNull();
    expect(screen.queryByText("3")).toBeNull();
  });

  it("marks an explicit song", () => {
    renderList({
      songs: [
        { id: "s0", name: "First", trackNumber: 1, contentRating: "explicit" },
        { id: "s1", name: "Second", trackNumber: 2 },
      ],
    });

    expect(screen.getAllByLabelText("Explicit")).toHaveLength(1);
  });

  it("names each disc of an album that has more than one", () => {
    renderList({
      songs: [
        { id: "s0", name: "First", trackNumber: 1, discNumber: 1 },
        { id: "s1", name: "Second", trackNumber: 1, discNumber: 2 },
      ],
    });

    expect(screen.getByRole("heading", { name: "Disc 1" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Disc 2" })).toBeTruthy();
  });

  it("names no disc on an album that has one", () => {
    renderList({
      songs: [
        { id: "s0", name: "First", trackNumber: 1, discNumber: 1 },
        { id: "s1", name: "Second", trackNumber: 2, discNumber: 1 },
      ],
    });

    expect(screen.queryByRole("heading", { name: /^Disc/ })).toBeNull();
  });

  it("names no disc in a list that shows no track number", () => {
    renderList({
      showTrackNumber: false,
      songs: [
        { id: "s0", name: "First", discNumber: 1 },
        { id: "s1", name: "Second", discNumber: 2 },
      ],
    });

    expect(screen.queryByRole("heading", { name: /^Disc/ })).toBeNull();
  });

  it("shows no number for a song Apple Music gives none", () => {
    renderList({ source: ALBUM, songs: [{ id: "s0", name: "First", artwork: ARTWORK }] });

    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.queryByText("1")).toBeNull();
  });

  it("marks the song that plays from this album", async () => {
    renderList({ source: ALBUM });

    fireEvent.click(screen.getByText("Second"));
    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalled());

    nowPlaying(1);

    expect(screen.getByLabelText("Playing now")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("5")).toBeNull());
  });

  it("marks the song that plays over its artwork, when the list shows artwork", async () => {
    renderList({ source: ALBUM, showTrackNumber: false, showArtwork: true });

    fireEvent.click(screen.getByText("Second"));
    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalled());

    nowPlaying(1);

    const artwork = screen.getByText("Second").closest("button")?.firstElementChild;

    expect(artwork?.contains(screen.getByLabelText("Playing now"))).toBe(true);
  });

  it("puts the number back when a different song starts", async () => {
    renderList({ source: ALBUM });

    fireEvent.click(screen.getByText("Second"));
    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalled());

    nowPlaying(1);
    await waitFor(() => expect(screen.queryByText("5")).toBeNull());

    nowPlaying(2);

    await waitFor(() => expect(screen.getByText("5")).toBeTruthy());
    await waitFor(() => expect(screen.queryByText("9")).toBeNull());
  });

  it("moves the mark on the artwork to the song that plays next", async () => {
    renderList({ source: ALBUM, showTrackNumber: false, showArtwork: true });

    fireEvent.click(screen.getByText("Second"));
    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalled());

    nowPlaying(1);
    nowPlaying(2);

    await waitFor(() => {
      const third = screen.getByText("Third").closest("button")?.firstElementChild;

      expect(third?.contains(screen.getByLabelText("Playing now"))).toBe(true);
    });
  });

  it("marks the song of a library playlist, which plays under its catalog id", async () => {
    renderList({
      songs: LIBRARY_SONGS,
      source: LIBRARY_PLAYLIST,
      showTrackNumber: false,
      showArtwork: true,
    });

    fireEvent.click(screen.getByText("Second"));
    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalled());

    nowPlaying(1, LIBRARY_SONGS);

    const artwork = screen.getByText("Second").closest("button")?.firstElementChild;

    expect(artwork?.contains(screen.getByLabelText("Playing now"))).toBe(true);
  });

  it("leaves the same song alone in a list it does not play from", async () => {
    render(
      <PlayerProvider>
        <div data-testid="here">
          <TrackList songs={SONGS} source={ALBUM} />
        </div>
        <div data-testid="there">
          <TrackList songs={SONGS} source={OTHER_ALBUM} />
        </div>
      </PlayerProvider>,
    );

    fireEvent.click(within(screen.getByTestId("there")).getByText("Second"));
    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalled());

    nowPlaying(1);

    expect(within(screen.getByTestId("there")).getByLabelText("Playing now")).toBeTruthy();
    expect(within(screen.getByTestId("here")).queryByLabelText("Playing now")).toBeNull();
  });
});

function box(top: number, bottom: number): DOMRect {
  return { top, bottom, left: 0, right: 0, width: 0, height: bottom - top } as DOMRect;
}

const ROW_HEIGHT = 56;
const VIEW_HEIGHT = 300;

function listInViewport({
  rowIndex,
  listTop,
  scrolled,
}: {
  rowIndex: number;
  listTop: number;
  scrolled: number;
}) {
  const viewport = document.createElement("div");
  viewport.dataset.slot = "scroll-area-viewport";
  viewport.scrollTop = scrolled;
  viewport.scrollTo = vi.fn();
  viewport.getBoundingClientRect = () => box(0, VIEW_HEIGHT);

  const list = document.createElement("div");
  list.getBoundingClientRect = () => box(listTop - scrolled, listTop - scrolled + 20 * ROW_HEIGHT);

  const row = document.createElement("button");
  row.dataset.playing = "";
  const rowTop = listTop + rowIndex * ROW_HEIGHT - scrolled;
  row.getBoundingClientRect = () => box(rowTop, rowTop + ROW_HEIGHT);

  list.append(row);
  viewport.append(list);
  document.body.append(viewport);

  return { list, viewport };
}

describe("showPlayingSong", () => {
  it("brings a song far down the list to the middle", () => {
    const { list, viewport } = listInViewport({ rowIndex: 39, listTop: 800, scrolled: 0 });

    showPlayingSong(list);

    expect(viewport.scrollTo).toHaveBeenCalledWith({ top: 2862 });
  });

  it("goes no further than the first song when the window is short", () => {
    const { list, viewport } = listInViewport({ rowIndex: 0, listTop: 800, scrolled: 0 });

    showPlayingSong(list);

    expect(viewport.scrollTo).toHaveBeenCalledWith({ top: 800 });
  });

  it("opens at the top when the song fits on screen below the header", () => {
    const { list, viewport } = listInViewport({ rowIndex: 1, listTop: 100, scrolled: 0 });

    showPlayingSong(list);

    expect(viewport.scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it("reads the same place whatever the view before it was left at", () => {
    const deep = listInViewport({ rowIndex: 39, listTop: 800, scrolled: 4000 });
    const top = listInViewport({ rowIndex: 39, listTop: 800, scrolled: 0 });

    showPlayingSong(deep.list);
    showPlayingSong(top.list);

    expect(deep.viewport.scrollTo).toHaveBeenCalledWith({ top: 2862 });
    expect(top.viewport.scrollTo).toHaveBeenCalledWith({ top: 2862 });
  });

  it("does nothing when no song of the list is playing", () => {
    const list = document.createElement("div");
    document.body.append(list);

    expect(() => showPlayingSong(list)).not.toThrow();
  });
});
