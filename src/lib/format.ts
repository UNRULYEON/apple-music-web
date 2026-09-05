import type { Song } from "@/lib/music-kit/album";
import { format, parseISO } from "date-fns";

const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export function releaseYear(releaseDate: string): string {
  return format(parseISO(releaseDate), "yyyy");
}

export function songDuration(durationInMillis: number): string {
  const seconds = Math.round(durationInMillis / MILLIS_PER_SECOND);
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(2, "0");

  return `${minutes}:${rest}`;
}

export function albumDuration(songs: Song[]): string {
  return songDuration(songs.reduce((total, song) => total + (song.durationInMillis ?? 0), 0));
}
