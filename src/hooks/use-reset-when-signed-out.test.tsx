import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { HOME } from "@/lib/views/view";
import { readStoredVolume, writeStoredVolume } from "@/lib/volume-storage";
// @vitest-environment happy-dom
import { useResetWhenSignedOut } from "./use-reset-when-signed-out";
import { useSignedInQuery } from "./use-signed-in-query";

const open = vi.fn();

vi.mock("@/hooks/use-view", () => ({ useView: () => ({ open }) }));

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => setAuthStatus("signed-in"));
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  localStorage.clear();
  vi.clearAllMocks();
});

const KEY = ["music-kit", "recently-played"];

function Probe() {
  useResetWhenSignedOut();
  const { data } = useSignedInQuery({ queryKey: KEY, queryFn: async () => "an album" });

  return <div>{data ?? "nothing"}</div>;
}

function held() {
  return client
    .getQueryCache()
    .getAll()
    .map((query) => query.state.data)
    .filter((data) => data !== undefined);
}

function renderProbe() {
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
}

describe("useResetWhenSignedOut", () => {
  it("keeps the answers of a person who is signed in", async () => {
    renderProbe();

    await screen.findByText("an album");
    expect(client.getQueryData(KEY)).toBe("an album");
    expect(open).not.toHaveBeenCalled();
  });

  it("takes the answer away from the view that shows it", async () => {
    renderProbe();
    await screen.findByText("an album");

    act(() => setAuthStatus("signed-out"));

    await waitFor(() => expect(screen.getByText("nothing")).toBeTruthy());
  });

  it("empties the cache when the session ends", async () => {
    renderProbe();
    await screen.findByText("an album");

    act(() => setAuthStatus("signed-out"));

    await waitFor(() => expect(client.getQueryData(KEY)).toBeUndefined());
    expect(held()).toEqual([]);
  });

  it("opens the root view when the session ends", async () => {
    renderProbe();
    await screen.findByText("an album");

    act(() => setAuthStatus("signed-out"));

    expect(open).toHaveBeenCalledWith(HOME);
  });

  it("takes the volume out of the browser when the session ends", async () => {
    writeStoredVolume(0.3);
    renderProbe();
    await screen.findByText("an album");

    act(() => setAuthStatus("signed-out"));

    expect(readStoredVolume()).toBeUndefined();
  });

  it("keeps the volume of a page that starts alone", () => {
    writeStoredVolume(0.3);

    act(() => setAuthStatus("checking"));
    renderProbe();

    expect(readStoredVolume()).toBe(0.3);
  });

  it("empties the cache while the status is not known", async () => {
    client.setQueryData(KEY, "an album");
    client.setQueryData(["music-kit", "album", "1"], "an older album");

    act(() => setAuthStatus("checking"));
    renderProbe();

    await waitFor(() => expect(held()).toEqual([]));
  });

  it("leaves the view of a page that starts alone", () => {
    act(() => setAuthStatus("checking"));

    renderProbe();

    expect(open).not.toHaveBeenCalled();
  });
});
