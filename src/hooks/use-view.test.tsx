// @vitest-environment happy-dom

import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { View } from "@/lib/views/view";
import { useView, type ViewNavigation } from "./use-view";

const seen: { current?: ViewNavigation } = {};

function Probe() {
  seen.current = useView();
  return null;
}

async function renderView() {
  const rootRoute = createRootRoute({ component: Probe });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(<RouterProvider router={router} />);

  await waitFor(() => expect(seen.current).toBeDefined());

  return router;
}

function open(view: View) {
  act(() => seen.current?.open(view));
}

function scrollArea() {
  const area = document.createElement("div");

  area.dataset.scrollRestorationId = "main";
  area.scrollTop = 2400;
  document.body.append(area);

  return area;
}

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  seen.current = undefined;
});

describe("useView", () => {
  it("opens the view a person asks for", async () => {
    await renderView();

    open({ name: "list", list: "albums" });

    await waitFor(() => expect(seen.current?.view).toEqual({ name: "list", list: "albums" }));
  });

  it("opens a destination a person is not on", async () => {
    await renderView();

    open({ name: "detail", type: "albums", id: "a1" });

    await waitFor(() =>
      expect(seen.current?.view).toEqual({ name: "detail", type: "albums", id: "a1" }),
    );
  });

  it("takes a person to the start of the screen they are already on", async () => {
    const area = scrollArea();
    const router = await renderView();

    open({ name: "list", list: "albums" });
    await waitFor(() => expect(seen.current?.view).toMatchObject({ list: "albums" }));

    const before = router.state.location;

    open({ name: "list", list: "albums" });

    await waitFor(() => expect(area.scrollTop).toBe(0));
    expect(router.state.location).toBe(before);
  });

  it("takes home and recently played for one screen", async () => {
    const area = scrollArea();
    const router = await renderView();

    await waitFor(() => expect(seen.current?.view).toEqual({ name: "home" }));

    const before = router.state.location;

    open({ name: "list", list: "recently-played" });

    await waitFor(() => expect(area.scrollTop).toBe(0));
    expect(router.state.location).toBe(before);
  });

  it("leaves the place a person had when they open another screen", async () => {
    const area = scrollArea();

    await renderView();

    open({ name: "detail", type: "albums", id: "a1" });
    await waitFor(() => expect(seen.current?.view).toMatchObject({ name: "detail" }));

    open({ name: "list", list: "albums" });

    await waitFor(() => expect(seen.current?.view).toMatchObject({ list: "albums" }));
    expect(area.scrollTop).toBe(2400);
  });
});
