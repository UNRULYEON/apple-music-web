import { hasDrm } from "@/lib/music-kit/drm";
import { reportMissingDrm } from "@/lib/player/report";
import { useEffect } from "react";

// let the app settle before the bad news
export const NOTICE_DELAY = 3000;

export function DrmNotice(): null {
  useEffect(() => {
    let dropped = false;
    let timer: ReturnType<typeof setTimeout>;

    void hasDrm().then((supported) => {
      if (dropped || supported) {
        return;
      }

      timer = setTimeout(reportMissingDrm, NOTICE_DELAY);
    });

    return () => {
      dropped = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
