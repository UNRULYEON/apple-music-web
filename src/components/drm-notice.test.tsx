// @vitest-environment happy-dom
import { DrmNotice, NOTICE_DELAY } from "@/components/drm-notice";
import { ToastProvider } from "@/components/ui/toast";
import { hasDrm } from "@/lib/music-kit/drm";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/drm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/drm")>()),
  hasDrm: vi.fn(),
}));

const check = vi.mocked(hasDrm);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

function renderNotice() {
  render(
    <ToastProvider position="top-center">
      <DrmNotice />
    </ToastProvider>,
  );
}

describe("DrmNotice", () => {
  it("says nothing while the browser can play Apple Music", async () => {
    check.mockResolvedValue(true);

    renderNotice();
    await settle();

    act(() => vi.advanceTimersByTime(NOTICE_DELAY));

    expect(check).toHaveBeenCalled();
    expect(screen.queryByText(/cannot play Apple Music/)).toBeNull();
  });

  it("waits before it tells a person that the browser gives no DRM", async () => {
    check.mockResolvedValue(false);

    renderNotice();
    await settle();

    expect(screen.queryByText("This browser cannot play Apple Music")).toBeNull();

    act(() => vi.advanceTimersByTime(NOTICE_DELAY));

    expect(screen.getByText("This browser cannot play Apple Music")).toBeTruthy();
    expect(screen.getByText(/DRM/)).toBeTruthy();
  });
});
