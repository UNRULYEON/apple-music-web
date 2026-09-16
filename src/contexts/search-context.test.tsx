import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSearch } from "@/hooks";
import { setAuthStatus } from "@/lib/music-kit/auth";
import type { View } from "@/lib/views/view";
// @vitest-environment happy-dom
import { SearchProvider } from "./search-context";

const open = vi.fn();
let view: View = { name: "home" };

vi.mock("@/hooks/use-view", () => ({
  useView: () => ({ view, open, close: vi.fn(), canClose: false }),
}));

afterEach(() => {
  cleanup();
  view = { name: "home" };
  act(() => setAuthStatus("checking"));
  vi.clearAllMocks();
});

function renderProvider() {
  const seen: { current?: ReturnType<typeof useSearch> } = {};

  function Probe() {
    seen.current = useSearch();
    return null;
  }

  const shown = render(
    <SearchProvider>
      <Probe />
    </SearchProvider>,
  );

  return {
    seen,
    rerender: () =>
      shown.rerender(
        <SearchProvider>
          <Probe />
        </SearchProvider>,
      ),
  };
}

describe("SearchProvider", () => {
  it("keeps what a person types", () => {
    const { seen } = renderProvider();

    act(() => seen.current?.setTerm("boygenius"));

    expect(seen.current?.term).toBe("boygenius");
  });

  it("starts clean on another screen", () => {
    const { seen, rerender } = renderProvider();

    act(() => seen.current?.setTerm("boygenius"));

    view = { name: "list", list: "albums" };
    act(rerender);

    expect(seen.current?.term).toBe("");
  });

  it("gives the search back when a person comes back to the screen", () => {
    const { seen, rerender } = renderProvider();

    act(() => seen.current?.setTerm("boygenius"));

    view = { name: "detail", type: "albums", id: "a.1" };
    act(rerender);
    view = { name: "home" };
    act(rerender);

    expect(seen.current?.term).toBe("boygenius");
  });

  it("keeps a search of its own for every screen", () => {
    const { seen, rerender } = renderProvider();

    act(() => seen.current?.setTerm("boygenius"));

    view = { name: "list", list: "albums" };
    act(rerender);
    act(() => seen.current?.setTerm("nirvana"));

    view = { name: "home" };
    act(rerender);
    expect(seen.current?.term).toBe("boygenius");

    view = { name: "list", list: "albums" };
    act(rerender);
    expect(seen.current?.term).toBe("nirvana");
  });

  it("lets every search go when a person signs out", () => {
    const { seen } = renderProvider();

    act(() => seen.current?.setTerm("boygenius"));
    act(() => setAuthStatus("signed-out"));

    expect(seen.current?.term).toBe("");
  });

  it("carries the search from home to recently played, which show the same list", () => {
    const { seen, rerender } = renderProvider();

    act(() => seen.current?.setTerm("boygenius"));

    view = { name: "list", list: "recently-played" };
    act(rerender);

    expect(seen.current?.term).toBe("boygenius");
  });
});

function Alone() {
  useSearch();
  return null;
}

describe("useSearch", () => {
  it("says so when nothing holds a search above it", () => {
    expect(() => render(<Alone />)).toThrow("SearchProvider");
  });
});
