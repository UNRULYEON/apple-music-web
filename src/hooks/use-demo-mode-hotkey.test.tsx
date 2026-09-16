// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider } from "@/contexts";
import { DEMO_LIBRARY } from "@/lib/demo/library";
import { readDemoMode, setDemoMode } from "@/lib/demo/mode";
import { setAuthStatus } from "@/lib/music-kit/auth";
import type { QueueSource } from "@/lib/music-kit/playback";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import {
  fakeMusicKit,
  type FakeMusicKit,
  songItem,
  stubMusicKit,
  stubMusicKitGlobals,
} from "@/test/fake-music-kit";
import { useDemoModeHotkey } from "./use-demo-mode-hotkey";
import { usePlayer } from "./use-player";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/drm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/drm")>()),
  hasDrm: vi.fn(async () => true),
}));
vi.mock("@/components/ui/toast", () => ({ toastManager: { add: vi.fn() } }));

const DEMO_ALBUM: QueueSource = { type: "albums", id: DEMO_LIBRARY.albums[0] ?? "" };
const OWN_ALBUM: QueueSource = { type: "library-albums", id: "l.1" };

let music: FakeMusicKit;

beforeEach(() => {
  localStorage.clear();
  resetPlayerState();
  stubMusicKitGlobals();
  music = fakeMusicKit();
  stubMusicKit(music);
  act(() => setAuthStatus("signed-in"));
});

afterEach(() => {
  cleanup();
  act(() => setDemoMode(false));
  act(() => setAuthStatus("checking"));
  localStorage.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function renderPlaying(from: QueueSource) {
  const seen: { current?: ReturnType<typeof usePlayer> } = {};

  function Probe() {
    useDemoModeHotkey();
    seen.current = usePlayer();
    return null;
  }

  render(
    <QueryClientProvider client={new QueryClient()}>
      <PlayerProvider>
        <Probe />
      </PlayerProvider>
    </QueryClientProvider>,
  );

  await waitFor(() => expect(music.addEventListener).toHaveBeenCalled());

  act(() => seen.current?.play([{ id: "111", name: "One" }], { from }));
  music.queue.items = [songItem("111", "One")];
  act(() => music.emit("queueItemsDidChange", music.queue.items));
  await waitFor(() => expect(seen.current?.nowPlaying).toBeDefined());

  return seen;
}

function pressShiftD() {
  fireEvent.keyDown(document.body, { key: "D", code: "KeyD", shiftKey: true });
  fireEvent.keyUp(document.body, { key: "D", code: "KeyD", shiftKey: true });
}

describe("useDemoModeHotkey", () => {
  it("closes the player when demo mode starts on a song from outside the demo", async () => {
    await renderPlaying(OWN_ALBUM);

    pressShiftD();

    expect(readDemoMode()).toBe(true);
    await waitFor(() => expect(music.clearQueue).toHaveBeenCalled());
  });

  it("keeps a song from the demo playing", async () => {
    const seen = await renderPlaying(DEMO_ALBUM);

    pressShiftD();

    expect(readDemoMode()).toBe(true);
    await act(async () => undefined);
    expect(music.clearQueue).not.toHaveBeenCalled();
    expect(seen.current?.source).toEqual(DEMO_ALBUM);
  });

  it("keeps the player when demo mode ends", async () => {
    act(() => setDemoMode(true));
    await renderPlaying(OWN_ALBUM);

    pressShiftD();

    expect(readDemoMode()).toBe(false);
    await act(async () => undefined);
    expect(music.clearQueue).not.toHaveBeenCalled();
  });
});
