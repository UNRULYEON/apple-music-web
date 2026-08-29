import { afterEach, describe, expect, it, vi } from "vitest";

// The shared setup mocks this module for every other test, so reach past it here.
const { readDeveloperToken } =
  await vi.importActual<typeof import("./developer-token.ts")>("./developer-token.ts");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("readDeveloperToken", () => {
  it("returns the token from the environment", () => {
    vi.stubEnv("MUSICKIT_DEVELOPER_TOKEN", "a-developer-token");

    expect(readDeveloperToken()).toBe("a-developer-token");
  });

  it("names the variable and the README when it is missing", () => {
    vi.stubEnv("MUSICKIT_DEVELOPER_TOKEN", undefined);

    expect(() => readDeveloperToken()).toThrow(
      "MUSICKIT_DEVELOPER_TOKEN is not set. See the MusicKit setup in README.md.",
    );
  });

  it("treats an empty value as missing", () => {
    vi.stubEnv("MUSICKIT_DEVELOPER_TOKEN", "");

    expect(() => readDeveloperToken()).toThrow("is not set");
  });
});
