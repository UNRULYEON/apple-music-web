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
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
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

const ALBUM = { type: "albums", id: "a1" } as const;
const OTHER_ALBUM = { type: "albums", id: "a2" } as const;

function renderList(props: Partial<ComponentProps<typeof TrackList>> = {}) {
  render(
    <PlayerProvider>
      <TrackList songs={SONGS} {...props} />
    </PlayerProvider>,
  );
}

// the queue MusicKit reports, so the list can tell which song plays
function nowPlaying(index: number) {
  music.queue.items = SONGS.map((song) => ({ id: song.id, attributes: { name: song.name } }));
  music.nowPlayingItemIndex = index;
  act(() => music.emit("queueItemsDidChange", music.queue.items));
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

  it("tells the player which album the songs came from", async () => {
    renderList({ source: ALBUM });

    fireEvent.click(screen.getByText("Third"));

    await waitFor(() =>
      expect(vi.mocked(playSongs)).toHaveBeenCalledWith(SONGS, { startAt: 2, from: ALBUM }),
    );
  });

  it("marks the song that plays from this album", async () => {
    renderList({ source: ALBUM });

    fireEvent.click(screen.getByText("Second"));
    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalled());

    nowPlaying(1);

    expect(screen.getByLabelText("Playing now")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("2")).toBeNull();
  });

  it("leaves the same song alone in a list it does not play from", async () => {
    render(
      <PlayerProvider>
        <div data-testid="here">
          <TrackList songs={SONGS} source={ALBUM} />
        </div>
        <div data-testid="there">
          <TrackList songs={SONGS} source={OTHER_ALBUM} />
        </div>
      </PlayerProvider>,
    );

    fireEvent.click(within(screen.getByTestId("there")).getByText("Second"));
    await waitFor(() => expect(vi.mocked(playSongs)).toHaveBeenCalled());

    nowPlaying(1);

    expect(within(screen.getByTestId("there")).getByLabelText("Playing now")).toBeTruthy();
    expect(within(screen.getByTestId("here")).queryByLabelText("Playing now")).toBeNull();
  });
});
