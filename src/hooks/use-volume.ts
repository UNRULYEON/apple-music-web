import { useCallback, useEffect, useState } from "react";
import { FULL_VOLUME, readVolume, setVolume } from "@/lib/music-kit/volume";
import { reportPlaybackProblem } from "@/lib/player/report";
import { readStoredVolume, writeStoredVolume } from "@/lib/volume-storage";

export interface VolumeControl {
  volume: number;
  change: (volume: number) => void;
}

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
