import { FULL_VOLUME, readVolume, setVolume } from "@/lib/music-kit/volume";
import { reportPlaybackProblem } from "@/lib/player/report";
import { readStoredVolume, writeStoredVolume } from "@/lib/volume-storage";
import { useCallback, useEffect, useState } from "react";

export interface VolumeControl {
  volume: number;
  change: (volume: number) => void;
}

// the volume belongs to this tab alone, so it lives in the browser and not in the
// account. The level a person left behind is put on the player again when they come
// back, and MusicKit is asked only when the browser holds nothing.
export function useVolume(): VolumeControl {
  const [volume, hold] = useState(FULL_VOLUME);

  useEffect(() => {
    const stored = readStoredVolume();

    if (stored === undefined) {
      void readVolume().then(hold);
      return;
    }

    hold(stored);
    void setVolume(stored).catch(reportPlaybackProblem);
  }, []);

  const change = useCallback((next: number) => {
    hold(next);
    writeStoredVolume(next);

    void setVolume(next).catch(reportPlaybackProblem);
  }, []);

  return { volume, change };
}
