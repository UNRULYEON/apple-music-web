// @vitest-environment happy-dom
import { PlayerProvider } from "@/contexts";
import { usePlayer } from "@/hooks";
import type { Song } from "@/lib/music-kit/track";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function songs(count: number): Song[] {
  return Array.from({ length: count }, (_, i) => ({ id: `s${i}`, name: `Song ${i}` }));
}

function renderProvider() {
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

  return seen;
}

describe("PlayerProvider", () => {
  it("plays nothing before a person starts a song", () => {
    const seen = renderProvider();

    expect(seen.current?.nowPlaying).toBeUndefined();
    expect(seen.current?.isPlaying).toBe(false);
  });

  it("puts the full album in the queue when a song starts", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(3), { startAt: 1 }));

    expect(seen.current?.nowPlaying?.id).toBe("s1");
    expect(seen.current?.queue).toHaveLength(3);
    expect(seen.current?.upNext.map((song) => song.id)).toEqual(["s2"]);
    expect(seen.current?.isPlaying).toBe(true);
  });

  it("randomises the album but keeps the selected song first", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const seen = renderProvider();

    act(() => seen.current?.play(songs(4), { startAt: 3, shuffle: true }));

    expect(seen.current?.nowPlaying?.id).toBe("s3");
    expect(seen.current?.queue).toHaveLength(4);
  });

  it("stays quiet for an empty collection", () => {
    const seen = renderProvider();

    act(() => seen.current?.play([]));

    expect(seen.current?.isPlaying).toBe(false);
  });

  it("plays a queued song when nothing plays now", () => {
    const seen = renderProvider();

    act(() => seen.current?.addToQueue(songs(2)));

    expect(seen.current?.nowPlaying?.id).toBe("s0");
    expect(seen.current?.isPlaying).toBe(true);
  });

  it("keeps the current song when a person queues more", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(2)));
    act(() => seen.current?.playNext([{ id: "next", name: "Next" }]));
    act(() => seen.current?.addToQueue([{ id: "last", name: "Last" }]));

    expect(seen.current?.nowPlaying?.id).toBe("s0");
    expect(seen.current?.upNext.map((song) => song.id)).toEqual(["next", "s1", "last"]);
  });

  it("moves through the queue", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(2)));
    act(() => seen.current?.next());

    expect(seen.current?.nowPlaying?.id).toBe("s1");

    act(() => seen.current?.previous());

    expect(seen.current?.nowPlaying?.id).toBe("s0");
  });

  it("stops at the end of the queue", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(1)));
    act(() => seen.current?.next());

    expect(seen.current?.nowPlaying?.id).toBe("s0");
    expect(seen.current?.isPlaying).toBe(false);
  });

  it("stays at the first song before the start of the queue", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(2)));
    act(() => seen.current?.previous());

    expect(seen.current?.nowPlaying?.id).toBe("s0");
  });

  it("pauses and starts again", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(1)));
    act(() => seen.current?.toggle());

    expect(seen.current?.isPlaying).toBe(false);

    act(() => seen.current?.toggle());

    expect(seen.current?.isPlaying).toBe(true);
  });

  it("does not start with an empty queue", () => {
    const seen = renderProvider();

    act(() => seen.current?.toggle());

    expect(seen.current?.isPlaying).toBe(false);
  });

  it("starts again from the song that stopped at the end of the queue", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(2)));
    act(() => seen.current?.next());
    act(() => seen.current?.next());
    act(() => seen.current?.toggle());

    expect(seen.current?.isPlaying).toBe(true);
    expect(seen.current?.nowPlaying?.id).toBe("s1");
  });

  it("empties the queue", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(3)));
    act(() => seen.current?.clear());

    expect(seen.current?.queue).toEqual([]);
    expect(seen.current?.nowPlaying).toBeUndefined();
    expect(seen.current?.isPlaying).toBe(false);
  });
});

describe("shuffle mode", () => {
  it("is off at the start", () => {
    expect(renderProvider().current?.isShuffled).toBe(false);
  });

  it("randomises the queue but keeps the song that plays now", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const seen = renderProvider();

    act(() => seen.current?.play(songs(4), { startAt: 2 }));
    act(() => seen.current?.toggleShuffle());

    expect(seen.current?.isShuffled).toBe(true);
    expect(seen.current?.nowPlaying?.id).toBe("s2");
    expect(seen.current?.queue).toHaveLength(4);
  });

  it("gives back the album order when it stops", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(4), { startAt: 2 }));
    act(() => seen.current?.toggleShuffle());
    act(() => seen.current?.toggleShuffle());

    expect(seen.current?.isShuffled).toBe(false);
    expect(seen.current?.queue.map((song) => song.id)).toEqual(["s0", "s1", "s2", "s3"]);
    expect(seen.current?.nowPlaying?.id).toBe("s2");
  });

  it("randomises the next album that a person starts", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(2)));
    act(() => seen.current?.toggleShuffle());
    act(() => seen.current?.play(songs(3), { startAt: 1 }));

    expect(seen.current?.isShuffled).toBe(true);
    expect(seen.current?.nowPlaying?.id).toBe("s1");
  });

  it("keeps a queued song when the mode stops", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(2)));
    act(() => seen.current?.addToQueue([{ id: "new", name: "New" }]));
    act(() => seen.current?.toggleShuffle());
    act(() => seen.current?.toggleShuffle());

    expect(seen.current?.queue.map((song) => song.id)).toEqual(["s0", "s1", "new"]);
  });

  it("starts the mode when a person plays a randomised album", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(3), { shuffle: true }));

    expect(seen.current?.isShuffled).toBe(true);
  });
});

describe("repeat mode", () => {
  it("cycles off, queue, song, off", () => {
    const seen = renderProvider();

    expect(seen.current?.repeat).toBe("off");

    act(() => seen.current?.cycleRepeat());
    expect(seen.current?.repeat).toBe("queue");

    act(() => seen.current?.cycleRepeat());
    expect(seen.current?.repeat).toBe("song");

    act(() => seen.current?.cycleRepeat());
    expect(seen.current?.repeat).toBe("off");
  });

  it("goes back to the first song at the end of the queue", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(2)));
    act(() => seen.current?.cycleRepeat());
    act(() => seen.current?.next());
    act(() => seen.current?.next());

    expect(seen.current?.nowPlaying?.id).toBe("s0");
    expect(seen.current?.isPlaying).toBe(true);
  });

  it("goes to the last song before the first song", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(3)));
    act(() => seen.current?.cycleRepeat());
    act(() => seen.current?.previous());

    expect(seen.current?.nowPlaying?.id).toBe("s2");
  });

  it("plays the same song again instead of moving on", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(3), { startAt: 1 }));
    act(() => seen.current?.cycleRepeat());
    act(() => seen.current?.cycleRepeat());
    act(() => seen.current?.next());

    expect(seen.current?.repeat).toBe("song");
    expect(seen.current?.nowPlaying?.id).toBe("s1");
    expect(seen.current?.isPlaying).toBe(true);
  });

  it("plays the same song again instead of going back", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(3), { startAt: 1 }));
    act(() => seen.current?.cycleRepeat());
    act(() => seen.current?.cycleRepeat());
    act(() => seen.current?.previous());

    expect(seen.current?.nowPlaying?.id).toBe("s1");
  });

  it("moves to the next song when repeat is off", () => {
    const seen = renderProvider();

    act(() => seen.current?.play(songs(2)));
    act(() => seen.current?.next());

    expect(seen.current?.nowPlaying?.id).toBe("s1");
  });
});
