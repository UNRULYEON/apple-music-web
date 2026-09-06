import type { Song } from "@/lib/music-kit/track";

const REPEAT_MODES = ["off", "queue", "song"] as const;

export type RepeatMode = (typeof REPEAT_MODES)[number];

export interface Queue {
  source: Song[];
  songs: Song[];
  index: number;
}

export interface PlayOptions {
  startAt?: number;
  shuffle?: boolean;
}

export const EMPTY_QUEUE: Queue = { source: [], songs: [], index: 0 };

export function buildQueue(
  songs: Song[],
  { startAt = 0, shuffle = false }: PlayOptions = {},
): Queue {
  const start = startAt >= 0 && startAt < songs.length ? startAt : 0;
  const queue: Queue = { source: [...songs], songs: [...songs], index: start };

  return shuffle ? setShuffle(queue, true) : queue;
}

export function setShuffle(queue: Queue, shuffle: boolean): Queue {
  const current = queue.songs[queue.index];

  if (!current) {
    return queue;
  }

  if (shuffle) {
    const rest = queue.songs.filter((_, i) => i !== queue.index);

    return { ...queue, songs: [current, ...shuffled(rest)], index: 0 };
  }

  return { ...queue, songs: [...queue.source], index: Math.max(queue.source.indexOf(current), 0) };
}

export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  const next = REPEAT_MODES[REPEAT_MODES.indexOf(mode) + 1];

  return next ?? "off";
}

export function shuffled(songs: Song[]): Song[] {
  const result = [...songs];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j] as Song, result[i] as Song];
  }

  return result;
}

export function insertAfter(queue: Queue, songs: Song[]): Queue {
  const at = queue.index + 1;

  return {
    source: [...queue.source, ...songs],
    songs: [...queue.songs.slice(0, at), ...songs, ...queue.songs.slice(at)],
    index: queue.index,
  };
}

export function append(queue: Queue, songs: Song[]): Queue {
  return { ...queue, source: [...queue.source, ...songs], songs: [...queue.songs, ...songs] };
}
