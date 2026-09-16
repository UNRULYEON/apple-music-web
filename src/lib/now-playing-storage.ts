import type { QueueSource } from "@/lib/music-kit/playback";

const STORAGE_KEY = "now-playing";

export interface StoredQueue {
  songs: string[];
  index: number;
  source?: QueueSource;
  position?: number;
}

export function readStoredQueue(): StoredQueue | undefined {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    return stored ? asQueue(JSON.parse(stored)) : undefined;
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

function write(queue: StoredQueue): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

export function forgetStoredQueue(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function asQueue(value: unknown): StoredQueue | undefined {
  if (typeof value !== "object" || value === null) {
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
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const { type, id } = value as Partial<QueueSource>;

  return typeof type === "string" && typeof id === "string"
    ? ({ type, id } as QueueSource)
    : undefined;
}
