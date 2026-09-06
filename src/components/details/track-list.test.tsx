// @vitest-environment happy-dom
import { TrackList } from "@/components/details/track-list";
import { PlayerProvider } from "@/contexts";
import { usePlayer } from "@/hooks";
import type { Song } from "@/lib/music-kit/track";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

const SONGS: Song[] = [
  { id: "s0", name: "First" },
  { id: "s1", name: "Second" },
  { id: "s2", name: "Third" },
];

function renderList() {
  const seen: { current?: ReturnType<typeof usePlayer> } = {};

  function Probe() {
    seen.current = usePlayer();
    return null;
  }

  render(
    <PlayerProvider>
      <Probe />
      <TrackList songs={SONGS} />
    </PlayerProvider>,
  );

  return seen;
}

describe("TrackList", () => {
  it("queues the full album and starts at the song that a person clicks", () => {
    const seen = renderList();

    fireEvent.click(screen.getByText("Third"));

    expect(seen.current?.queue.map((song) => song.id)).toEqual(["s0", "s1", "s2"]);
    expect(seen.current?.index).toBe(2);
    expect(seen.current?.nowPlaying?.id).toBe("s2");
    expect(seen.current?.isPlaying).toBe(true);
  });

  it("keeps the album in the queue when the first song starts", () => {
    const seen = renderList();

    fireEvent.click(screen.getByText("First"));

    expect(seen.current?.queue).toHaveLength(3);
    expect(seen.current?.upNext.map((song) => song.id)).toEqual(["s1", "s2"]);
  });
});
