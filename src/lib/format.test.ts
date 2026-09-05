import { describe, expect, it } from "vitest";
import { albumDuration, releaseYear, songDuration } from "@/lib/format";
import type { Song } from "@/lib/music-kit/album";

function song(durationInMillis?: number): Song {
  return { id: "1", name: "Forecast", durationInMillis };
}

describe("releaseYear", () => {
  it("keeps only the year", () => {
    expect(releaseYear("2023-03-31")).toBe("2023");
  });

  it("reads the date in the local time zone", () => {
    expect(releaseYear("2023-01-01")).toBe("2023");
    expect(releaseYear("2023-12-31")).toBe("2023");
  });
});

describe("songDuration", () => {
  it("writes minutes and seconds", () => {
    expect(songDuration(204000)).toBe("3:24");
  });

  it("fills the seconds to two digits", () => {
    expect(songDuration(185000)).toBe("3:05");
  });

  it("keeps the minutes at zero for less than one minute", () => {
    expect(songDuration(45000)).toBe("0:45");
    expect(songDuration(5000)).toBe("0:05");
  });

  it("gives zero for no time", () => {
    expect(songDuration(0)).toBe("0:00");
  });

  it("rounds to the nearest second", () => {
    expect(songDuration(59600)).toBe("1:00");
  });
});

describe("albumDuration", () => {
  it("adds the songs together", () => {
    expect(albumDuration([song(204000), song(185000), song(45000)])).toBe("7:14");
  });

  it("ignores a song without a duration", () => {
    expect(albumDuration([song(204000), song()])).toBe("3:24");
  });

  it("gives zero for an album without songs", () => {
    expect(albumDuration([])).toBe("0:00");
  });
});
