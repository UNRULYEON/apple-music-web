// @vitest-environment happy-dom
import { MainContent } from "@/components/main-content";
import { PLAYER_SPACE } from "@/components/player";
import { PlayerProvider } from "@/contexts";
import { usePlayer } from "@/hooks";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

function renderContent() {
  const seen: { current?: ReturnType<typeof usePlayer> } = {};

  function Probe() {
    seen.current = usePlayer();
    return null;
  }

  render(
    <PlayerProvider>
      <Probe />
      <MainContent>
        <p>Content</p>
      </MainContent>
    </PlayerProvider>,
  );

  return seen;
}

describe("MainContent", () => {
  it("keeps no room at the end while nothing plays", () => {
    renderContent();

    expect(screen.getByRole("main").style.paddingBottom).not.toBe(`${PLAYER_SPACE}px`);
  });

  it("makes room for the bar, so the last song can scroll above it", async () => {
    const seen = renderContent();

    act(() => seen.current?.play([{ id: "s0", name: "First" }]));

    await waitFor(() =>
      expect(screen.getByRole("main").style.paddingBottom).toBe(`${PLAYER_SPACE}px`),
    );
  });
});
