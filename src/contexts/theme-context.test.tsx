// @vitest-environment happy-dom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "@/hooks";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { PRE_HYDRATION_SCRIPT, type Theme } from "@/lib/storage/theme";
import { stubMatchMedia } from "@/test/stub-viewport";
import { ThemeProvider } from "./theme-context";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  vi.unstubAllGlobals();
});

function setPrefersDark(dark: boolean) {
  stubMatchMedia((query) => dark && query.includes("prefers-color-scheme: dark"));
}

function runPreHydrationScript() {
  new Function(PRE_HYDRATION_SCRIPT)();
}

function renderProvider() {
  const seen: { current?: ReturnType<typeof useTheme> } = {};

  function Probe() {
    seen.current = useTheme();
    return null;
  }

  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );

  return seen;
}

describe("PRE_HYDRATION_SCRIPT", () => {
  it("marks a stored dark theme before the first paint", () => {
    localStorage.setItem(STORAGE_KEYS.theme, "dark");
    setPrefersDark(false);

    runPreHydrationScript();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("keeps a stored light theme against a dark system", () => {
    localStorage.setItem(STORAGE_KEYS.theme, "light");
    setPrefersDark(true);

    runPreHydrationScript();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows the system when nothing is stored", () => {
    setPrefersDark(true);

    runPreHydrationScript();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("ThemeProvider", () => {
  it("selects the system theme when nothing is stored", () => {
    setPrefersDark(false);

    expect(renderProvider().current?.theme).toBe("system");
  });

  it("selects the stored theme on the first render", () => {
    localStorage.setItem(STORAGE_KEYS.theme, "dark");
    setPrefersDark(false);

    expect(renderProvider().current?.theme).toBe("dark");
  });

  it("hydrates with the system theme, which is what the server rendered", () => {
    localStorage.setItem(STORAGE_KEYS.theme, "dark");
    setPrefersDark(false);

    const renders: Theme[] = [];

    function Probe() {
      renders.push(useTheme().theme);
      return null;
    }

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
      { hydrate: true },
    );

    expect(renders[0]).toBe("system");
    expect(renders.at(-1)).toBe("dark");
  });

  it("leaves the first paint to the pre-hydration script", () => {
    localStorage.setItem(STORAGE_KEYS.theme, "light");
    setPrefersDark(true);

    renderProvider();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("stores the theme for the next reload", () => {
    setPrefersDark(false);
    const seen = renderProvider();

    act(() => seen.current?.setTheme("dark"));

    expect(seen.current?.theme).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("follows the system preference for the system theme", () => {
    localStorage.setItem(STORAGE_KEYS.theme, "light");
    setPrefersDark(true);
    const seen = renderProvider();

    act(() => seen.current?.setTheme("system"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => seen.current?.setTheme("light"));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
