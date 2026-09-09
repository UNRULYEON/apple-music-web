// @vitest-environment happy-dom
import { SidebarToggle } from "@/components/sidebar-toggle";
import { SidebarProvider } from "@/contexts";
import { useSidebar } from "@/hooks";
import { TRANSITION_SLOW } from "@/lib/motion";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PEEK = '[data-slot="sidebar-peek"]';

function stubViewport({ mobile }: { mobile: boolean }) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: mobile ? query.includes("max-width") : query.includes("min-width"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

beforeEach(() => {
  vi.useFakeTimers();
  stubViewport({ mobile: false });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function renderToggle() {
  const seen: { current?: ReturnType<typeof useSidebar> } = {};

  function Probe() {
    seen.current = useSidebar();
    return null;
  }

  render(
    <SidebarProvider>
      <Probe />
      <SidebarToggle />
    </SidebarProvider>,
  );

  return seen;
}

function runCloseAnimation() {
  act(() => vi.advanceTimersByTime(TRANSITION_SLOW.duration * 1000));
}

describe("SidebarToggle", () => {
  it("hides the peek zone while the sidebar slides shut", () => {
    const seen = renderToggle();

    act(() => seen.current?.setOpen(false));

    expect(document.querySelector(PEEK)).toBeNull();
  });

  it("shows the peek zone once the sidebar is shut", () => {
    const seen = renderToggle();

    act(() => seen.current?.setOpen(false));
    runCloseAnimation();

    expect(document.querySelector(PEEK)).not.toBeNull();
  });

  it("keeps the peek zone away on a small screen", () => {
    stubViewport({ mobile: true });

    const seen = renderToggle();

    act(() => seen.current?.setOpen(false));
    runCloseAnimation();

    expect(document.querySelector(PEEK)).toBeNull();
  });

  it("takes the peek zone away again when the sidebar opens", () => {
    const seen = renderToggle();

    act(() => seen.current?.setOpen(false));
    runCloseAnimation();
    act(() => seen.current?.setOpen(true));

    expect(document.querySelector(PEEK)).toBeNull();
  });
});
