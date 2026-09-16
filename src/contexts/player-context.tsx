import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuthStatus } from "@/lib/music-kit/auth";
import {
  changeToIndex,
  clearPlayback,
  pausePlayback,
  type PlayOptions,
  playSongs,
  queueLast,
  queueNext,
  type QueueSource,
  queueWithoutPlaying,
  resumePlayback,
  seekTo,
  setRepeatMode,
  setShuffleMode,
  silenceKnownRejections,
  playStation as startStation,
  subscribeToPlaybackErrors,
} from "@/lib/music-kit/playback";
import {
  dropPlaybackTime,
  holdPlaybackTime,
  readHeldPlaybackTime,
  readPlaybackTime,
  subscribeToPlaybackTime,
} from "@/lib/music-kit/playback-time";
import {
  nextRepeatMode,
  type PlayerState,
  readInitialPlayerState,
  readPlayerState,
  subscribeToPlayer,
} from "@/lib/music-kit/player-state";
import type { Song } from "@/lib/music-kit/track";
import {
  showNowPlaying,
  showPlaybackState,
  showPosition,
  subscribeToMediaKeys,
} from "@/lib/player/media-session";
import { notifySong } from "@/lib/player/notify";
import { reportPlaybackProblem } from "@/lib/player/report";
import {
  forgetStoredQueue,
  readStoredQueue,
  writeStoredPosition,
  writeStoredQueue,
} from "@/lib/storage/now-playing";

export type PlayerContextType = PlayerState & {
  source?: QueueSource;
  play: (songs: Song[], options?: PlayOptions) => void;
  playStation: (id: string) => void;
  playNext: (songs: Song[]) => void;
  addToQueue: (songs: Song[]) => void;
  next: () => void;
  previous: () => void;
  toggle: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  close: () => void;
};

const SKIP_SETTLE = 150;

const REBUILD_GAP = 5000;

const STARTING_LIMIT = 20_000;

const GIVE_BACK = 3000;

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeToPlayer, readPlayerState, readInitialPlayerState);
  const { index, queue, isPlaying, isLoading, isShuffled, repeat } = state;
  const status = useAuthStatus();

  const [wanted, setWanted] = useState<number | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [wantsSound, setWantsSound] = useState(false);

  const [source, setSource] = useState<QueueSource | undefined>(undefined);

  const [isStarting, setIsStarting] = useState(false);
  const startingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startsSoon = useCallback(() => {
    setIsStarting(true);
    clearTimeout(startingTimer.current);
    startingTimer.current = setTimeout(() => setIsStarting(false), STARTING_LIMIT);
  }, []);

  const startsNoMore = useCallback(() => {
    setIsStarting(false);
    clearTimeout(startingTimer.current);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startsNoMore();
    }
  }, [isPlaying, startsNoMore]);

  useEffect(() => {
    if (!wantsSound && isPlaying) {
      void pausePlayback().catch(() => undefined);
    }
  }, [isPlaying, wantsSound]);

  useEffect(() => () => clearTimeout(startingTimer.current), []);

  useEffect(() => {
    if (wanted === index) {
      setWanted(undefined);
    }
  }, [index, wanted]);

  const [isRestored, setIsRestored] = useState(false);

  const pending = useRef<{ index: number } | undefined>(undefined);
  const giveBack = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (status !== "signed-in" || isRestored) {
      return;
    }

    setIsRestored(true);

    const stored = readStoredQueue();

    if (!stored) {
      return;
    }

    setSource(stored.source);

    if (queue.length > 0) {
      return;
    }

    if (stored.position) {
      pending.current = { index: stored.index };
      holdPlaybackTime(stored.position);
    }

    void queueWithoutPlaying(stored.songs, stored.index).catch(() => {
      pending.current = undefined;
      dropPlaybackTime();
      setSource(undefined);
      forgetStoredQueue();
    });
  }, [isRestored, queue.length, status]);

  useEffect(() => {
    const place = pending.current;
    const held = readHeldPlaybackTime();

    if (!isPlaying || !place) {
      return;
    }

    pending.current = undefined;

    if (place.index !== index || held === undefined) {
      dropPlaybackTime();
      return;
    }

    void seekTo(held)
      .catch(() => undefined)
      .finally(() => {
        giveBack.current = setTimeout(dropPlaybackTime, GIVE_BACK);
      });
  }, [index, isPlaying]);

  useEffect(() => {
    if (status !== "signed-in") {
      return;
    }

    let written = 0;

    return subscribeToPlaybackTime(() => {
      const seconds = Math.floor(readPlaybackTime().position);

      if (seconds === 0 || seconds === written) {
        return;
      }

      written = seconds;
      writeStoredPosition(seconds);
    });
  }, [status]);

  useEffect(() => {
    if (status !== "signed-out") {
      return;
    }

    pending.current = undefined;
    dropPlaybackTime();
    setSource(undefined);
    setWanted(undefined);
    setWantsSound(false);
    setIsRestored(false);
    startsNoMore();

    void clearPlayback().catch(() => undefined);
  }, [startsNoMore, status]);

  useEffect(() => {
    if (queue.length === 0 || (!isRestored && !source)) {
      return;
    }

    writeStoredQueue({ songs: queue.map((song) => song.playId ?? song.id), index, source });
  }, [index, isRestored, queue, source]);

  const asked = useRef(false);
  const sounding = useRef<string>(undefined);
  const song = queue[wanted ?? index] ?? state.nowPlaying;
  const songId = song?.playId ?? song?.id;

  useEffect(() => {
    const before = sounding.current;

    if (songId === undefined) {
      sounding.current = undefined;
      return;
    }

    if (before === songId) {
      return;
    }

    sounding.current = songId;

    const wasAsked = asked.current;

    asked.current = false;

    if (before === undefined || wasAsked || !song) {
      return;
    }

    notifySong(song);
  }, [song, songId]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => () => clearTimeout(giveBack.current), []);

  useEffect(silenceKnownRejections, []);

  const latest = useRef({ queue, index });
  latest.current = { queue, index };
  const rebuiltAt = useRef(0);

  const rebuild = useCallback(() => {
    const now = Date.now();

    if (now - rebuiltAt.current < REBUILD_GAP) {
      return;
    }

    rebuiltAt.current = now;

    const { queue: songs, index: at } = latest.current;

    if (songs.length === 0) {
      return;
    }

    void playSongs(songs, { startAt: at }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let dropped = false;

    void subscribeToPlaybackErrors({
      onError: reportPlaybackProblem,
      onSessionBroken: rebuild,
    })
      .then((unsubscribe) => {
        if (dropped) {
          unsubscribe();
          return;
        }

        stop = unsubscribe;
      })
      .catch(() => undefined);

    return () => {
      dropped = true;
      stop?.();
    };
  }, [rebuild]);

  const play: PlayerContextType["play"] = useCallback(
    (songs, options) => {
      pending.current = undefined;
      asked.current = true;
      dropPlaybackTime();
      setSource(options?.from);
      setWantsSound(true);
      startsSoon();

      void playSongs(songs, options).catch((cause: unknown) => {
        startsNoMore();
        reportPlaybackProblem(cause);
      });
    },
    [startsNoMore, startsSoon],
  );

  const playStation: PlayerContextType["playStation"] = useCallback(
    (id) => {
      pending.current = undefined;
      asked.current = true;
      dropPlaybackTime();
      setSource(undefined);
      setWantsSound(true);
      startsSoon();

      void startStation(id).catch((cause: unknown) => {
        startsNoMore();
        reportPlaybackProblem(cause);
      });
    },
    [startsNoMore, startsSoon],
  );

  const playNext: PlayerContextType["playNext"] = useCallback((songs) => {
    void queueNext(songs).catch(reportPlaybackProblem);
  }, []);

  const addToQueue: PlayerContextType["addToQueue"] = useCallback((songs) => {
    void queueLast(songs).catch(reportPlaybackProblem);
  }, []);

  const step = useCallback(
    (delta: number) => {
      const last = queue.length - 1;

      if (last < 0) {
        return;
      }

      const to = (wanted ?? index) + delta;

      if (to > last && repeat !== "queue") {
        return;
      }

      const target = to > last ? 0 : to < 0 ? (repeat === "queue" ? last : 0) : to;

      setWanted(target);
      setWantsSound(true);
      asked.current = true;
      startsSoon();
      clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        void changeToIndex(target).catch(() => undefined);
      }, SKIP_SETTLE);
    },
    [index, queue.length, repeat, startsSoon, wanted],
  );

  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);

  const toggle = useCallback(() => {
    if (wantsSound) {
      setWantsSound(false);
      startsNoMore();

      void pausePlayback().catch(reportPlaybackProblem);
      return;
    }

    setWantsSound(true);
    startsSoon();

    void resumePlayback().catch((cause: unknown) => {
      setWantsSound(false);
      startsNoMore();
      reportPlaybackProblem(cause);
    });
  }, [startsNoMore, startsSoon, wantsSound]);

  useEffect(() => {
    showNowPlaying(song);
  }, [song]);

  useEffect(() => {
    showPlaybackState(wantsSound && isPlaying, song !== undefined);
  }, [isPlaying, song, wantsSound]);

  useEffect(
    () =>
      subscribeToMediaKeys({
        play: () => !wantsSound && toggle(),
        pause: () => wantsSound && toggle(),
        next,
        previous,
        seek: (to) => void seekTo(to).catch(reportPlaybackProblem),
      }),
    [next, previous, toggle, wantsSound],
  );

  useEffect(() => {
    let written = -1;

    return subscribeToPlaybackTime(() => {
      const { position, duration } = readPlaybackTime();
      const second = Math.floor(position);

      if (second === written) {
        return;
      }

      written = second;
      showPosition(position, duration);
    });
  }, [song]);

  const close = useCallback(() => {
    pending.current = undefined;
    dropPlaybackTime();
    setSource(undefined);
    setWanted(undefined);
    setWantsSound(false);
    startsNoMore();

    void clearPlayback()
      .catch(() => undefined)
      .finally(forgetStoredQueue);
  }, [startsNoMore]);

  const toggleShuffle = useCallback(() => {
    void setShuffleMode(!isShuffled).catch(reportPlaybackProblem);
  }, [isShuffled]);

  const cycleRepeat = useCallback(() => {
    void setRepeatMode(nextRepeatMode(repeat)).catch(reportPlaybackProblem);
  }, [repeat]);

  const shown = wanted ?? index;

  const value = useMemo<PlayerContextType>(
    () => ({
      ...state,
      source,
      index: shown,
      nowPlaying: queue[shown] ?? state.nowPlaying,
      upNext: queue.slice(shown + 1),
      isPlaying: wantsSound && isPlaying,
      isLoading: wantsSound && !isPlaying && (isLoading || isStarting),
      play,
      playStation,
      playNext,
      addToQueue,
      next,
      previous,
      toggle,
      toggleShuffle,
      cycleRepeat,
      close,
    }),
    [
      addToQueue,
      close,
      cycleRepeat,
      isStarting,
      next,
      play,
      playNext,
      playStation,
      previous,
      queue,
      shown,
      source,
      state,
      toggle,
      toggleShuffle,
      wantsSound,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
