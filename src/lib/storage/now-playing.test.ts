// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import {
  forgetStoredQueue,
  readStoredQueue,
  writeStoredPosition,
  writeStoredQueue,
} from "@/lib/storage/now-playing";

const KEY = "now-playing";

const QUEUE = { songs: ["111", "222"], index: 1, source: { type: "albums" as const, id: "a.1" } };

afterEach(() => {
  localStorage.clear();
});

describe("readStoredQueue", () => {
  it("gives back the queue a person left behind", () => {
    writeStoredQueue(QUEUE);

    expect(readStoredQueue()).toEqual(QUEUE);
  });

  it("gives back nothing when the browser holds no queue", () => {
    expect(readStoredQueue()).toBeUndefined();
  });

  it("gives back nothing for a queue it cannot read", () => {
    localStorage.setItem(KEY, "{this is not a queue");

    expect(readStoredQueue()).toBeUndefined();
  });

  it("gives back nothing for a queue without songs", () => {
    localStorage.setItem(KEY, JSON.stringify({ songs: [], index: 0 }));

    expect(readStoredQueue()).toBeUndefined();
  });

  it("gives back nothing for a place outside the queue", () => {
    localStorage.setItem(KEY, JSON.stringify({ songs: ["111"], index: 4 }));

    expect(readStoredQueue()).toBeUndefined();
  });

  it("gives back nothing for songs that are not ids", () => {
    localStorage.setItem(KEY, JSON.stringify({ songs: [{ id: "111" }], index: 0 }));

    expect(readStoredQueue()).toBeUndefined();
  });

  it("keeps the queue and drops a list it came from that makes no sense", () => {
    localStorage.setItem(KEY, JSON.stringify({ songs: ["111"], index: 0, source: "an album" }));

    expect(readStoredQueue()).toEqual({ songs: ["111"], index: 0, source: undefined });
  });
});

describe("forgetStoredQueue", () => {
  it("takes the queue out of the browser", () => {
    writeStoredQueue(QUEUE);

    forgetStoredQueue();

    expect(readStoredQueue()).toBeUndefined();
  });
});

describe("writeStoredPosition", () => {
  it("gives back the place a person left off at", () => {
    writeStoredQueue(QUEUE);
    writeStoredPosition(42);

    expect(readStoredQueue()?.position).toBe(42);
  });

  it("writes no place while the browser holds no queue", () => {
    writeStoredPosition(42);

    expect(readStoredQueue()).toBeUndefined();
  });

  it("keeps the place while a person stays on the same song", () => {
    writeStoredQueue(QUEUE);
    writeStoredPosition(42);
    writeStoredQueue({ ...QUEUE, source: undefined });

    expect(readStoredQueue()?.position).toBe(42);
  });

  it("drops the place when a person moves to another song", () => {
    writeStoredQueue(QUEUE);
    writeStoredPosition(42);
    writeStoredQueue({ ...QUEUE, index: 0 });

    expect(readStoredQueue()?.position).toBeUndefined();
  });

  it.each([
    ["nought", 0],
    ["a place before the start", -5],
    ["a place that is no number", "half way"],
  ])("gives back no place for %s", (_name, position) => {
    localStorage.setItem(KEY, JSON.stringify({ songs: ["111"], index: 0, position }));

    expect(readStoredQueue()?.position).toBeUndefined();
  });
});
