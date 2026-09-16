// @vitest-environment happy-dom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSidebar } from "@/hooks";
import { preHydrationScript } from "@/lib/sidebar-storage";
import { SidebarProvider } from "./sidebar-context";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-sidebar");
  vi.unstubAllGlobals();
});

function setViewport(desktop: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width") ? desktop : !desktop,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function runPreHydrationScript() {
  new Function(preHydrationScript)();
}

function renderProvider() {
  const seen: { current?: ReturnType<typeof useSidebar> } = {};

  function Probe() {
    seen.current = useSidebar();
    return null;
  }

  render(
    <SidebarProvider>
      <Probe />
    </SidebarProvider>,
  );

  return seen;
}

describe("preHydrationScript", () => {
  it("marks a stored closed sidebar before the first paint", () => {
    localStorage.setItem("sidebar-open", "false");
    setViewport(true);

    runPreHydrationScript();

    expect(document.documentElement.getAttribute("data-sidebar")).toBe("closed");
  });

  it("marks a mobile sidebar closed whatever the stored state says", () => {
    localStorage.setItem("sidebar-open", "true");
    setViewport(false);

    runPreHydrationScript();

    expect(document.documentElement.getAttribute("data-sidebar")).toBe("closed-mobile");
  });

  it("leaves an open sidebar alone", () => {
    localStorage.setItem("sidebar-open", "true");
    setViewport(true);

    runPreHydrationScript();

    expect(document.documentElement.hasAttribute("data-sidebar")).toBe(false);
  });
});

describe("SidebarProvider", () => {
  it("opens on the first render when nothing is stored", () => {
    setViewport(true);

    expect(renderProvider().current?.isOpen).toBe(true);
  });

  it("is closed on the very first render, so it never animates shut", () => {
    localStorage.setItem("sidebar-open", "false");
    setViewport(true);

    expect(renderProvider().current?.isOpen).toBe(false);
  });

  it("drops the pre-hydration mark once it owns the state", () => {
    localStorage.setItem("sidebar-open", "false");
    setViewport(true);
    runPreHydrationScript();

    renderProvider();

    expect(document.documentElement.hasAttribute("data-sidebar")).toBe(false);
  });

  it("stores the state for the next reload", () => {
    localStorage.setItem("sidebar-open", "false");
    setViewport(true);
    const seen = renderProvider();

    act(() => seen.current?.setOpen(true));

    expect(seen.current?.isOpen).toBe(true);
    expect(localStorage.getItem("sidebar-open")).toBe("true");
  });

  it("stays closed on mobile and keeps the desktop preference", () => {
    localStorage.setItem("sidebar-open", "true");
    setViewport(false);
    const seen = renderProvider();

    expect(seen.current?.isMobile).toBe(true);
    expect(seen.current?.isOpen).toBe(false);
    expect(localStorage.getItem("sidebar-open")).toBe("true");
  });

  it("is closed on the very first hydration render on mobile", () => {
    localStorage.setItem("sidebar-open", "true");
    setViewport(false);

    const renders: Array<boolean> = [];

    function Probe() {
      renders.push(useSidebar().isOpen);
      return null;
    }

    render(
      <SidebarProvider>
        <Probe />
      </SidebarProvider>,
      { hydrate: true },
    );

    expect(renders[0]).toBe(false);
  });

  it("peeks instead of opening when the toggle is used on mobile", () => {
    setViewport(false);
    const seen = renderProvider();

    act(() => seen.current?.setOpen(true));

    expect(seen.current?.isPeeking).toBe(true);
    expect(seen.current?.isOpen).toBe(false);
  });
});
