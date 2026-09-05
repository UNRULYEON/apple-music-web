import { fetchAlbum, isAlbumType, type AlbumType } from "@/lib/music-kit/album";
import { useBackdrop } from "@/hooks";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { albumDuration, releaseYear, songDuration } from "@/lib/format";
import { artworkUrl } from "@/lib/music-kit/resource";
import type { DetailType } from "@/lib/views/view";
import { useQuery } from "@tanstack/react-query";
import { intlFormat } from "date-fns";
import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LoadingState } from "./loading-state";
import { TRANSITION_SLOW } from "@/lib/motion";

const ARTWORK_SIZE = 512;

export function DetailsView({ type, id }: { type: DetailType; id: string }) {
  if (isAlbumType(type)) {
    return <AlbumDetails type={type} id={id} />;
  }

  return <Placeholder type={type} id={id} />;
}

function AlbumDetails({ type, id }: { type: AlbumType; id: string }) {
  const status = useAuthStatus();
  const { data: album, isPending } = useQuery({
    queryKey: ["music-kit", "album", type, id],
    queryFn: () => fetchAlbum(type, id),
    enabled: status === "signed-in",
  });

  const artwork = album?.artwork;

  const colors = useMemo(
    () =>
      [
        artwork?.bgColor,
        artwork?.textColor1,
        artwork?.textColor2,
        artwork?.textColor3,
        artwork?.textColor4,
      ].filter((color) => color !== undefined),
    [artwork],
  );

  useBackdrop(colors.length > 0 ? colors : undefined);

  return (
    <AnimatePresence mode="popLayout">
      {isPending && (
        <motion.div
          key={`${type}-${id}-loading`}
          className="flex grow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION_SLOW}
        >
          <LoadingState />
        </motion.div>
      )}
      {album && album.artwork && !isPending && (
        <motion.div
          key={`${type}-${id}-loaded`}
          className="flex flex-col grow gap-8 px-4 py-4 sm:py-8 sm:px-4 sm:gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION_SLOW}
        >
          <div className="flex flex-col gap-8 sm:gap-4 sm:flex-row items-center">
            <div className="sm:px-4">
              <img
                src={artworkUrl(album.artwork, ARTWORK_SIZE)}
                alt={album.name}
                className="aspect-square w-full object-cover select-none max-w-96 sm:max-w-64 rounded-xl outline-neutral-50/50 dark:outline-neutral-900/50 outline-1 -outline-offset-1"
              />
            </div>
            <div className="flex flex-col gap-2 items-center sm:items-start">
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-bold text-xl sm:text-2xl">{album.name}</span>
                <span className="text-base">{album.artist?.name}</span>
              </div>
              {album.releaseDate && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {releaseYear(album.releaseDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            {album.songs.map((song, i) => (
              <div
                key={song.id}
                className="flex items-center gap-4 px-2 sm:px-4 h-14 sm:h-16 hover:bg-neutral-600/15 hover:dark:bg-neutral-400/15 cursor-pointer rounded-xl backdrop-blur-3xl"
              >
                <span className="min-w-6 tabular-nums text-sm text-center text-neutral-600 dark:text-neutral-400">
                  {i + 1}
                </span>
                <div className="flex flex-col grow">
                  <span>{song.name}</span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {song.artist?.name !== album.artist?.name ? song.artist?.name : ""}
                  </span>
                </div>
                <div className="text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
                  {song.durationInMillis ? songDuration(song.durationInMillis) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 items-center text-xs text-neutral-400">
            <span>
              {album.trackCount} {album.trackCount === 1 ? "track" : "tracks"} •{" "}
              {albumDuration(album.songs)}
            </span>
            {album.releaseDate && <span>{intlFormat(album.releaseDate)}</span>}
            {album.copyright && <span className="text-center">{album.copyright}</span>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Placeholder({ type, id }: { type: DetailType; id: string }) {
  return (
    <div className="flex flex-col gap-4 grow px-4 pb-4">
      <div className="text-muted-foreground text-sm">
        {type} · {id}
      </div>
    </div>
  );
}
