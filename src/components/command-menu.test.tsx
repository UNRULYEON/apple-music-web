// @vitest-environment happy-dom
import { CommandMenu, CommandMenuTrigger } from "@/components/command-menu";
import { SidebarProvider } from "@/contexts";
import { useSidebar } from "@/hooks";
import { COMMAND_MENU_HOTKEY, resolveHotkey } from "@/lib/hotkeys";
import { libraryAlbumsQuery, type LibraryAlbum } from "@/lib/music-kit/album";
import { libraryPlaylistsQuery, type LibraryPlaylist } from "@/lib/music-kit/playlists";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { HOME } from "@/lib/views/view";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

const openView = vi.fn();

vi.mock("@/hooks/use-view", () => ({
  useView: () => ({ view: HOME, open: openView, close: vi.fn(), canClose: false }),
}));

const ALBUMS: LibraryAlbum[] = [
  { id: "l.1", name: "Homogenic", artist: { id: "a.1", name: "Björk" } },
  { id: "l.2", name: "OK Computer", artist: { id: "a.2", name: "Radiohead" } },
  { id: "l.3", name: "Kid A", artist: { id: "a.2", name: "Radiohead" } },
];

const PLAYLISTS: LibraryPlaylist[] = [
  {
    id: "p.1",
    name: "Late night",
    description: "Quiet songs for the dark",
    canEdit: true,
    hasCatalog: false,
    isPublic: false,
  },
  { id: "p.2", name: "Runs", canEdit: true, hasCatalog: false, isPublic: false },
];

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

function renderMenu(albums: LibraryAlbum[] = ALBUMS, playlists: LibraryPlaylist[] = PLAYLISTS) {
  const seen: { current?: ReturnType<typeof useSidebar> } = {};

  function Probe() {
    seen.current = useSidebar();
    return null;
  }

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(libraryAlbumsQuery().queryKey, albums);
  client.setQueryData(libraryPlaylistsQuery().queryKey, playlists);

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

function input(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>("combobox", { name: "Search your library" });
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

    expect(await screen.findByRole("dialog", { name: "Search your library" })).toBeTruthy();
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

  it("leaves the shortcut alone while nobody is signed in", () => {
    act(() => setAuthStatus("signed-out"));
    renderMenu();

    pressShortcut();

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
