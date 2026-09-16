// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LibraryGrid } from "./library-grid";

function Empty() {
  return <p>Empty library</p>;
}

function NotLoaded() {
  return <p>Library did not load</p>;
}

function renderGrid(props: { total?: number; isPending?: boolean; isError?: boolean }) {
  render(
    <LibraryGrid
      name="test"
      tiles={[]}
      total={props.total}
      isPending={props.isPending ?? false}
      isError={props.isError ?? false}
      Empty={Empty}
      NotLoaded={NotLoaded}
    />,
  );
}

afterEach(() => {
  cleanup();
});

describe("LibraryGrid", () => {
  it("shows only the loading state while the data loads", () => {
    renderGrid({ isPending: true });

    expect(screen.queryByText("Empty library")).toBeNull();
    expect(screen.queryByText("Library did not load")).toBeNull();
  });

  it("shows the error state when the data did not load", () => {
    renderGrid({ isError: true });

    expect(screen.getByText("Library did not load")).toBeTruthy();
  });

  it("shows the empty state for an empty library", () => {
    renderGrid({ total: 0 });

    expect(screen.getByText("Empty library")).toBeTruthy();
  });

  it("shows that nothing matches when the search hides every tile", () => {
    renderGrid({ total: 3 });

    expect(screen.getByText("Nothing found")).toBeTruthy();
  });
});
