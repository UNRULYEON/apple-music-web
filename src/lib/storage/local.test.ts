// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { browserStorage, readStorage, removeStorage, writeStorage } from "@/lib/storage/local";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function stubBrokenStorage(): void {
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
  });
}

describe("readStorage", () => {
  it("gives back what was written", () => {
    writeStorage("key", "value");

    expect(readStorage("key")).toBe("value");
  });

  it("gives back nothing for a missing key", () => {
    expect(readStorage("key")).toBeUndefined();
  });

  it("gives back nothing when the browser blocks storage", () => {
    stubBrokenStorage();

    expect(readStorage("key")).toBeUndefined();
  });
});

describe("writeStorage", () => {
  it("does not throw when the browser blocks storage", () => {
    stubBrokenStorage();

    expect(() => writeStorage("key", "value")).not.toThrow();
  });
});

describe("removeStorage", () => {
  it("removes the key", () => {
    writeStorage("key", "value");
    removeStorage("key");

    expect(readStorage("key")).toBeUndefined();
  });

  it("does not throw when the browser blocks storage", () => {
    stubBrokenStorage();

    expect(() => removeStorage("key")).not.toThrow();
  });
});

describe("browserStorage", () => {
  it("gives the storage of the browser", () => {
    expect(browserStorage()).toBe(localStorage);
  });
});
