import { reportPlaybackProblem } from "@/lib/player/report";
import {
  changeToIndex,
  pausePlayback,
  playSongs,
  queueLast,
  queueNext,
  resumePlayback,
  setRepeatMode,
  setShuffleMode,
  silenceKnownRejections,
  subscribeToPlaybackErrors,
  type PlayOptions,
} from "@/lib/music-kit/playback";
import {
  nextRepeatMode,
  readInitialPlayerState,
  readPlayerState,
  subscribeToPlayer,
  type PlayerState,
} from "@/lib/music-kit/player-state";
import type { Song } from "@/lib/music-kit/track";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type PlayerContextType = PlayerState & {
  play: (songs: Song[], options?: PlayOptions) => void;
  playNext: (songs: Song[]) => void;
  addToQueue: (songs: Song[]) => void;
  next: () => void;
  previous: () => void;
  toggle: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

// long enough to gather a burst of taps, short enough that one tap still feels direct
const SKIP_SETTLE = 150;

// a broken session is built again at most this often, so a song that always fails
// cannot put the app in a loop
const REBUILD_GAP = 5000;

// how long the button waits for a song that was asked for before it gives up on it
const STARTING_LIMIT = 20_000;

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeToPlayer, readPlayerState, readInitialPlayerState);
  const { index, queue, isPlaying, isLoading, isShuffled, repeat } = state;

  // where the taps have asked to go, which runs ahead of where MusicKit has arrived
  const [wanted, setWanted] = useState<number | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // what the person asked for. MusicKit keeps loading a song after a pause and plays
  // it when it is ready, so the app holds the wish itself and puts MusicKit back.
  const [wantsSound, setWantsSound] = useState(false);

  // a song was asked for and has not started yet. MusicKit passes through stopped on
  // the way, where it is neither playing nor loading, and the button must not read
  // that moment as "paused" and show a play icon in the middle of a skip.
  const [isStarting, setStarting] = useState(false);
  const startingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startsSoon = useCallback(() => {
    setStarting(true);
    clearTimeout(startingTimer.current);
    startingTimer.current = setTimeout(() => setStarting(false), STARTING_LIMIT);
  }, []);

  const startsNoMore = useCallback(() => {
    setStarting(false);
    clearTimeout(startingTimer.current);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startsNoMore();
    }
  }, [isPlaying, startsNoMore]);

  // the song finished loading and MusicKit started it, though nobody asked it to
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

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(silenceKnownRejections, []);

  // the newest queue and place in it, for the rebuild, which must not hold an old one
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
      setWantsSound(true);
      startsSoon();

      void playSongs(songs, options).catch((cause: unknown) => {
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

      // the bar follows the taps at once, while only the song a person lands on is
      // fetched. Every song opened on the way would ask Apple for a key and then
      // drop it half way, which is what makes MusicKit complain about the key.
      setWanted(target);
      setWantsSound(true);
      startsSoon();
      clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        // a skip that does not land is not something a person needs told
        void changeToIndex(target).catch(() => undefined);
      }, SKIP_SETTLE);
    },
    [index, queue.length, repeat, startsSoon, wanted],
  );

  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);

  // a tap while the song loads gives up on it, so a person is never stuck watching it
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
      index: shown,
      nowPlaying: queue[shown] ?? state.nowPlaying,
      upNext: queue.slice(shown + 1),
      // a person who has paused is shown a paused player, whatever MusicKit is
      // busy with behind it
      isPlaying: wantsSound && isPlaying,
      isLoading: wantsSound && !isPlaying && (isLoading || isStarting),
      play,
      playNext,
      addToQueue,
      next,
      previous,
      toggle,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      addToQueue,
      cycleRepeat,
      isStarting,
      next,
      play,
      playNext,
      previous,
      queue,
      shown,
      state,
      toggle,
      toggleShuffle,
      wantsSound,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
