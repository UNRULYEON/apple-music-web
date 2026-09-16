import { useCallback, useEffect, useState } from "react";
import { applyVolume, fetchVolume, FULL_VOLUME } from "@/lib/music-kit/volume";
import { reportPlaybackProblem } from "@/lib/player/report";
import { readStoredVolume, writeStoredVolume } from "@/lib/storage/volume";

export interface VolumeControl {
  volume: number;
  change: (volume: number) => void;
}

export function useVolume(): VolumeControl {
  const [volume, setVolume] = useState(FULL_VOLUME);

  useEffect(() => {
    const stored = readStoredVolume();

    if (stored === undefined) {
      void fetchVolume().then(setVolume);
      return;
    }

    setVolume(stored);
    void applyVolume(stored).catch(reportPlaybackProblem);
  }, []);

  const change = useCallback((next: number) => {
    setVolume(next);
    writeStoredVolume(next);

    void applyVolume(next).catch(reportPlaybackProblem);
  }, []);

  return { volume, change };
}
