import { chunk, columnCount, gapFor, sameMetrics } from "@/components/media-grid";
import { describe, expect, it } from "vitest";

// what the css grid drew: repeat(auto-fill, minmax(min(13rem, 50% - 1rem), 1fr))
function cssColumns(width: number): number {
  const gap = gapFor(width);
  const smallest = Math.min(208, width / 2 - 16);
  let columns = 1;

  while (smallest * (columns + 1) + gap * columns <= width) {
    columns += 1;
  }

  return columns;
}

describe("columnCount", () => {
  it.each([300, 400, 500, 600, 700, 768, 900, 1200, 1600, 2400])(
    "draws the same columns the css grid drew at %ipx",
    (width) => {
      expect(columnCount(width)).toBe(cssColumns(width));
    },
  );

  it("asks for one column before the grid is measured", () => {
    expect(columnCount(0)).toBe(1);
  });

  it("never asks for less than one column", () => {
    expect(columnCount(10)).toBeGreaterThanOrEqual(1);
  });
});

describe("gapFor", () => {
  it("holds the tiles further apart on a wide grid", () => {
    expect(gapFor(1200)).toBeGreaterThan(gapFor(400));
  });
});

describe("chunk", () => {
  it("cuts the items into rows", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("gives back no row for no items", () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("sameMetrics", () => {
  it("holds still when only the height of the grid moved", () => {
    expect(sameMetrics({ width: 800, scrollMargin: 0 }, { width: 800, scrollMargin: 0 })).toBe(
      true,
    );
  });

  it("takes a new width", () => {
    expect(sameMetrics({ width: 800, scrollMargin: 0 }, { width: 640, scrollMargin: 0 })).toBe(
      false,
    );
  });

  it("takes a new place in the scroll area", () => {
    expect(sameMetrics({ width: 800, scrollMargin: 0 }, { width: 800, scrollMargin: 48 })).toBe(
      false,
    );
  });
});
