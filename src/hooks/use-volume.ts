import { FULL_VOLUME, readVolume, setVolume } from "@/lib/music-kit/volume";
import { reportPlaybackProblem } from "@/lib/player/report";
import { useCallback, useEffect, useState } from "react";

export interface VolumeControl {
  volume: number;
  change: (volume: number) => void;
}

// the volume belongs to this tab alone, so it lives in the page and not in the account
export function useVolume(): VolumeControl {
  const [volume, hold] = useState(FULL_VOLUME);

  useEffect(() => {
    void readVolume().then(hold);
  }, []);

  const change = useCallback((next: number) => {
    hold(next);

    void setVolume(next).catch(reportPlaybackProblem);
  }, []);

  return { volume, change };
}
