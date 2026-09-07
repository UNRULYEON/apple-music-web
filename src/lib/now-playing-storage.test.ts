// @vitest-environment happy-dom
import { forgetStoredQueue, readStoredQueue, writeStoredQueue } from "@/lib/now-playing-storage";
import { afterEach, describe, expect, it } from "vitest";

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
