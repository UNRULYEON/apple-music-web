import {
  DetailsView,
  ErrorStates,
  LibraryAlbums,
  LibraryArtists,
  LibraryPlaylists,
  LoadingState,
} from "@/components";
import { EmptyStates } from "@/components/empty-states";
import { MediaGrid } from "@/components/media-grid";
import { useIsHydrated, usePlayer, useSearch, useSignedInQuery, useView } from "@/hooks";
import {
  recentlyPlayedQuery,
  type RecentlyPlayedItem,
  type RecentlyPlayedType,
} from "@/lib/music-kit/recently-played";
import { VIEW_INSET } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { Suspense, useMemo } from "react";

function isAlbum(type: RecentlyPlayedType): boolean {
  return type === "albums" || type === "library-albums";
}

function credit(item: RecentlyPlayedItem): string | undefined {
  return isAlbum(item.type) ? item.artist?.name : item.curator?.name;
}

export const Route = createFileRoute("/")({ component: Home });

// The shell keeps two places open for the route, one inside the other, and writes
// nothing in either. A route that is split off is not loaded when the server writes
// them, which is why there are two. React counts these places while it takes the page
// over, so the browser has to keep the same number and leave them as empty.
function Home() {
  return (
    <Suspense fallback={null}>
      <HomeView />
    </Suspense>
  );
}

function HomeView() {
  const { view } = useView();
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return null;
  }

  if (view.name === "detail") {
    return <DetailsView id={view.id} type={view.type} />;
  }

  if (view.name === "list") {
    switch (view.list) {
      case "albums":
        return <LibraryAlbums />;
      case "artists":
        return <LibraryArtists />;
      case "playlists":
        return <LibraryPlaylists />;
      default:
        break;
    }
  }

  return <RecentlyPlayed />;
}

function RecentlyPlayed() {
  const { open } = useView();
  const { playStation } = usePlayer();
  const { term } = useSearch();
  const { data: played, isPending, isError } = useSignedInQuery(recentlyPlayedQuery());

  const tiles = useMemo(
    () =>
      played
        ?.filter((item) => matchesSearch(term, item.name, item.artist?.name, item.curator?.name))
        .map((item) => ({
          id: item.id,
          name: item.name,
          credit: credit(item),
          artwork: item.artwork,
          // a station has nothing to show, so it plays where a person taps it
          onClick: () =>
            item.type === "stations"
              ? playStation(item.id)
              : open({ name: "detail", type: item.type, id: item.id }),
        })) ?? [],
    [played, open, playStation, term],
  );

  return (
    <div className={cn("flex flex-col grow pb-4", VIEW_INSET)}>
      <AnimatePresence mode="popLayout">
        {isPending && <LoadingState key="recently-played-loading-state" />}
        {isError && !isPending && <ErrorStates.RecentlyPlayed key="recently-played-error-state" />}
        {played && played.length === 0 && !isPending && (
          <EmptyStates.NoRecentlyPlayed key="recently-played-empty-state" />
        )}
        {played && played.length > 0 && tiles.length === 0 && !isPending && (
          <EmptyStates.NoMatches key="recently-played-no-matches-state" />
        )}
        {tiles.length > 0 && !isPending && <MediaGrid key="recently-played-list" items={tiles} />}
      </AnimatePresence>
    </div>
  );
}
