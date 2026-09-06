import { toastManager } from "@/components/ui/toast";
import { hasDrm } from "@/lib/music-kit/drm";
import { useEffect } from "react";

const TOAST_ID = "missing-drm";

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

      timer = setTimeout(() => {
        toastManager.add({
          id: TOAST_ID,
          type: "error",
          title: "This browser cannot play Apple Music",
          description:
            "To play music from Apple Music, a browser with DRM support is required. Please use a different browser that supports DRM.",
          timeout: 0,
          data: { noSwipe: true },
        });
      }, NOTICE_DELAY);
    });

    return () => {
      dropped = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
