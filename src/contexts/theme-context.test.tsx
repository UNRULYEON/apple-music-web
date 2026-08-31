// @vitest-environment happy-dom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/contexts";
import { useTheme } from "@/hooks";
import { preHydrationScript, type Theme } from "@/lib/theme-storage";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  vi.unstubAllGlobals();
});

function setPrefersDark(dark: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-color-scheme: dark") ? dark : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function runPreHydrationScript() {
  new Function(preHydrationScript)();
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

describe("preHydrationScript", () => {
  it("marks a stored dark theme before the first paint", () => {
    localStorage.setItem("theme", "dark");
    setPrefersDark(false);

    runPreHydrationScript();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("keeps a stored light theme against a dark system", () => {
    localStorage.setItem("theme", "light");
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
    localStorage.setItem("theme", "dark");
    setPrefersDark(false);

    expect(renderProvider().current?.theme).toBe("dark");
  });

  it("hydrates with the system theme, which is what the server rendered", () => {
    localStorage.setItem("theme", "dark");
    setPrefersDark(false);

    const renders: Array<Theme> = [];

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
    localStorage.setItem("theme", "light");
    setPrefersDark(true);

    renderProvider();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("stores the theme for the next reload", () => {
    setPrefersDark(false);
    const seen = renderProvider();

    act(() => seen.current?.setTheme("dark"));

    expect(seen.current?.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("follows the system preference for the system theme", () => {
    localStorage.setItem("theme", "light");
    setPrefersDark(true);
    const seen = renderProvider();

    act(() => seen.current?.setTheme("system"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => seen.current?.setTheme("light"));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
