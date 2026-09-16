// @vitest-environment happy-dom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider, ThemeProvider } from "@/contexts";
import { useSidebar } from "@/hooks";
import { HOME } from "@/lib/views/view";
import { stubViewport } from "@/test/stub-viewport";
import { Nav } from "./nav";

const openView = vi.fn();

vi.mock("@/hooks/use-view", () => ({
  useView: () => ({ view: HOME, open: openView, close: vi.fn(), canClose: false }),
}));

beforeEach(() => {
  stubViewport({ mobile: false });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function renderNav() {
  const seen: { current?: ReturnType<typeof useSidebar> } = {};

  function Probe() {
    seen.current = useSidebar();
    return null;
  }

  render(
    <ThemeProvider>
      <SidebarProvider>
        <Probe />
        <Nav />
      </SidebarProvider>
    </ThemeProvider>,
  );

  return seen;
}

describe("Nav", () => {
  it("opens the screen of an item and keeps the sidebar on a wide viewport", () => {
    const seen = renderNav();

    fireEvent.click(screen.getByRole("button", { name: "Albums" }));

    expect(openView).toHaveBeenCalledWith({ name: "list", list: "albums" });
    expect(seen.current?.isOpen).toBe(true);
  });

  it("closes the sidebar after an item opens its screen on a narrow viewport", () => {
    stubViewport({ mobile: true });
    const seen = renderNav();

    act(() => seen.current?.setPeeking(true));

    fireEvent.click(screen.getByRole("button", { name: "Recently played" }));

    expect(openView).toHaveBeenCalledWith({ name: "list", list: "recently-played" });
    expect(seen.current?.isPeeking).toBe(false);
  });
});
