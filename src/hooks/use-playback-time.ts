import { seekTo } from "@/lib/music-kit/playback";
import {
  readInitialPlaybackTime,
  readPlaybackTime,
  subscribeToPlaybackTime,
} from "@/lib/music-kit/playback-time";
import { reportPlaybackProblem } from "@/lib/player/report";
import { useCallback, useSyncExternalStore } from "react";

export function usePlaybackTime() {
  const { position, duration } = useSyncExternalStore(
    subscribeToPlaybackTime,
    readPlaybackTime,
    readInitialPlaybackTime,
  );

  const seek = useCallback((seconds: number) => {
    void seekTo(seconds).catch(reportPlaybackProblem);
  }, []);

  return { position, duration, seek };
}
