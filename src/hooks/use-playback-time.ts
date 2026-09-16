import { useCallback, useSyncExternalStore } from "react";
import { seekTo } from "@/lib/music-kit/playback";
import {
  holdPlaybackTime,
  readHeldPlaybackTime,
  readInitialPlaybackTime,
  readPlaybackTime,
  subscribeToPlaybackTime,
} from "@/lib/music-kit/playback-time";
import { reportPlaybackProblem } from "@/lib/player/report";

export function usePlaybackTime() {
  const { position, duration } = useSyncExternalStore(
    subscribeToPlaybackTime,
    readPlaybackTime,
    readInitialPlaybackTime,
  );

  const seek = useCallback((seconds: number) => {
    if (readHeldPlaybackTime() !== undefined) {
      holdPlaybackTime(seconds);
    }

    void seekTo(seconds).catch(reportPlaybackProblem);
  }, []);

  return { position, duration, seek };
}
