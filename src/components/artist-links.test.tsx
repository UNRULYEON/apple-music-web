import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
// @vitest-environment happy-dom
import { ArtistLinks } from "./artist-links";

const open = vi.fn();

vi.mock("@/hooks/use-view", () => ({
  useView: () => ({ view: { name: "home" }, open, close: vi.fn(), canClose: false }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ArtistLinks", () => {
  it("gives every artist of a song a way to their own screen", () => {
    render(
      <ArtistLinks
        artists={[
          { id: "1", name: "Kendrick Lamar" },
          { id: "2", name: "SZA" },
        ]}
      />,
    );

    fireEvent.click(screen.getByText("SZA"));

    expect(open).toHaveBeenCalledWith({ name: "detail", type: "artists", id: "2" });
  });

  it("keeps the tap away from the row behind it", () => {
    const onRow = vi.fn();

    render(
      <button type="button" onClick={onRow}>
        <ArtistLinks artists={[{ id: "1", name: "boygenius" }]} />
      </button>,
    );

    fireEvent.click(screen.getByText("boygenius"));

    expect(open).toHaveBeenCalled();
    expect(onRow).not.toHaveBeenCalled();
  });

  it("opens an artist from the keyboard", () => {
    render(<ArtistLinks artists={[{ id: "1", name: "boygenius" }]} />);

    fireEvent.keyDown(screen.getByText("boygenius"), { key: "Enter" });

    expect(open).toHaveBeenCalledWith({ name: "detail", type: "artists", id: "1" });
  });

  it("falls back to plain text when Apple sent no artists", () => {
    render(<ArtistLinks artists={[]} fallback="boygenius" />);

    expect(screen.getByText("boygenius")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("passes over an artist that carries no id", () => {
    render(<ArtistLinks artists={[{ name: "boygenius" }]} fallback="boygenius" />);

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows nothing when there is neither an artist nor a fallback", () => {
    const { container } = render(<ArtistLinks />);

    expect(container.innerHTML).toBe("");
  });
});
