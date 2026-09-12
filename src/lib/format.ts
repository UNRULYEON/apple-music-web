import type { Song } from "@/lib/music-kit/track";
import { format, formatDistanceToNow, intlFormat, isBefore, parseISO, subMonths } from "date-fns";

const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export function releaseYear(releaseDate: string): string {
  return format(parseISO(releaseDate), "yyyy");
}

export function relativeDate(value: string): string {
  const date = parseISO(value);

  if (isBefore(date, subMonths(new Date(), 1))) {
    return intlFormat(date);
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

export function songDuration(durationInMillis: number): string {
  return clockTime(durationInMillis / MILLIS_PER_SECOND);
}

export function clockTime(seconds: number): string {
  const whole = Math.max(Math.round(seconds), 0);
  const minutes = Math.floor(whole / SECONDS_PER_MINUTE);
  const rest = String(whole % SECONDS_PER_MINUTE).padStart(2, "0");

  return `${minutes}:${rest}`;
}

export function totalDuration(songs: Song[]): string {
  const total = songs.reduce((sum, song) => sum + (song.durationInMillis ?? 0), 0);
  const seconds = Math.round(total / MILLIS_PER_SECOND);

  if (seconds < SECONDS_PER_MINUTE) {
    return count(seconds, "second");
  }

  const minutes = Math.round(seconds / SECONDS_PER_MINUTE);

  if (minutes < MINUTES_PER_HOUR) {
    return count(minutes, "minute");
  }

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (rest === 0) {
    return count(hours, "hour");
  }

  return `${count(hours, "hour")} ${count(rest, "minute")}`;
}

export function count(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}
