// @vitest-environment happy-dom
import { HiddenSongs } from "@/components/details/hidden-songs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

describe("HiddenSongs", () => {
  it("says how many songs of the list a person can see", () => {
    render(<HiddenSongs shown={3} total={14} />);

    expect(screen.getByText(/3 of 14 songs/)).toBeTruthy();
  });

  it("says nothing while the list holds every song", () => {
    const { container } = render(<HiddenSongs shown={14} total={14} />);

    expect(container.innerHTML).toBe("");
  });

  it("says nothing for a list with no songs at all", () => {
    const { container } = render(<HiddenSongs shown={0} total={0} />);

    expect(container.innerHTML).toBe("");
  });
});
