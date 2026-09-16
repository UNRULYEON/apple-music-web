import { useEffect } from "react";
import { hasDrm } from "@/lib/music-kit/drm";
import { reportMissingDrm } from "@/lib/player/report";

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
