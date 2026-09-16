// @vitest-environment happy-dom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSidebar } from "@/hooks";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { PRE_HYDRATION_SCRIPT } from "@/lib/storage/sidebar";
import { stubViewport } from "@/test/stub-viewport";
import { SidebarProvider } from "./sidebar-context";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-sidebar");
  vi.unstubAllGlobals();
});

function runPreHydrationScript() {
  new Function(PRE_HYDRATION_SCRIPT)();
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

describe("PRE_HYDRATION_SCRIPT", () => {
  it("marks a stored closed sidebar before the first paint", () => {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, "false");
    stubViewport({ mobile: false });

    runPreHydrationScript();

    expect(document.documentElement.getAttribute("data-sidebar")).toBe("closed");
  });

  it("marks a mobile sidebar closed whatever the stored state says", () => {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, "true");
    stubViewport({ mobile: true });

    runPreHydrationScript();

    expect(document.documentElement.getAttribute("data-sidebar")).toBe("closed-mobile");
  });

  it("leaves an open sidebar alone", () => {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, "true");
    stubViewport({ mobile: false });

    runPreHydrationScript();

    expect(document.documentElement.hasAttribute("data-sidebar")).toBe(false);
  });
});

describe("SidebarProvider", () => {
  it("opens on the first render when nothing is stored", () => {
    stubViewport({ mobile: false });

    expect(renderProvider().current?.isOpen).toBe(true);
  });

  it("is closed on the very first render, so it never animates shut", () => {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, "false");
    stubViewport({ mobile: false });

    expect(renderProvider().current?.isOpen).toBe(false);
  });

  it("drops the pre-hydration mark once it owns the state", () => {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, "false");
    stubViewport({ mobile: false });
    runPreHydrationScript();

    renderProvider();

    expect(document.documentElement.hasAttribute("data-sidebar")).toBe(false);
  });

  it("stores the state for the next reload", () => {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, "false");
    stubViewport({ mobile: false });
    const seen = renderProvider();

    act(() => seen.current?.setOpen(true));

    expect(seen.current?.isOpen).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.sidebarOpen)).toBe("true");
  });

  it("stays closed on mobile and keeps the desktop preference", () => {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, "true");
    stubViewport({ mobile: true });
    const seen = renderProvider();

    expect(seen.current?.isMobile).toBe(true);
    expect(seen.current?.isOpen).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.sidebarOpen)).toBe("true");
  });

  it("is closed on the very first hydration render on mobile", () => {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, "true");
    stubViewport({ mobile: true });

    const renders: boolean[] = [];

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
    stubViewport({ mobile: true });
    const seen = renderProvider();

    act(() => seen.current?.setOpen(true));

    expect(seen.current?.isPeeking).toBe(true);
    expect(seen.current?.isOpen).toBe(false);
  });
});
