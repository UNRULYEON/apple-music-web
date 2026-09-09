// @vitest-environment happy-dom
import { useSignedInQuery } from "@/hooks";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

let client: QueryClient;
let queryFn: Mock<() => Promise<string>>;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryFn = vi.fn(async () => "an album");
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  vi.clearAllMocks();
});

function Probe({ enabled }: { enabled?: boolean }) {
  useSignedInQuery({ queryKey: ["music-kit", "album"], queryFn, enabled });
  return null;
}

function renderProbe(enabled?: boolean) {
  render(
    <QueryClientProvider client={client}>
      <Probe enabled={enabled} />
    </QueryClientProvider>,
  );
}

describe("useSignedInQuery", () => {
  it("asks Apple Music while a person is signed in", async () => {
    act(() => setAuthStatus("signed-in"));

    renderProbe();

    await waitFor(() => expect(queryFn).toHaveBeenCalledOnce());
  });

  it("asks Apple Music for nothing while nobody is signed in", async () => {
    act(() => setAuthStatus("signed-out"));

    renderProbe();

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(queryFn).not.toHaveBeenCalled();
  });

  it("waits for the answer to the sign in question", async () => {
    renderProbe();

    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(queryFn).not.toHaveBeenCalled();

    act(() => setAuthStatus("signed-in"));

    await waitFor(() => expect(queryFn).toHaveBeenCalledOnce());
  });

  it("leaves a query that asks to wait alone", async () => {
    act(() => setAuthStatus("signed-in"));

    renderProbe(false);

    await waitFor(() => expect(queryFn).not.toHaveBeenCalled());
  });
});
