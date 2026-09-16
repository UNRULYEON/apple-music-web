import { afterEach, describe, expect, it, vi } from "vitest";
import { toastManager } from "@/components/ui/toast";
import { MissingDrmError } from "@/lib/music-kit/drm";
import { reportMissingDrm, reportPlaybackProblem } from "@/lib/player/report";

vi.mock("@/components/ui/toast", () => ({ toastManager: { add: vi.fn() } }));

const add = vi.mocked(toastManager.add);

afterEach(() => {
  vi.clearAllMocks();
});

function lastToast(): Record<string, unknown> {
  return add.mock.lastCall?.[0] as unknown as Record<string, unknown>;
}

describe("reportPlaybackProblem", () => {
  it("says what went wrong", () => {
    reportPlaybackProblem(new Error("Apple Music does not have that song here."));

    expect(lastToast()).toMatchObject({
      type: "error",
      title: "This song did not play",
      description: "Apple Music does not have that song here.",
    });
  });

  it("takes a reason that is only a string", () => {
    reportPlaybackProblem("The network stopped the song.");

    expect(lastToast().description).toBe("The network stopped the song.");
  });

  it("says something even when there is no reason at all", () => {
    reportPlaybackProblem(undefined);

    expect(lastToast().description).toBe("Apple Music gave no reason.");
  });

  it("goes away by itself and lets a person push it away", () => {
    reportPlaybackProblem(new Error("It broke."));

    expect(lastToast().timeout).toBeUndefined();
    expect(lastToast().data).toBeUndefined();
  });
});

describe("reportMissingDrm", () => {
  it("stays until the browser can play a song", () => {
    reportMissingDrm();

    expect(lastToast()).toMatchObject({ timeout: 0, data: { noSwipe: true } });
  });

  it("answers a missing DRM error with the DRM message", () => {
    reportPlaybackProblem(new MissingDrmError());

    expect(lastToast()).toMatchObject({ timeout: 0, data: { noSwipe: true } });
  });
});
