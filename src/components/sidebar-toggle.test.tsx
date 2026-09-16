// @vitest-environment happy-dom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/contexts";
import { useSidebar } from "@/hooks";
import { TRANSITION_REVEAL } from "@/lib/motion";
import { stubViewport } from "@/test/stub-viewport";
import { SidebarToggle } from "./sidebar-toggle";

const PEEK = '[data-slot="sidebar-peek"]';

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
  act(() => vi.advanceTimersByTime(TRANSITION_REVEAL.duration * 1000));
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

    expect(document.querySelector(PEEK)).toBeTruthy();
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
