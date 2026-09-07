import { ArtworkImage, DetailsView, ErrorStates, LoadingState } from "@/components";
import { EmptyStates } from "@/components/empty-states";
import { useIsHydrated, useSignedInQuery, useView } from "@/hooks";
import { TRANSITION, TRANSITION_REVEAL } from "@/lib/motion";
import {
  recentlyPlayedQuery,
  type RecentlyPlayedItem,
  type RecentlyPlayedType,
} from "@/lib/music-kit/recently-played";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Suspense } from "react";

const ARTWORK_SIZE = 256;

const BLURRED = { opacity: 0, filter: "blur(2px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };

function isAlbum(type: RecentlyPlayedType): boolean {
  return type === "albums" || type === "library-albums";
}

function Credit({ item }: { item: RecentlyPlayedItem }) {
  const name = isAlbum(item.type) ? item.artist?.name : item.curator?.name;

  if (!name) {
    return null;
  }

  return <div className="truncate text-muted-foreground text-xs select-none">{name}</div>;
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

  return <RecentlyPlayed />;
}

function RecentlyPlayed() {
  const { open } = useView();
  const { data: played, isPending, isError } = useSignedInQuery(recentlyPlayedQuery());

  return (
    <div className="flex flex-col grow px-4 pb-4">
      <AnimatePresence mode="popLayout">
        {isPending && <LoadingState key="recently-played-loading-state" />}
        {isError && !isPending && <ErrorStates.RecentlyPlayed key="recently-played-error-state" />}
        {played && played.length === 0 && !isPending && (
          <EmptyStates.NoRecentlyPlayed key="recently-played-empty-state" />
        )}
        {played && played.length > 0 && !isPending && (
          <motion.div
            key="recently-played-list"
            className="grid grid-cols-[repeat(auto-fill,minmax(min(13rem,calc(50%_-_1rem)),1fr))] gap-4 md:gap-6"
            initial={BLURRED}
            animate={SHARP}
            exit={BLURRED}
            transition={TRANSITION_REVEAL}
          >
            {played.map((item) => (
              <motion.div
                key={item.id}
                className="flex flex-col gap-2 cursor-pointer"
                whileHover={{ scale: 1.01 }}
                transition={TRANSITION}
                onClick={() => open({ name: "detail", type: item.type, id: item.id })}
              >
                <ArtworkImage artwork={item.artwork} size={ARTWORK_SIZE} className="rounded-md" />
                <div className="flex flex-col">
                  <div className="truncate text-xs text-neutral-600 dark:text-neutral-300 select-none">
                    {item.name}
                  </div>
                  <Credit item={item} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
