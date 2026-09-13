// @vitest-environment happy-dom
import { Player } from "@/components/player";
import { PlayerProvider } from "@/contexts";
import { setAuthStatus } from "@/lib/music-kit/auth";
import {
  fakeMusicKit,
  stubMusicKitGlobals,
  type FakeMusicKit,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import { resetPlaybackTime } from "@/lib/music-kit/playback-time";
import { resetPlayerState } from "@/lib/music-kit/player-state";
import { HOME } from "@/lib/views/view";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

vi.mock("@/hooks/use-view", () => ({
  useView: () => ({ view: HOME, open: vi.fn(), close: vi.fn(), canClose: false }),
}));

vi.mock("@/lib/music-kit/drm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/drm")>()),
  hasDrm: vi.fn(async () => true),
}));

vi.mock("@paper-design/shaders-react", () => ({
  MeshGradient: ({ colors }: { colors: string[] }) => (
    <div data-slot="player-mesh" data-colors={colors.join()} />
  ),
}));

const COVER = { url: "https://example.com/{w}x{h}{c}.{f}", width: 300, height: 300 };
const DARK = { ...COVER, bgColor: "000000", textColor1: "202020" };
const BRIGHT = { ...COVER, url: "https://example.com/two-{w}x{h}{c}.{f}", bgColor: "ffffff" };
const RED = { ...COVER, url: "https://example.com/three-{w}x{h}{c}.{f}", bgColor: "ff0000" };

const DARK_COLORS = "#000000,#202020";
const BRIGHT_COLORS = "#ffffff";
const RED_COLORS = "#ff0000";

const SAMPLES = 8;
const SAMPLE_GAP = 50;

// a skip that lands while the colours still move must not start the long wash again
const CATCH_UP = 700;

let music: FakeMusicKit;

beforeEach(() => {
  resetPlayerState();
  resetPlaybackTime();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  stubMusicKitGlobals();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function shownColors(): string {
  return document.querySelector('[data-slot="player-mesh"]')?.getAttribute("data-colors") ?? "none";
}

function sampleColors(): Promise<Set<string>> {
  return new Promise((done) => {
    const seen = new Set<string>();
    let left = SAMPLES;

    const timer = setInterval(() => {
      seen.add(shownColors());
      left -= 1;

      if (left === 0) {
        clearInterval(timer);
        done(seen);
      }
    }, SAMPLE_GAP);
  });
}

async function renderExpanded() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <PlayerProvider>
        <Player />
      </PlayerProvider>
    </QueryClientProvider>,
  );

  await waitFor(() => expect(music.addEventListener).toHaveBeenCalled());

  music.queue.items = [
    { id: "1", attributes: { name: "First", artistName: "The Band", artwork: DARK } },
    { id: "2", attributes: { name: "Second", artistName: "The Band", artwork: BRIGHT } },
    { id: "3", attributes: { name: "Third", artistName: "The Band", artwork: RED } },
  ] as unknown as MusicKit.MediaItem[];
  music.nowPlayingItemIndex = 0;
  act(() => music.emit("queueItemsDidChange", music.queue.items));

  const artwork = document.querySelector('[data-slot="player-artwork"]');

  if (!artwork) {
    throw new Error("the player shows no artwork");
  }

  fireEvent.click(artwork);
  await screen.findByLabelText("Collapse the player");
}

function playSong(index: number) {
  music.nowPlayingItemIndex = index;
  act(() => music.emit("queuePositionDidChange", { position: index }));
}

describe("the backdrop of the expanded player", () => {
  it("takes the colours of the song that plays", async () => {
    await renderExpanded();

    await waitFor(() => expect(shownColors()).toBe(DARK_COLORS));
  });

  it("washes through the colours in between when the song changes", async () => {
    await renderExpanded();
    await waitFor(() => expect(shownColors()).toBe(DARK_COLORS));

    playSong(1);

    const seen = await sampleColors();

    expect(seen.size).toBeGreaterThan(2);
    expect(seen.has(DARK_COLORS)).toBe(false);

    await waitFor(() => expect(shownColors()).toBe(BRIGHT_COLORS), { timeout: 2000 });
  });

  it("catches up quickly when a person skips past a song", async () => {
    await renderExpanded();
    await waitFor(() => expect(shownColors()).toBe(DARK_COLORS));

    playSong(1);
    await new Promise((done) => setTimeout(done, SAMPLE_GAP));
    playSong(2);

    await waitFor(() => expect(shownColors()).toBe(RED_COLORS), { timeout: CATCH_UP });
  });
});
