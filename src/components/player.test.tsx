// @vitest-environment happy-dom
import { Player } from "@/components/player";
import { PlayerProvider } from "@/contexts";
import { usePlayer } from "@/hooks";
import type { Song } from "@/lib/music-kit/track";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

const SONGS: Song[] = [
  { id: "s0", name: "First" },
  { id: "s1", name: "Second" },
];

const ARTWORK = '[data-slot="player-artwork"]';

const COVER = { url: "https://example.com/{w}x{h}{c}.{f}", width: 300, height: 300 };
const OTHER_COVER = { ...COVER, url: "https://example.com/other-{w}x{h}{c}.{f}" };

const ALBUM: Song[] = [
  { id: "a0", name: "One", artist: { name: "The Band" }, artwork: COVER },
  { id: "a1", name: "Two", artist: { name: "The Band" }, artwork: COVER },
  { id: "a2", name: "Three", artist: { name: "Someone Else" }, artwork: OTHER_COVER },
];

function renderPlayer() {
  const seen: { current?: ReturnType<typeof usePlayer> } = {};

  function Probe() {
    seen.current = usePlayer();
    return null;
  }

  render(
    <PlayerProvider>
      <Probe />
      <Player />
    </PlayerProvider>,
  );

  return seen;
}

describe("Player", () => {
  it("shows nothing while the queue is empty", () => {
    renderPlayer();

    expect(screen.queryByLabelText("Shuffle")).toBeNull();
  });

  it("comes in with the song that a person starts", () => {
    const seen = renderPlayer();

    act(() => seen.current?.play(SONGS));

    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.getByLabelText("Repeat off")).toBeTruthy();
  });

  it("goes away again when the queue is empty", async () => {
    const seen = renderPlayer();

    act(() => seen.current?.play(SONGS));
    act(() => seen.current?.clear());

    expect(screen.queryByText("First")).not.toBeNull();

    await waitFor(() => expect(screen.queryByText("First")).toBeNull());
  });

  it("swaps the name and the artist to the song that comes next", async () => {
    const seen = renderPlayer();

    act(() => seen.current?.play(SONGS));
    act(() => seen.current?.next());

    expect(screen.getByText("Second")).toBeTruthy();

    await waitFor(() => expect(screen.queryByText("First")).toBeNull());
  });

  it("leaves the artwork and the artist alone inside one album", () => {
    const seen = renderPlayer();

    act(() => seen.current?.play(ALBUM));
    const artwork = document.querySelector(ARTWORK);
    const artist = screen.getByText("The Band");

    act(() => seen.current?.next());

    expect(document.querySelectorAll(ARTWORK)).toHaveLength(1);
    expect(document.querySelector(ARTWORK)).toBe(artwork);
    expect(screen.getByText("The Band")).toBe(artist);
  });

  it("swaps the artwork and the artist for a song from somewhere else", () => {
    const seen = renderPlayer();

    act(() => seen.current?.play(ALBUM, { startAt: 1 }));

    act(() => seen.current?.next());

    expect(document.querySelectorAll(ARTWORK)).toHaveLength(2);
    expect(screen.getByText("Someone Else")).toBeTruthy();
  });

  it("turns the shuffle mode on and off from the bar", () => {
    const seen = renderPlayer();

    act(() => seen.current?.play(SONGS));
    const button = screen.getByLabelText("Shuffle");

    fireEvent.click(button);

    expect(seen.current?.isShuffled).toBe(true);
    expect(button.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(button);

    expect(seen.current?.isShuffled).toBe(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("cycles the repeat mode from the bar", () => {
    const seen = renderPlayer();

    act(() => seen.current?.play(SONGS));

    fireEvent.click(screen.getByLabelText("Repeat off"));
    expect(seen.current?.repeat).toBe("queue");

    fireEvent.click(screen.getByLabelText("Repeat the queue"));
    expect(seen.current?.repeat).toBe("song");

    fireEvent.click(screen.getByLabelText("Repeat the song"));
    expect(seen.current?.repeat).toBe("off");
  });
});
