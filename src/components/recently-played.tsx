import { useMemo } from "react";
import { EmptyStates } from "@/components/empty-states";
import { ErrorStates } from "@/components/error-states";
import { usePlayer, useSearch, useSignedInQuery, useView } from "@/hooks";
import {
  type RecentlyPlayedItem,
  recentlyPlayedQuery,
  type RecentlyPlayedType,
} from "@/lib/music-kit/recently-played";
import { matchesSearch } from "@/lib/search";
import { LibraryGrid } from "./library-grid";

export function RecentlyPlayed() {
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
          onClick: () =>
            item.type === "stations"
              ? playStation(item.id)
              : open({ name: "detail", type: item.type, id: item.id }),
        })) ?? [],
    [played, open, playStation, term],
  );

  return (
    <LibraryGrid
      name="recently-played"
      tiles={tiles}
      total={played?.length}
      isPending={isPending}
      isError={isError}
      Empty={EmptyStates.NoRecentlyPlayed}
      NotLoaded={ErrorStates.RecentlyPlayedNotLoaded}
    />
  );
}

function isAlbum(type: RecentlyPlayedType): boolean {
  return type === "albums" || type === "library-albums";
}

function credit(item: RecentlyPlayedItem): string | undefined {
  return isAlbum(item.type) ? item.artist?.name : item.curator?.name;
}
