// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HiddenItems } from "./hidden-items";

afterEach(() => {
  cleanup();
});

describe("HiddenItems", () => {
  it("says how many songs of the list a person can see", () => {
    render(<HiddenItems noun="songs" shown={3} total={14} />);

    expect(screen.getByText(/3 of 14 songs/)).toBeTruthy();
  });

  it("says nothing while the list holds every song", () => {
    const { container } = render(<HiddenItems noun="songs" shown={14} total={14} />);

    expect(container.innerHTML).toBe("");
  });

  it("names the rows the list holds", () => {
    render(<HiddenItems noun="albums" shown={2} total={8} />);

    expect(screen.getByText(/2 of 8 albums/)).toBeTruthy();
  });

  it("says nothing for a list with no songs at all", () => {
    const { container } = render(<HiddenItems noun="songs" shown={0} total={0} />);

    expect(container.innerHTML).toBe("");
  });
});
