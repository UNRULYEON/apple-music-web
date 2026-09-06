import { toastManager } from "@/components/ui/toast";
import { MissingDrmError, NO_DRM_DESCRIPTION, NO_DRM_TITLE } from "@/lib/music-kit/drm";

const TOAST_ID = "playback-problem";
const DRM_TOAST_ID = "missing-drm";

export function reportMissingDrm(): void {
  toastManager.add({
    id: DRM_TOAST_ID,
    type: "error",
    title: NO_DRM_TITLE,
    description: NO_DRM_DESCRIPTION,
    timeout: 0,
    data: { noSwipe: true },
  });
}

export function reportPlaybackProblem(cause: unknown): void {
  if (cause instanceof MissingDrmError) {
    reportMissingDrm();
    return;
  }

  const description =
    typeof cause === "string"
      ? cause
      : cause instanceof Error
        ? cause.message
        : "Apple Music gave no reason.";

  toastManager.add({
    id: TOAST_ID,
    type: "error",
    title: "This song did not play",
    description,
    timeout: 0,
    data: { noSwipe: true },
  });
}
