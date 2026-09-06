import {
  append,
  buildQueue,
  insertAfter,
  nextRepeatMode,
  setShuffle,
  shuffled,
} from "@/lib/player/queue";
import type { Song } from "@/lib/music-kit/track";
import { afterEach, describe, expect, it, vi } from "vitest";

function songs(count: number): Song[] {
  return Array.from({ length: count }, (_, i) => ({ id: `s${i}`, name: `Song ${i}` }));
}

function ids(list: Song[]): string[] {
  return list.map((song) => song.id);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildQueue", () => {
  it("keeps the album order and starts at the first song", () => {
    const queue = buildQueue(songs(3));

    expect(ids(queue.songs)).toEqual(["s0", "s1", "s2"]);
    expect(queue.index).toBe(0);
  });

  it("starts at the song that the person selected", () => {
    const queue = buildQueue(songs(3), { startAt: 2 });

    expect(queue.songs[queue.index]?.id).toBe("s2");
  });

  it("starts at the first song when the position is out of range", () => {
    expect(buildQueue(songs(3), { startAt: 9 }).index).toBe(0);
  });

  it("puts the selected song first and randomises the rest", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const queue = buildQueue(songs(4), { startAt: 2, shuffle: true });

    expect(queue.index).toBe(0);
    expect(queue.songs[0]?.id).toBe("s2");
    expect(ids(queue.songs).toSorted()).toEqual(["s0", "s1", "s2", "s3"]);
  });

  it("gives an empty queue for an empty collection", () => {
    expect(buildQueue([], { shuffle: true }).songs).toEqual([]);
  });
});

describe("shuffled", () => {
  it("keeps every song", () => {
    expect(ids(shuffled(songs(5))).toSorted()).toEqual(["s0", "s1", "s2", "s3", "s4"]);
  });

  it("does not change the source list", () => {
    const source = songs(3);

    shuffled(source);

    expect(ids(source)).toEqual(["s0", "s1", "s2"]);
  });
});

describe("insertAfter", () => {
  it("puts the new songs directly after the song that plays now", () => {
    const source = songs(3);
    const queue = insertAfter({ source, songs: source, index: 1 }, [{ id: "new", name: "New" }]);

    expect(ids(queue.songs)).toEqual(["s0", "s1", "new", "s2"]);
    expect(queue.index).toBe(1);
  });
});

describe("append", () => {
  it("puts the new songs at the end", () => {
    const source = songs(2);
    const queue = append({ source, songs: source, index: 0 }, [{ id: "new", name: "New" }]);

    expect(ids(queue.songs)).toEqual(["s0", "s1", "new"]);
  });
});

describe("setShuffle", () => {
  it("keeps the song that plays now first and randomises the rest", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const source = songs(4);

    const queue = setShuffle({ source, songs: source, index: 2 }, true);

    expect(queue.songs[0]?.id).toBe("s2");
    expect(queue.index).toBe(0);
    expect(ids(queue.songs).toSorted()).toEqual(["s0", "s1", "s2", "s3"]);
  });

  it("gives back the collection order and keeps the song that plays now", () => {
    const source = songs(4);
    const shuffledQueue = setShuffle({ source, songs: source, index: 2 }, true);

    const queue = setShuffle(shuffledQueue, false);

    expect(ids(queue.songs)).toEqual(["s0", "s1", "s2", "s3"]);
    expect(queue.songs[queue.index]?.id).toBe("s2");
  });

  it("keeps a queued song after the shuffle mode stops", () => {
    const source = songs(2);
    const added = append({ source, songs: source, index: 0 }, [{ id: "new", name: "New" }]);

    const queue = setShuffle(setShuffle(added, true), false);

    expect(ids(queue.songs)).toEqual(["s0", "s1", "new"]);
  });

  it("leaves an empty queue alone", () => {
    expect(setShuffle({ source: [], songs: [], index: 0 }, true).songs).toEqual([]);
  });
});

describe("nextRepeatMode", () => {
  it("cycles off, queue, song, off", () => {
    expect(nextRepeatMode("off")).toBe("queue");
    expect(nextRepeatMode("queue")).toBe("song");
    expect(nextRepeatMode("song")).toBe("off");
  });
});
