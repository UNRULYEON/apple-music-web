// @vitest-environment happy-dom
import { TrackList } from "@/components/details/track-list";
import { PlayerProvider } from "@/contexts";
import {
  fakeMusicKit,
  stubMusicKitGlobals,
  type FakeMusicKit,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import { playSongs } from "@/lib/music-kit/playback";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import type { Song } from "@/lib/music-kit/track";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/playback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/playback")>()),
  playSongs: vi.fn().mockResolvedValue(undefined),
}));

const SONGS: Song[] = [
  { id: "s0", name: "First" },
  { id: "s1", name: "Second" },
  { id: "s2", name: "Third" },
];

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

function renderList() {
  render(
    <PlayerProvider>
      <TrackList songs={SONGS} />
    </PlayerProvider>,
  );
}

describe("TrackList", () => {
  it("gives the whole album to the player, starting at the song that a person clicks", async () => {
    renderList();

    fireEvent.click(screen.getByText("Third"));

    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalledWith(SONGS, { startAt: 2 }));
  });

  it("starts at the first song when a person clicks the first row", async () => {
    renderList();

    fireEvent.click(screen.getByText("First"));

    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalledWith(SONGS, { startAt: 0 }));
  });
});
