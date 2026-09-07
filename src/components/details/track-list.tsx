import { ArtworkImage } from "@/components/artwork";
import { usePlayer } from "@/hooks";
import { songDuration } from "@/lib/format";
import { TRANSITION } from "@/lib/motion";
import { isSameSource, type QueueSource } from "@/lib/music-kit/playback";
import type { Song } from "@/lib/music-kit/track";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const ARTWORK_SIZE = 48;

const NO_TRANSITION = { duration: 0 } as const;

const MARK_HIDDEN = { opacity: 0, scale: 0.25, filter: "blur(2px)" };
const MARK_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const FADED = { opacity: 0 };
const OPAQUE = { opacity: 1 };

export function TrackList({
  songs,
  primaryArtist,
  showTrackNumber = true,
  showArtwork = false,
  source,
}: {
  songs: Song[];
  primaryArtist?: string;
  showTrackNumber?: boolean;
  showArtwork?: boolean;
  source?: QueueSource;
}) {
  const { play, source: playingFrom, nowPlaying } = usePlayer();
  const reduceMotion = useReducedMotion();
  const playsThisList = isSameSource(source, playingFrom);

  const hidden = reduceMotion ? FADED : MARK_HIDDEN;
  const shown = reduceMotion ? OPAQUE : MARK_SHOWN;
  const transition = reduceMotion ? NO_TRANSITION : TRANSITION;

  return (
    <div className="flex flex-col">
      {songs.map((song, i) => {
        const playsNow = playsThisList && nowPlaying?.id === song.id;

        return (
          <button
            key={`${song.id}-${i}`}
            type="button"
            onClick={() => play(songs, { startAt: i, from: source })}
            className="flex items-center text-left gap-4 px-2 sm:px-4 h-14 sm:h-16 hover:bg-neutral-600/15 hover:dark:bg-neutral-400/15 cursor-pointer rounded-xl backdrop-blur-3xl"
          >
            {showArtwork ? (
              <div className="relative size-10 shrink-0">
                <ArtworkImage
                  artwork={song.artwork}
                  size={ARTWORK_SIZE}
                  iconSize={20}
                  className="size-10 rounded-md"
                />
                <AnimatePresence initial={false}>
                  {playsNow && (
                    <motion.span
                      key="mark"
                      className="absolute inset-0 flex items-center justify-center rounded-md bg-neutral-950/50"
                      initial={FADED}
                      animate={OPAQUE}
                      exit={FADED}
                      transition={transition}
                    >
                      <motion.span
                        className="flex"
                        initial={hidden}
                        animate={shown}
                        exit={hidden}
                        transition={transition}
                      >
                        <HugeiconsIcon
                          icon={PlayIcon}
                          size={16}
                          strokeWidth={2}
                          aria-label="Playing now"
                          className="text-neutral-50"
                        />
                      </motion.span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <span className="grid min-w-6 place-items-center tabular-nums text-sm text-neutral-600 dark:text-neutral-400">
                <AnimatePresence initial={false}>
                  {playsNow ? (
                    <motion.span
                      key="mark"
                      className="col-start-1 row-start-1 flex text-neutral-900 dark:text-neutral-100"
                      initial={hidden}
                      animate={shown}
                      exit={hidden}
                      transition={transition}
                    >
                      <HugeiconsIcon
                        icon={PlayIcon}
                        size={14}
                        strokeWidth={2}
                        aria-label="Playing now"
                      />
                    </motion.span>
                  ) : (
                    showTrackNumber && (
                      <motion.span
                        key="number"
                        className="col-start-1 row-start-1"
                        initial={hidden}
                        animate={shown}
                        exit={hidden}
                        transition={transition}
                      >
                        {i + 1}
                      </motion.span>
                    )
                  )}
                </AnimatePresence>
              </span>
            )}
            <div className="flex flex-col grow min-w-0">
              <span className="truncate">{song.name}</span>
              <span className="truncate text-sm text-neutral-600 dark:text-neutral-400">
                {song.artist?.name !== primaryArtist ? song.artist?.name : ""}
              </span>
            </div>
            <div className="text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
              {song.durationInMillis ? songDuration(song.durationInMillis) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
