import type { Song } from "@/lib/music-kit/track";
import {
  append,
  buildQueue,
  EMPTY_QUEUE,
  insertAfter,
  nextRepeatMode,
  setShuffle,
  type PlayOptions,
  type Queue,
  type RepeatMode,
} from "@/lib/player/queue";
import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

export type PlayerContextType = {
  queue: Song[];
  index: number;
  nowPlaying?: Song;
  upNext: Song[];
  isPlaying: boolean;
  isShuffled: boolean;
  repeat: RepeatMode;
  play: (songs: Song[], options?: PlayOptions) => void;
  playNext: (songs: Song[]) => void;
  addToQueue: (songs: Song[]) => void;
  next: () => void;
  previous: () => void;
  toggle: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  clear: () => void;
};

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Queue>(EMPTY_QUEUE);
  const [isPlaying, setPlaying] = useState(false);
  const [isShuffled, setShuffled] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  const play: PlayerContextType["play"] = useCallback(
    (songs, options) => {
      const shuffle = options?.shuffle ?? isShuffled;
      const next = buildQueue(songs, { ...options, shuffle });

      setQueue(next);
      setShuffled(shuffle);
      setPlaying(next.songs.length > 0);
    },
    [isShuffled],
  );

  const playNext: PlayerContextType["playNext"] = useCallback(
    (songs) => {
      if (queue.songs.length === 0) {
        play(songs);
        return;
      }

      setQueue(insertAfter(queue, songs));
    },
    [play, queue],
  );

  const addToQueue: PlayerContextType["addToQueue"] = useCallback(
    (songs) => {
      if (queue.songs.length === 0) {
        play(songs);
        return;
      }

      setQueue(append(queue, songs));
    },
    [play, queue],
  );

  const next = useCallback(() => {
    if (repeat === "song") {
      return;
    }

    if (queue.index + 1 < queue.songs.length) {
      setQueue({ ...queue, index: queue.index + 1 });
      return;
    }

    if (repeat === "off") {
      setPlaying(false);
      return;
    }

    setQueue({ ...queue, index: 0 });
  }, [queue, repeat]);

  const previous = useCallback(() => {
    if (repeat === "song") {
      return;
    }

    if (queue.index > 0) {
      setQueue({ ...queue, index: queue.index - 1 });
      return;
    }

    if (repeat !== "off") {
      setQueue({ ...queue, index: Math.max(queue.songs.length - 1, 0) });
    }
  }, [queue, repeat]);

  const toggle = useCallback(() => {
    setPlaying((current) => !current && queue.songs.length > 0);
  }, [queue.songs.length]);

  const toggleShuffle = useCallback(() => {
    setShuffled(!isShuffled);
    setQueue((current) => setShuffle(current, !isShuffled));
  }, [isShuffled]);

  const cycleRepeat = useCallback(() => {
    setRepeat(nextRepeatMode);
  }, []);

  const clear = useCallback(() => {
    setQueue(EMPTY_QUEUE);
    setPlaying(false);
  }, []);

  const value = useMemo<PlayerContextType>(
    () => ({
      queue: queue.songs,
      index: queue.index,
      nowPlaying: queue.songs[queue.index],
      upNext: queue.songs.slice(queue.index + 1),
      isPlaying,
      isShuffled,
      repeat,
      play,
      playNext,
      addToQueue,
      next,
      previous,
      toggle,
      toggleShuffle,
      cycleRepeat,
      clear,
    }),
    [
      addToQueue,
      clear,
      cycleRepeat,
      isPlaying,
      isShuffled,
      next,
      play,
      playNext,
      previous,
      queue,
      repeat,
      toggle,
      toggleShuffle,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
