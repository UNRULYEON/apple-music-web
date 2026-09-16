import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("uses seconds below a minute", () => {
    expect(formatDuration(4_000)).toBe("4s");
  });

  it("pads the seconds above a minute", () => {
    expect(formatDuration(64_000)).toBe("1m04s");
  });

  it("keeps two digits for the seconds", () => {
    expect(formatDuration(600_000)).toBe("10m00s");
  });

  it("rounds to the nearest second", () => {
    expect(formatDuration(1_600)).toBe("2s");
  });
});
