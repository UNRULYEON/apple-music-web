import { ArtworkImage } from "@/components/artwork";
import { ArtistLinks } from "@/components/artist-links";
import { LibraryMark } from "@/components/details/library-mark";
import { usePlayer } from "@/hooks";
import { songDuration } from "@/lib/format";
import { ROW_BLEED } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { TRANSITION } from "@/lib/motion";
import { isSameSource, type QueueSource } from "@/lib/music-kit/playback";
import { isSameSong, type Song } from "@/lib/music-kit/track";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const ARTWORK_SIZE = 48;

const VIEWPORT = '[data-slot="scroll-area-viewport"]';
const PLAYING_ROW = "[data-playing]";

const NO_TRANSITION = { duration: 0 } as const;

const MARK_HIDDEN = { opacity: 0, scale: 0.25, filter: "blur(2px)" };
const MARK_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const FADED = { opacity: 0 };
const OPAQUE = { opacity: 1 };

// where the list opens. The song a person is on comes to the middle, but never further
// up than the first song, so a short window does not carry a song near the start to the
// end of the list. A song that fits on screen with the list at its top leaves the view
// there, so the header above it stays in sight.
export function showPlayingSong(list: HTMLElement): void {
  const row = list.querySelector(PLAYING_ROW);
  const viewport = list.closest(VIEWPORT);

  if (!row || !viewport) {
    return;
  }

  const rowBox = row.getBoundingClientRect();
  const listBox = list.getBoundingClientRect();
  const viewBox = viewport.getBoundingClientRect();

  // the whole view, not the part of it on screen, so nothing here reads the scroll the
  // view before it was left at
  const scrolled = viewport.scrollTop;
  const rowTop = scrolled + rowBox.top - viewBox.top;
  const listTop = scrolled + listBox.top - viewBox.top;

  if (rowTop + rowBox.height <= viewBox.height) {
    viewport.scrollTo({ top: 0 });
    return;
  }

  const middle = rowTop - (viewBox.height - rowBox.height) / 2;

  viewport.scrollTo({ top: Math.max(middle, listTop) });
}

export function TrackList({
  songs,
  primaryArtist,
  showTrackNumber = true,
  showArtwork = false,
  showLibraryMark = true,
  source,
}: {
  songs: Song[];
  primaryArtist?: string;
  showTrackNumber?: boolean;
  showArtwork?: boolean;
  showLibraryMark?: boolean;
  source?: QueueSource;
}) {
  const { play, source: playingFrom, nowPlaying } = usePlayer();
  const reduceMotion = useReducedMotion();
  const playsThisList = isSameSource(source, playingFrom);
  // the column stays on every row, or the durations of the marked rows move
  const marksLibrary = showLibraryMark && songs.some((song) => song.inLibrary);
  const list = useRef<HTMLDivElement>(null);
  const hasShown = useRef(false);

  useEffect(() => {
    const node = list.current;

    if (!playsThisList || hasShown.current || !node) {
      return;
    }

    // after the paint, so the router has put the view where it opens first. The mark
    // is set here, not before, so a frame that is dropped is asked for again.
    const frame = requestAnimationFrame(() => {
      hasShown.current = true;
      showPlayingSong(node);
    });

    return () => cancelAnimationFrame(frame);
  }, [playsThisList]);

  const hidden = reduceMotion ? FADED : MARK_HIDDEN;
  const shown = reduceMotion ? OPAQUE : MARK_SHOWN;
  const transition = reduceMotion ? NO_TRANSITION : TRANSITION;

  return (
    <div ref={list} className={cn("flex flex-col", ROW_BLEED)}>
      {songs.map((song, i) => {
        const playsNow = playsThisList && isSameSong(nowPlaying, song);

        return (
          <button
            key={`${song.id}-${i}`}
            type="button"
            data-playing={playsNow ? "" : undefined}
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
                    // the number Apple Music gives the song on its album, because a
                    // list can leave songs out and counting the rows would name the
                    // rest wrongly
                    showTrackNumber &&
                    song.trackNumber !== undefined && (
                      <motion.span
                        key="number"
                        className="col-start-1 row-start-1"
                        initial={hidden}
                        animate={shown}
                        exit={hidden}
                        transition={transition}
                      >
                        {song.trackNumber}
                      </motion.span>
                    )
                  )}
                </AnimatePresence>
              </span>
            )}
            <div className="flex flex-col grow min-w-0">
              <span className="truncate">{song.name}</span>
              <span className="truncate text-sm text-neutral-600 dark:text-neutral-400">
                {song.artist?.name !== primaryArtist && (
                  <ArtistLinks artists={song.artists} fallback={song.artist?.name} />
                )}
              </span>
            </div>
            {marksLibrary && (
              <span className="grid w-4 shrink-0 place-items-center text-neutral-600 dark:text-neutral-400">
                {song.inLibrary && <LibraryMark label="This song is in your library" />}
              </span>
            )}
            <div className="text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
              {song.durationInMillis ? songDuration(song.durationInMillis) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
