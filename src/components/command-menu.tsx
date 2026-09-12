import { ArtworkImage } from "@/components/artwork";
import { HotkeyKeys } from "@/components/hotkey-keys";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandCollection,
  CommandCreateHandle,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogPrimitive,
  CommandDialogTrigger,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
} from "@/components/ui/command";
import { useCloseSidebarOnMobile, useIsHydrated, useSignedInQuery, useView } from "@/hooks";
import { COMMAND_MENU_HOTKEY, resolveHotkey } from "@/lib/hotkeys";
import { libraryAlbumsQuery, type LibraryAlbum } from "@/lib/music-kit/album";
import { libraryPlaylistsQuery, type LibraryPlaylist } from "@/lib/music-kit/playlists";
import type { Artwork } from "@/lib/music-kit/resource";
import type { View } from "@/lib/views/view";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { matchesSearch } from "@/lib/search";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMemo, useState } from "react";

const LIMIT = 25;
const ARTWORK_SIZE = 64;
const TITLE = "Search your library";

export const commandMenu = CommandCreateHandle();

interface Result {
  id: string;
  name: string;
  credit?: string;
  artwork?: Artwork;
  view: View;
}

interface ResultGroup {
  label: string;
  items: Result[];
}

function albumResult(album: LibraryAlbum): Result {
  return {
    id: `library-albums:${album.id}`,
    name: album.name,
    credit: album.artist?.name,
    artwork: album.artwork,
    view: { name: "detail", type: "library-albums", id: album.id },
  };
}

function playlistResult(playlist: LibraryPlaylist): Result {
  return {
    id: `library-playlists:${playlist.id}`,
    name: playlist.name,
    credit: playlist.description,
    artwork: playlist.artwork,
    view: { name: "detail", type: "library-playlists", id: playlist.id },
  };
}

function group(label: string, items: Result[]): ResultGroup[] {
  return items.length > 0 ? [{ label, items: items.slice(0, LIMIT) }] : [];
}

function emptyText(isPending: boolean, isError: boolean, count: number): string {
  if (isPending) {
    return "Loading your library…";
  }

  if (isError) {
    return "Your library did not load.";
  }

  return count === 0 ? "Your library is empty." : "Nothing in your library matches what you typed.";
}

function LibrarySearch() {
  const { open } = useView();
  const albums = useSignedInQuery(libraryAlbumsQuery());
  const playlists = useSignedInQuery(libraryPlaylistsQuery());
  const [query, setQuery] = useState("");

  const groups = useMemo<ResultGroup[]>(
    () => [
      ...group(
        "Albums",
        (albums.data ?? [])
          .filter((album) => matchesSearch(query, album.name, album.artist?.name))
          .map(albumResult),
      ),
      ...group(
        "Playlists",
        (playlists.data ?? [])
          .filter((playlist) => matchesSearch(query, playlist.name, playlist.description))
          .map(playlistResult),
      ),
    ],
    [albums.data, playlists.data, query],
  );

  function show(result: Result) {
    commandMenu.close();
    open(result.view);
  }

  return (
    <Command
      items={groups}
      filter={null}
      value={query}
      onValueChange={(next, { reason }) => reason !== "item-press" && setQuery(next)}
    >
      <CommandInput placeholder={TITLE} aria-label={TITLE} />
      <CommandPanel>
        <CommandEmpty>
          {emptyText(
            albums.isPending || playlists.isPending,
            albums.isError || playlists.isError,
            (albums.data?.length ?? 0) + (playlists.data?.length ?? 0),
          )}
        </CommandEmpty>
        <CommandList>
          {(found: ResultGroup) => (
            <CommandGroup key={found.label} items={found.items}>
              <CommandGroupLabel>{found.label}</CommandGroupLabel>
              <CommandCollection>
                {(result: Result) => (
                  <CommandItem
                    key={result.id}
                    value={result}
                    className="gap-3"
                    onClick={() => show(result)}
                  >
                    <ArtworkImage
                      artwork={result.artwork}
                      size={ARTWORK_SIZE}
                      iconSize={16}
                      className="size-8 shrink-0 rounded-sm"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{result.name}</span>
                      {result.credit && (
                        <span className="truncate text-xs text-muted-foreground">
                          {result.credit}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                )}
              </CommandCollection>
            </CommandGroup>
          )}
        </CommandList>
      </CommandPanel>
    </Command>
  );
}

export function CommandMenu() {
  const status = useAuthStatus();
  const closeSidebarOnMobile = useCloseSidebarOnMobile();

  useHotkey(
    COMMAND_MENU_HOTKEY,
    () => {
      if (commandMenu.isOpen) {
        commandMenu.close();
        return;
      }

      closeSidebarOnMobile();
      commandMenu.open(null);
    },
    { enabled: status === "signed-in" },
  );

  return (
    <CommandDialog handle={commandMenu}>
      <CommandDialogPopup>
        <CommandDialogPrimitive.Title className="sr-only">{TITLE}</CommandDialogPrimitive.Title>
        <LibrarySearch />
      </CommandDialogPopup>
    </CommandDialog>
  );
}

export function CommandMenuTrigger() {
  const closeSidebarOnMobile = useCloseSidebarOnMobile();
  const isHydrated = useIsHydrated();

  return (
    <CommandDialogTrigger
      handle={commandMenu}
      render={<Button variant="ghost" className="justify-start" />}
      aria-keyshortcuts={isHydrated ? resolveHotkey(COMMAND_MENU_HOTKEY) : undefined}
      onClick={closeSidebarOnMobile}
    >
      <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" />
      Search
      {isHydrated && (
        <HotkeyKeys
          hotkey={COMMAND_MENU_HOTKEY}
          aria-hidden="true"
          className="ms-auto pointer-coarse:hidden"
        />
      )}
    </CommandDialogTrigger>
  );
}
