import { ArtworkImage, DetailsView, ErrorStates, LoadingState } from "@/components";
import { EmptyStates } from "@/components/empty-states";
import { useView } from "@/hooks";
import { TRANSITION, TRANSITION_REVEAL } from "@/lib/motion";
import { useAuthStatus } from "@/lib/music-kit/auth";
import {
  fetchRecentlyPlayed,
  type RecentlyPlayedItem,
  type RecentlyPlayedType,
} from "@/lib/music-kit/recently-played";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

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

function Home() {
  const { view } = useView();

  if (view.name === "detail") {
    return <DetailsView id={view.id} type={view.type} />;
  }

  return <RecentlyPlayed />;
}

function RecentlyPlayed() {
  const status = useAuthStatus();
  const { open } = useView();
  const {
    data: played,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["music-kit", "recently-played", 100],
    queryFn: () => fetchRecentlyPlayed(100),
    enabled: status === "signed-in",
    staleTime: 5 * 60 * 1000,
  });

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
