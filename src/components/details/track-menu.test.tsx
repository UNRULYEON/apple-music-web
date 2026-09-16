// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider } from "@/contexts";
import { songArtistsQuery } from "@/lib/music-kit/artists";
import { setAuthStatus } from "@/lib/music-kit/auth";
import type { QueueSource } from "@/lib/music-kit/playback";
import { songSourceQuery } from "@/lib/music-kit/song-source";
import type { Song } from "@/lib/music-kit/track";
import { HOME } from "@/lib/views/view";
import {
  fakeMusicKit,
  type FakeMusicKit,
  stubMusicKit,
  stubMusicKitGlobals,
} from "@/test/fake-music-kit";
import { TrackList } from "./track-list";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const openView = vi.fn();

vi.mock("@/hooks/use-view", () => ({
  useView: () => ({ view: HOME, open: openView, close: vi.fn(), canClose: false }),
}));

const SONG: Song = {
  id: "s1",
  name: "Chala",
  artists: [{ id: "a1", name: "Masayoshi Takanaka" }],
};

const SOURCE: QueueSource = { type: "albums", id: "al1" };

let music: FakeMusicKit;
let client: QueryClient;

beforeEach(() => {
  stubMusicKitGlobals();
  music = fakeMusicKit();
  stubMusicKit(music);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(songSourceQuery("s1").queryKey, SOURCE);
  act(() => setAuthStatus("signed-in"));
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderList(song: Song = SONG, source?: QueueSource) {
  render(
    <QueryClientProvider client={client}>
      <PlayerProvider>
        <TrackList songs={[song]} source={source} />
      </PlayerProvider>
    </QueryClientProvider>,
  );
}

function openMenu() {
  fireEvent.contextMenu(screen.getByRole("button", { name: /Chala/ }));
}

describe("TrackMenu", () => {
  it("opens the album of the song", async () => {
    renderList(SONG, { type: "playlists", id: "p1" });
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: "Go to Album" }));

    expect(openView).toHaveBeenCalledWith({ name: "detail", type: "albums", id: "al1" });
  });

  it("opens the artist of the song", async () => {
    renderList(SONG, { type: "playlists", id: "p1" });
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: "Go to Artist" }));

    expect(openView).toHaveBeenCalledWith({ name: "detail", type: "artists", id: "a1" });
  });

  it("leaves the album out on the page of an album", async () => {
    renderList(SONG, { type: "albums", id: "al1" });
    openMenu();

    await screen.findByRole("menuitem", { name: "Go to Artist" });
    expect(screen.queryByRole("menuitem", { name: "Go to Album" })).toBeNull();
  });

  it("leaves out the artist whose page is open", async () => {
    renderList(SONG, { type: "artists", id: "a1" });
    openMenu();

    await screen.findByRole("menuitem", { name: "Go to Album" });
    expect(screen.queryByRole("menuitem", { name: "Go to Artist" })).toBeNull();
  });

  it("finds the artists of a song that came without them", async () => {
    client.setQueryData(songArtistsQuery("s1").queryKey, [{ id: "a9", name: "Found" }]);
    renderList({ id: "s1", name: "Chala" }, { type: "artists", id: "a1" });
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: "Go to Artist" }));

    expect(openView).toHaveBeenCalledWith({ name: "detail", type: "artists", id: "a9" });
  });

  it("puts every artist of a song with more than one in a submenu", async () => {
    renderList(
      {
        ...SONG,
        artists: [
          { id: "a1", name: "Masayoshi Takanaka" },
          { id: "a2", name: "Tatsuro Yamashita" },
        ],
      },
      { type: "playlists", id: "p1" },
    );
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: "Go to Artist" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Tatsuro Yamashita" }));

    expect(openView).toHaveBeenCalledWith({ name: "detail", type: "artists", id: "a2" });
  });
});
