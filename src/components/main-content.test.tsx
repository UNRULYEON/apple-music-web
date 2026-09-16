// @vitest-environment happy-dom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider } from "@/contexts";
import {
  fakeMusicKit,
  type FakeMusicKit,
  songItem,
  stubMusicKitGlobals,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import { MainContent } from "./main-content";
import { PLAYER_SPACE } from "./player";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

let music: FakeMusicKit;

beforeEach(() => {
  resetPlayerState();
  stubMusicKitGlobals();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function renderContent() {
  render(
    <PlayerProvider>
      <MainContent>
        <p>Content</p>
      </MainContent>
    </PlayerProvider>,
  );

  await waitFor(() => expect(music.addEventListener).toHaveBeenCalled());
}

describe("MainContent", () => {
  it("keeps no room at the end while nothing plays", async () => {
    await renderContent();

    expect(screen.getByRole("main").style.paddingBottom).not.toBe(`${PLAYER_SPACE}px`);
  });

  it("makes room for the bar, so the last song can scroll above it", async () => {
    await renderContent();

    music.queue.items = [songItem("1", "First")];
    act(() => music.emit("queueItemsDidChange", music.queue.items));

    await waitFor(() =>
      expect(screen.getByRole("main").style.paddingBottom).toBe(`${PLAYER_SPACE}px`),
    );
  });
});
