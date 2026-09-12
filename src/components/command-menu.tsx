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
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import {
  useCloseSidebarOnMobile,
  useDebounced,
  useIsHydrated,
  useSignedInQuery,
  useView,
} from "@/hooks";
import { COMMAND_MENU_HOTKEY, resolveHotkey } from "@/lib/hotkeys";
import { count } from "@/lib/format";
import { libraryAlbumsQuery, type LibraryAlbum } from "@/lib/music-kit/album";
import { catalogSearchQuery, type CatalogItem } from "@/lib/music-kit/catalog-search";
import {
  readLibraryArtists,
  searchArtists,
  type LibraryArtist,
} from "@/lib/music-kit/library-artists";
import { libraryPlaylistsQuery, type LibraryPlaylist } from "@/lib/music-kit/playlists";
import type { Artwork } from "@/lib/music-kit/resource";
import type { DetailType, View } from "@/lib/views/view";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { matchesSearch } from "@/lib/search";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";

const LIMIT = 25;
const ARTWORK_SIZE = 64;
const TITLE = "Search";

const SOURCES = ["library", "catalog"] as const;

type Source = (typeof SOURCES)[number];

const STEPS: Record<string, number | undefined> = { ArrowLeft: -1, ArrowRight: 1 };

const SOURCE_LABELS: Record<Source, string> = {
  library: "Library",
  catalog: "Apple Music",
};

const SOURCE_TITLES: Record<Source, string> = {
  library: "Search your library",
  catalog: "Search Apple Music",
};

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

interface Found {
  groups: ResultGroup[];
  empty: string;
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

function artistResult(artist: LibraryArtist): Result {
  return {
    id: `library-artists:${artist.name}`,
    name: artist.name,
    credit: count(artist.albumCount, "album"),
    artwork: artist.artwork,
    view: { name: "detail", type: "library-artists", id: artist.name },
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

function catalogResult(type: DetailType, item: CatalogItem): Result {
  return {
    id: `${type}:${item.id}`,
    name: item.name,
    credit: item.credit,
    artwork: item.artwork,
    view: { name: "detail", type, id: item.id },
  };
}

function group(label: string, items: Result[]): ResultGroup[] {
  return items.length > 0 ? [{ label, items: items.slice(0, LIMIT) }] : [];
}

function libraryEmptyText(isPending: boolean, isError: boolean, found: number): string {
  if (isPending) {
    return "Loading your library…";
  }

  if (isError) {
    return "Your library did not load.";
  }

  return found === 0 ? "Your library is empty." : "Nothing in your library matches what you typed.";
}

function catalogEmptyText(query: string, isPending: boolean, isError: boolean): string {
  if (query.trim() === "") {
    return "Type to search Apple Music.";
  }

  if (isPending) {
    return "Searching Apple Music…";
  }

  if (isError) {
    return "Apple Music did not answer.";
  }

  return "Nothing on Apple Music matches what you typed.";
}

function useLibraryResults(query: string): Found {
  const albums = useSignedInQuery(libraryAlbumsQuery());
  const playlists = useSignedInQuery(libraryPlaylistsQuery());

  const artists = useMemo(() => readLibraryArtists(albums.data ?? []), [albums.data]);

  const groups = useMemo<ResultGroup[]>(
    () => [
      ...group("Artists", searchArtists(artists, query).map(artistResult)),
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
    [albums.data, artists, playlists.data, query],
  );

  return {
    groups,
    empty: libraryEmptyText(
      albums.isPending || playlists.isPending,
      albums.isError || playlists.isError,
      (albums.data?.length ?? 0) + (playlists.data?.length ?? 0),
    ),
  };
}

function useCatalogResults(query: string, enabled: boolean): Found {
  const term = useDebounced(query);
  const results = useSignedInQuery({
    ...catalogSearchQuery(term),
    enabled: enabled && term !== "",
  });

  const groups = useMemo<ResultGroup[]>(
    () => [
      ...group(
        "Artists",
        (results.data?.artists ?? []).map((item) => catalogResult("artists", item)),
      ),
      ...group(
        "Albums",
        (results.data?.albums ?? []).map((item) => catalogResult("albums", item)),
      ),
      ...group(
        "Playlists",
        (results.data?.playlists ?? []).map((item) => catalogResult("playlists", item)),
      ),
    ],
    [results.data],
  );

  return {
    groups,
    empty: catalogEmptyText(query, results.isPending || term !== query, results.isError),
  };
}

function CommandSearch() {
  const { open } = useView();
  const [source, setSource] = useState<Source>("library");
  const [query, setQuery] = useState("");
  const library = useLibraryResults(query);
  const catalog = useCatalogResults(query, source === "catalog");
  const found = source === "library" ? library : catalog;
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(next: unknown) {
    setSource(next as Source);
    inputRef.current?.focus();
  }

  function step(event: KeyboardEvent<HTMLInputElement>) {
    const move = STEPS[event.key];

    if (move === undefined) {
      return;
    }

    const next = SOURCES[SOURCES.indexOf(source) + move];

    if (next) {
      event.preventDefault();
      setSource(next);
    }
  }

  function show(result: Result) {
    commandMenu.close();
    open(result.view);
  }

  return (
    <Command
      items={found.groups}
      filter={null}
      value={query}
      onValueChange={(next, { reason }) => reason !== "item-press" && setQuery(next)}
    >
      <CommandInput
        ref={inputRef}
        placeholder={SOURCE_TITLES[source]}
        aria-label={SOURCE_TITLES[source]}
        onKeyDown={step}
      />
      <Tabs value={source} onValueChange={pick} className="px-2.5 pb-2">
        <TabsList size="sm">
          {SOURCES.map((name) => (
            <TabsTab key={name} value={name}>
              {SOURCE_LABELS[name]}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
      <CommandPanel>
        <CommandEmpty>{found.empty}</CommandEmpty>
        <CommandList>
          {(shown: ResultGroup) => (
            <CommandGroup key={shown.label} items={shown.items}>
              <CommandGroupLabel>{shown.label}</CommandGroupLabel>
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
        <CommandSearch />
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
