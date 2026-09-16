// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/contexts";
import { useSidebar } from "@/hooks";
import { COMMAND_MENU_HOTKEY, resolveHotkey } from "@/lib/hotkeys";
import { type LibraryAlbum, libraryAlbumsQuery } from "@/lib/music-kit/album";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { type CatalogResults, catalogSearchQuery } from "@/lib/music-kit/catalog-search";
import { type LibraryPlaylist, libraryPlaylistsQuery } from "@/lib/music-kit/playlists";
import { HOME } from "@/lib/views/view";
import { CommandMenu, CommandMenuTrigger } from "./command-menu";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const openView = vi.fn();

vi.mock("@/hooks/use-view", () => ({
  useView: () => ({ view: HOME, open: openView, close: vi.fn(), canClose: false }),
}));

const ALBUMS: LibraryAlbum[] = [
  { id: "l.1", type: "library-albums", name: "Homogenic", artist: { id: "a.1", name: "Björk" } },
  {
    id: "l.2",
    type: "library-albums",
    name: "OK Computer",
    artist: { id: "a.2", name: "Radiohead" },
  },
  { id: "l.3", type: "library-albums", name: "Kid A", artist: { id: "a.2", name: "Radiohead" } },
];

const PLAYLISTS: LibraryPlaylist[] = [
  {
    id: "p.1",
    type: "library-playlists",
    name: "Late night",
    description: "Quiet songs for the dark",
    canEdit: true,
    hasCatalog: false,
    isPublic: false,
  },
  {
    id: "p.2",
    type: "library-playlists",
    name: "Runs",
    canEdit: true,
    hasCatalog: false,
    isPublic: false,
  },
];

const CATALOG: CatalogResults = {
  artists: [{ id: "1440846798", name: "boygenius", credit: "Alternative" }],
  albums: [{ id: "1656074388", name: "the record", credit: "boygenius" }],
  playlists: [],
};

function stubViewport({ mobile }: { mobile: boolean }) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: mobile ? query.includes("max-width") : query.includes("min-width"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

beforeEach(() => {
  stubViewport({ mobile: false });
  act(() => setAuthStatus("signed-in"));
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function renderMenu(
  albums: LibraryAlbum[] = ALBUMS,
  playlists: LibraryPlaylist[] = PLAYLISTS,
  catalog: Record<string, CatalogResults> = {},
) {
  const seen: { current?: ReturnType<typeof useSidebar> } = {};

  function Probe() {
    seen.current = useSidebar();
    return null;
  }

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(libraryAlbumsQuery().queryKey, albums);
  client.setQueryData(libraryPlaylistsQuery().queryKey, playlists);

  for (const [term, results] of Object.entries(catalog)) {
    client.setQueryData(catalogSearchQuery(term).queryKey, results);
  }

  render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <Probe />
        <CommandMenuTrigger />
        <CommandMenu />
      </SidebarProvider>
    </QueryClientProvider>,
  );

  return seen;
}

function pressShortcut() {
  const isMac = resolveHotkey(COMMAND_MENU_HOTKEY).startsWith("Meta");

  fireEvent.keyDown(document.body, { key: "k", code: "KeyK", metaKey: isMac, ctrlKey: !isMac });
}

function input(name: string = "Search your library"): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>("combobox", { name });
}

function type(text: string) {
  fireEvent.change(input(), { target: { value: text } });
}

function names(): string[] {
  return screen.queryAllByRole("option").map((option) => option.textContent ?? "");
}

describe("CommandMenu", () => {
  it("stays away until a person asks for it", () => {
    renderMenu();

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens with the shortcut", async () => {
    renderMenu();

    pressShortcut();

    expect(await screen.findByRole("dialog", { name: "Search" })).toBeTruthy();
  });

  it("closes again with the shortcut", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    pressShortcut();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("opens from the button", async () => {
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("lists the artists, the albums and the playlists of the library", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    expect(names()).toHaveLength(7);
    expect(screen.getByText("Artists")).toBeTruthy();
    expect(screen.getByText("Albums")).toBeTruthy();
    expect(screen.getByText("Playlists")).toBeTruthy();
  });

  it("finds a playlist by its name", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    type("runs");

    await waitFor(() => expect(names()).toEqual(["Runs"]));
    expect(screen.queryByText("Albums")).toBeNull();
  });

  it("finds a playlist by the words in its description", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    type("dark");

    await waitFor(() => expect(names()).toEqual(["Late nightQuiet songs for the dark"]));
  });

  it("opens the playlist a person picks", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    type("late");
    await waitFor(() => expect(names()).toHaveLength(1));

    fireEvent.keyDown(input(), { key: "Enter" });

    expect(openView).toHaveBeenCalledWith({
      name: "detail",
      type: "library-playlists",
      id: "p.1",
    });
  });

  it("opens the artist a person picks", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    type("radiohead");
    await waitFor(() => expect(names()[0]).toBe("Radiohead2 albums"));

    fireEvent.keyDown(input(), { key: "Enter" });

    expect(openView).toHaveBeenCalledWith({
      name: "detail",
      type: "library-artists",
      id: "Radiohead",
    });
  });

  it("finds an album by its artist, whatever the accents", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    type("bjork");

    await waitFor(() => expect(names()).toEqual(["Björk1 album", "HomogenicBjörk"]));
  });

  it("says so when nothing in the library matches", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    type("nothing like this");

    expect(await screen.findByText("Nothing in your library matches what you typed.")).toBeTruthy();
  });

  it("says so when the library is empty", async () => {
    renderMenu([], []);

    pressShortcut();

    expect(await screen.findByText("Your library is empty.")).toBeTruthy();
  });

  it("opens the album a person picks and goes away", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    type("kid");
    await waitFor(() => expect(names()).toEqual(["Kid ARadiohead"]));

    fireEvent.keyDown(input(), { key: "Enter" });

    expect(openView).toHaveBeenCalledWith({ name: "detail", type: "library-albums", id: "l.3" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes the sidebar before it opens on a narrow viewport", async () => {
    stubViewport({ mobile: true });
    const seen = renderMenu();

    act(() => seen.current?.setPeeking(true));

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(seen.current?.isPeeking).toBe(false);
  });

  it("shows a tab for the library and one for Apple Music", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    expect(screen.getByRole("tab", { name: "Library", selected: true })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Apple Music", selected: false })).toBeTruthy();
  });

  it("asks for words before it searches Apple Music", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("tab", { name: "Apple Music" }));

    expect(await screen.findByText("Type to search Apple Music.")).toBeTruthy();
  });

  it("lists what Apple Music holds and keeps the words a person typed", async () => {
    renderMenu(ALBUMS, PLAYLISTS, { boygenius: CATALOG });

    pressShortcut();
    await screen.findByRole("dialog");

    type("boygenius");
    fireEvent.click(screen.getByRole("tab", { name: "Apple Music" }));

    expect(input("Search Apple Music").value).toBe("boygenius");
    await waitFor(() => expect(names()).toEqual(["boygeniusAlternative", "the recordboygenius"]));
  });

  it("switches tabs with the left and the right arrow", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    fireEvent.keyDown(input(), { key: "ArrowRight" });

    await screen.findByRole("tab", { name: "Apple Music", selected: true });

    fireEvent.keyDown(input("Search Apple Music"), { key: "ArrowLeft" });

    expect(await screen.findByRole("tab", { name: "Library", selected: true })).toBeTruthy();
  });

  it("stays on the last tab when the arrow points past it", async () => {
    renderMenu();

    pressShortcut();
    await screen.findByRole("dialog");

    fireEvent.keyDown(input(), { key: "ArrowLeft" });

    expect(screen.getByRole("tab", { name: "Library", selected: true })).toBeTruthy();
  });

  it("keeps the up and the down arrow on the results", async () => {
    renderMenu(ALBUMS, PLAYLISTS, { boygenius: CATALOG });

    pressShortcut();
    await screen.findByRole("dialog");

    type("boygenius");
    fireEvent.click(screen.getByRole("tab", { name: "Apple Music" }));
    await waitFor(() => expect(names()).toHaveLength(2));

    const field = input("Search Apple Music");

    expect(document.activeElement).toBe(field);

    fireEvent.keyDown(field, { key: "ArrowDown" });
    fireEvent.keyDown(field, { key: "Enter" });

    expect(screen.getByRole("tab", { name: "Apple Music", selected: true })).toBeTruthy();
    expect(openView).toHaveBeenCalledWith({ name: "detail", type: "albums", id: "1656074388" });
  });

  it("says so when Apple Music holds nothing like it", async () => {
    renderMenu(ALBUMS, PLAYLISTS, {
      nothing: { artists: [], albums: [], playlists: [] },
    });

    pressShortcut();
    await screen.findByRole("dialog");

    type("nothing");
    fireEvent.click(screen.getByRole("tab", { name: "Apple Music" }));

    expect(await screen.findByText("Nothing on Apple Music matches what you typed.")).toBeTruthy();
  });

  it("leaves the shortcut alone while nobody is signed in", () => {
    act(() => setAuthStatus("signed-out"));
    renderMenu();

    pressShortcut();

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
