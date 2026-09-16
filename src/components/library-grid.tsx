import { AnimatePresence } from "motion/react";
import type { ComponentType } from "react";
import { EmptyStates } from "@/components/empty-states";
import { VIEW_INSET } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { LoadingState } from "./loading-state";
import { MediaGrid, type MediaTileItem } from "./media-grid";

export function LibraryGrid({
  name,
  tiles,
  total,
  isPending,
  isError,
  Empty,
  NotLoaded,
}: {
  name: string;
  tiles: MediaTileItem[];
  total?: number;
  isPending: boolean;
  isError: boolean;
  Empty: ComponentType;
  NotLoaded: ComponentType;
}) {
  const isLoaded = total !== undefined && !isPending;

  return (
    <div className={cn("flex grow flex-col pb-4", VIEW_INSET)}>
      <AnimatePresence mode="popLayout">
        {isPending && <LoadingState key={`${name}-loading-state`} />}
        {isError && !isPending && <NotLoaded key={`${name}-error-state`} />}
        {isLoaded && total === 0 && <Empty key={`${name}-empty-state`} />}
        {isLoaded && total > 0 && tiles.length === 0 && (
          <EmptyStates.NoMatches key={`${name}-no-matches-state`} />
        )}
        {tiles.length > 0 && !isPending && <MediaGrid key={`${name}-list`} items={tiles} />}
      </AnimatePresence>
    </div>
  );
}
