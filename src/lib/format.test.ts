import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { relativeDate, totalDuration, releaseYear, songDuration } from "@/lib/format";
import type { Song } from "@/lib/music-kit/track";
import { intlFormat, parseISO } from "date-fns";

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

describe("relativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes the distance for a date within the last month", () => {
    expect(relativeDate("2026-09-05T09:00:00Z")).toBe("about 3 hours ago");
    expect(relativeDate("2026-08-31T12:00:00Z")).toBe("5 days ago");
    expect(relativeDate("2026-08-20T12:00:00Z")).toBe("16 days ago");
  });

  it("writes the date itself for more than a month ago", () => {
    expect(relativeDate("2026-07-04T12:00:00Z")).toBe(intlFormat(parseISO("2026-07-04T12:00:00Z")));
  });

  it("keeps the distance at the one month edge", () => {
    expect(relativeDate("2026-08-05T12:00:00Z")).toBe("about 1 month ago");
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

describe("totalDuration", () => {
  it("adds the songs together", () => {
    expect(totalDuration([song(204000), song(185000), song(45000)])).toBe("7 minutes");
  });

  it("ignores a song without a duration", () => {
    expect(totalDuration([song(204000), song()])).toBe("3 minutes");
  });

  it("writes seconds for less than one minute", () => {
    expect(totalDuration([song(35000)])).toBe("35 seconds");
  });

  it("writes hours and minutes for one hour or more", () => {
    expect(totalDuration([song(4560000)])).toBe("1 hour 16 minutes");
    expect(totalDuration([song(8100000)])).toBe("2 hours 15 minutes");
  });

  it("leaves out the minutes for a whole number of hours", () => {
    expect(totalDuration([song(3600000)])).toBe("1 hour");
    expect(totalDuration([song(7200000)])).toBe("2 hours");
  });

  it("keeps the unit singular for one", () => {
    expect(totalDuration([song(1000)])).toBe("1 second");
    expect(totalDuration([song(60000)])).toBe("1 minute");
  });

  it("rounds to the nearest minute, and never to sixty seconds", () => {
    expect(totalDuration([song(209000)])).toBe("3 minutes");
    expect(totalDuration([song(59600)])).toBe("1 minute");
  });

  it("gives zero for an album without songs", () => {
    expect(totalDuration([])).toBe("0 seconds");
  });
});
