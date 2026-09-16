import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Fragment, useEffect, useMemo, useRef } from "react";
import { ArtistLinks, ArtworkImage } from "@/components";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { usePlayer } from "@/hooks";
import { songDuration } from "@/lib/format";
import { ROW_BLEED } from "@/lib/layout";
import { TRANSITION } from "@/lib/motion";
import { isSameSource, type QueueSource } from "@/lib/music-kit/playback";
import { discStarts, isExplicit, isSameSong, type Song } from "@/lib/music-kit/track";
import { cn } from "@/lib/utils";
import { ExplicitMark } from "./explicit-mark";
import { LibraryMark } from "./library-mark";
import { TrackMenuPopup } from "./track-menu";

const ARTWORK_SIZE = 48;

const VIEWPORT = '[data-slot="scroll-area-viewport"]';
const PLAYING_ROW = "[data-playing]";

const NO_TRANSITION = { duration: 0 } as const;

const MARK_HIDDEN = { opacity: 0, scale: 0.25, filter: "blur(2px)" };
const MARK_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const FADED = { opacity: 0 };
const OPAQUE = { opacity: 1 };

export function showPlayingSong(list: HTMLElement): void {
  const row = list.querySelector(PLAYING_ROW);
  const viewport = list.closest(VIEWPORT);

  if (!row || !viewport) {
    return;
  }

  const rowBox = row.getBoundingClientRect();
  const listBox = list.getBoundingClientRect();
  const viewBox = viewport.getBoundingClientRect();

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
  const prefersReducedMotion = useReducedMotion();
  const playsThisList = isSameSource(source, playingFrom);
  const marksLibrary = showLibraryMark && songs.some((song) => song.inLibrary);
  const list = useRef<HTMLDivElement>(null);
  const hasShown = useRef(false);
  const discs = useMemo(
    () => (showTrackNumber ? discStarts(songs) : new Map<number, number>()),
    [songs, showTrackNumber],
  );

  useEffect(() => {
    const node = list.current;

    if (!playsThisList || hasShown.current || !node) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      hasShown.current = true;
      showPlayingSong(node);
    });

    return () => cancelAnimationFrame(frame);
  }, [playsThisList]);

  const hidden = prefersReducedMotion ? FADED : MARK_HIDDEN;
  const shown = prefersReducedMotion ? OPAQUE : MARK_SHOWN;
  const transition = prefersReducedMotion ? NO_TRANSITION : TRANSITION;

  return (
    <div ref={list} className={cn("flex flex-col", ROW_BLEED)}>
      {songs.map((song, i) => {
        const playsNow = playsThisList && isSameSong(nowPlaying, song);
        const disc = discs.get(i);

        return (
          <Fragment key={`${song.id}-${i}`}>
            {disc !== undefined && <DiscHeading number={disc} />}
            <ContextMenu>
              <ContextMenuTrigger
                render={<button type="button" />}
                data-playing={playsNow ? "" : undefined}
                onClick={() => play(songs, { startAt: i, from: source })}
                className="flex h-14 cursor-pointer items-center gap-4 rounded-xl px-2 text-left backdrop-blur-3xl transition-colors duration-(--duration-quick) ease-(--ease-smooth-out) hover:bg-neutral-600/15 motion-reduce:transition-none sm:h-16 sm:px-4 hover:dark:bg-neutral-400/15"
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
                              className="text-neutral-50"
                              aria-label="Playing now"
                            />
                          </motion.span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <span className="grid min-w-6 place-items-center text-sm text-neutral-600 tabular-nums theme-fade-text dark:text-neutral-400">
                    <AnimatePresence initial={false}>
                      {playsNow ? (
                        <motion.span
                          key="mark"
                          className="col-start-1 row-start-1 flex text-neutral-900 theme-fade-text dark:text-neutral-100"
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
                <div className="flex min-w-0 grow flex-col">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{song.name}</span>
                    {isExplicit(song) && <ExplicitMark />}
                  </span>
                  <span className="truncate text-sm text-neutral-600 theme-fade-text dark:text-neutral-400">
                    {song.artist?.name !== primaryArtist && (
                      <ArtistLinks artists={song.artists} fallback={song.artist?.name} />
                    )}
                  </span>
                </div>
                {marksLibrary && (
                  <span className="grid w-4 shrink-0 place-items-center text-neutral-600 theme-fade-text dark:text-neutral-400">
                    {song.inLibrary && <LibraryMark label="This song is in your library" />}
                  </span>
                )}
                <div className="text-sm text-neutral-600 tabular-nums theme-fade-text dark:text-neutral-400">
                  {song.durationInMillis ? songDuration(song.durationInMillis) : null}
                </div>
              </ContextMenuTrigger>
              <TrackMenuPopup song={song} source={source} />
            </ContextMenu>
          </Fragment>
        );
      })}
    </div>
  );
}

function DiscHeading({ number }: { number: number }) {
  return (
    <h3 className="px-2 pt-6 pb-2 text-sm font-medium text-neutral-600 theme-fade-text sm:px-4 dark:text-neutral-400">
      Disc {number}
    </h3>
  );
}
