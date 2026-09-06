// @vitest-environment happy-dom
import { usePrefetchRecentlyPlayed } from "@/hooks";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { getMusicKit } from "@/lib/music-kit/instance";
import { recentlyPlayedQuery } from "@/lib/music-kit/recently-played";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

let client: QueryClient;
let api: ReturnType<typeof vi.fn>;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api = vi.fn().mockResolvedValue({ data: { data: [] } });
  vi.mocked(getMusicKit).mockResolvedValue({
    api: { music: api },
  } as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  vi.clearAllMocks();
});

function Probe() {
  usePrefetchRecentlyPlayed();
  return null;
}

function renderProbe() {
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
}

function stored() {
  return client.getQueryState(recentlyPlayedQuery().queryKey);
}

describe("usePrefetchRecentlyPlayed", () => {
  it("fetches what was played lately while a person reads a detail view", async () => {
    act(() => setAuthStatus("signed-in"));

    renderProbe();

    await waitFor(() => expect(stored()?.status).toBe("success"));
    expect(api).toHaveBeenCalled();
  });

  it("asks Apple Music for nothing while nobody is signed in", async () => {
    act(() => setAuthStatus("signed-out"));

    renderProbe();

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(stored()).toBeUndefined();
    expect(api).not.toHaveBeenCalled();
  });

  it("leaves an answer that is still fresh alone", async () => {
    act(() => setAuthStatus("signed-in"));

    renderProbe();
    await waitFor(() => expect(stored()?.status).toBe("success"));

    const asked = api.mock.calls.length;

    cleanup();
    renderProbe();

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(api.mock.calls).toHaveLength(asked);
  });
});
