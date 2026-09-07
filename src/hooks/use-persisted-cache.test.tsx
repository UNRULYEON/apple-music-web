// @vitest-environment happy-dom
import { usePersistedCache, useSignedInQuery } from "@/hooks";
import { CACHE_VERSION, createCachePersister } from "@/integrations/tanstack-query/persister";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { persistQueryClientSave } from "@tanstack/query-persist-client-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const STORE_KEY = "apple-music-web.cache";
const KEY = ["music-kit", "recently-played"];

// a write waits a moment before it lands, so the store is given more than that
const STORED = { timeout: 3000 };

let client: QueryClient;
let queryFn: Mock<() => Promise<string>>;
let answer: (album: string) => void;

beforeEach(() => {
  localStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // the answer from Apple Music is held back, so what the browser put back is what
  // the view shows in the meantime
  queryFn = vi.fn(() => new Promise<string>((resolve) => (answer = resolve)));
  act(() => setAuthStatus("signed-in"));
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  localStorage.clear();
  vi.clearAllMocks();
});

async function store(data: string): Promise<void> {
  const earlier = new QueryClient();
  earlier.setQueryData(KEY, data);

  await persistQueryClientSave({
    queryClient: earlier,
    persister: createCachePersister(localStorage),
    buster: CACHE_VERSION,
  });
}

function stored(): string {
  return localStorage.getItem(STORE_KEY) ?? "";
}

function Probe() {
  usePersistedCache();
  const { data } = useSignedInQuery({ queryKey: KEY, queryFn });

  return <div>{data ?? "nothing"}</div>;
}

function renderProbe() {
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
}

describe("usePersistedCache", () => {
  it("puts back what the browser holds, while Apple Music has not answered", async () => {
    await store("the album from before");

    renderProbe();

    await screen.findByText("the album from before");
    expect(queryFn).toHaveBeenCalled();
  });

  it("shows the newer answer once it comes", async () => {
    await store("the album from before");
    renderProbe();
    await screen.findByText("the album from before");

    act(() => answer("the newest album"));

    await screen.findByText("the newest album");
  });

  it("puts what comes back in the browser", async () => {
    renderProbe();

    act(() => answer("the newest album"));
    await screen.findByText("the newest album");

    await waitFor(() => expect(stored()).toContain("the newest album"), STORED);
  });

  it("throws a cache it cannot read away and asks again", async () => {
    localStorage.setItem(STORE_KEY, "{this is not the cache");

    renderProbe();

    await waitFor(() => expect(stored()).not.toContain("not the cache"), STORED);
    act(() => answer("the newest album"));
    await screen.findByText("the newest album");
  });

  it("throws a cache of an older shape away", async () => {
    await store("the album from before");
    localStorage.setItem(
      STORE_KEY,
      stored().replace(`"buster":"${CACHE_VERSION}"`, '"buster":"0"'),
    );

    renderProbe();

    act(() => answer("the newest album"));
    await screen.findByText("the newest album");
    expect(screen.queryByText("the album from before")).toBeNull();
  });

  it("keeps the browser clean while nobody is signed in", async () => {
    act(() => setAuthStatus("signed-out"));

    renderProbe();

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(stored()).toBe("");
  });
});
