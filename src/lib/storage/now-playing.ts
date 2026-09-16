import { isRecord } from "@/lib/is-record";
import type { QueueSource } from "@/lib/music-kit/playback";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage/local";

const STORAGE_KEY = "now-playing";

export interface StoredQueue {
  songs: string[];
  index: number;
  source?: QueueSource;
  position?: number;
}

export function readStoredQueue(): StoredQueue | undefined {
  const stored = readStorage(STORAGE_KEY);

  if (!stored) {
    return undefined;
  }

  try {
    return asQueue(JSON.parse(stored));
  } catch {
    return undefined;
  }
}

export function writeStoredQueue(queue: StoredQueue): void {
  const kept = readStoredQueue();
  const position = queue.position ?? (kept?.index === queue.index ? kept.position : undefined);

  write({ ...queue, position });
}

export function writeStoredPosition(position: number): void {
  const stored = readStoredQueue();

  if (stored) {
    write({ ...stored, position });
  }
}

export function forgetStoredQueue(): void {
  removeStorage(STORAGE_KEY);
}

function write(queue: StoredQueue): void {
  writeStorage(STORAGE_KEY, JSON.stringify(queue));
}

function asQueue(value: unknown): StoredQueue | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const { songs, index, source, position } = value as Partial<StoredQueue>;

  if (!Array.isArray(songs) || songs.some((song) => typeof song !== "string" || song === "")) {
    return undefined;
  }

  if (songs.length === 0 || !Number.isInteger(index) || index === undefined) {
    return undefined;
  }

  if (index < 0 || index >= songs.length) {
    return undefined;
  }

  return { songs, index, source: asSource(source), position: asPosition(position) };
}

function asPosition(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function asSource(value: unknown): QueueSource | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const { type, id } = value;

  return typeof type === "string" && typeof id === "string"
    ? ({ type, id } as QueueSource)
    : undefined;
}
