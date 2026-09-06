import { toastManager } from "@/components/ui/toast";

const TOAST_ID = "playback-problem";

export function reportPlaybackProblem(cause: unknown): void {
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
