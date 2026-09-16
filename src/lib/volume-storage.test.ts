import { afterEach, describe, expect, it } from "vitest";
// @vitest-environment happy-dom
import { forgetStoredVolume, readStoredVolume, writeStoredVolume } from "@/lib/volume-storage";

const KEY = "volume";

afterEach(() => {
  localStorage.clear();
});

describe("readStoredVolume", () => {
  it("gives back the level a person left behind", () => {
    writeStoredVolume(0.25);

    expect(readStoredVolume()).toBe(0.25);
  });

  it("gives back nothing when the browser holds no level", () => {
    expect(readStoredVolume()).toBeUndefined();
  });

  it("gives back nothing for what is not a level", () => {
    localStorage.setItem(KEY, "loud");

    expect(readStoredVolume()).toBeUndefined();
  });

  it("gives back nothing for a level outside the scale", () => {
    localStorage.setItem(KEY, "4");

    expect(readStoredVolume()).toBeUndefined();
  });

  it("takes silence as a level of its own", () => {
    writeStoredVolume(0);

    expect(readStoredVolume()).toBe(0);
  });
});

describe("forgetStoredVolume", () => {
  it("takes the level out of the browser", () => {
    writeStoredVolume(0.5);

    forgetStoredVolume();

    expect(readStoredVolume()).toBeUndefined();
  });
});
