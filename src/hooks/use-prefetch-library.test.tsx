// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { libraryAlbumsQuery } from "@/lib/music-kit/album";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { artistPicturesQuery } from "@/lib/music-kit/library-artists";
import { libraryPlaylistsQuery } from "@/lib/music-kit/playlists";
import { recentlyPlayedQuery } from "@/lib/music-kit/recently-played";
import { stubMusicKit } from "@/test/fake-music-kit";
import { usePrefetchLibrary } from "./use-prefetch-library";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

let client: QueryClient;
let api: ReturnType<typeof vi.fn>;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api = vi.fn().mockResolvedValue({ data: { data: [] } });
  stubMusicKit({
    api: { music: api },
  });
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  vi.clearAllMocks();
});

function Probe() {
  usePrefetchLibrary();
  return null;
}

function renderProbe() {
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
}

const LIBRARY_QUERIES = [
  recentlyPlayedQuery,
  libraryAlbumsQuery,
  libraryPlaylistsQuery,
  artistPicturesQuery,
];

function stored() {
  return LIBRARY_QUERIES.map((query) => client.getQueryState(query().queryKey)?.status);
}

describe("usePrefetchLibrary", () => {
  it("fetches the whole library as soon as a person signs in", async () => {
    act(() => setAuthStatus("signed-in"));

    renderProbe();

    await waitFor(() => expect(stored()).toEqual(LIBRARY_QUERIES.map(() => "success")));
    expect(api).toHaveBeenCalled();
  });

  it("asks Apple Music for nothing while nobody is signed in", async () => {
    act(() => setAuthStatus("signed-out"));

    renderProbe();

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(stored()).toEqual(LIBRARY_QUERIES.map(() => undefined));
    expect(api).not.toHaveBeenCalled();
  });

  it("leaves an answer that is still fresh alone", async () => {
    act(() => setAuthStatus("signed-in"));

    renderProbe();
    await waitFor(() => expect(stored()).toEqual(LIBRARY_QUERIES.map(() => "success")));

    const asked = api.mock.calls.length;

    cleanup();
    renderProbe();

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(api.mock.calls).toHaveLength(asked);
  });
});
