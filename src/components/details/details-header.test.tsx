import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider } from "@/contexts";
import { fakeMusicKit, stubMusicKitGlobals } from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import { playSongs } from "@/lib/music-kit/playback";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import type { Song } from "@/lib/music-kit/track";
// @vitest-environment happy-dom
import { DetailsHeader } from "./details-header";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/playback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/playback")>()),
  playSongs: vi.fn().mockResolvedValue(undefined),
}));

const SONGS: Song[] = [
  { id: "s0", name: "First" },
  { id: "s1", name: "Second" },
];

const ALBUM = { type: "albums", id: "a1" } as const;

beforeEach(() => {
  resetPlayerState();
  stubMusicKitGlobals();
  vi.mocked(getMusicKit).mockResolvedValue(fakeMusicKit() as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderHeader(props: Partial<ComponentProps<typeof DetailsHeader>> = {}) {
  render(
    <PlayerProvider>
      <DetailsHeader name="An album" songs={SONGS} source={ALBUM} {...props} />
    </PlayerProvider>,
  );
}

describe("DetailsHeader", () => {
  it("plays the whole list from the top, and says where it came from", async () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalledWith(SONGS, { from: ALBUM }));
  });

  it("plays the whole list mixed up when a person asks to shuffle", async () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));

    await waitFor(() =>
      expect(vi.mocked(playSongs)).toHaveBeenCalledWith(SONGS, { shuffle: true, from: ALBUM }),
    );
  });

  it("gives no buttons to press when the list holds no song", () => {
    renderHeader({ songs: [] });

    expect(screen.getByRole("button", { name: "Play" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Shuffle" }).hasAttribute("disabled")).toBe(true);
  });
});
