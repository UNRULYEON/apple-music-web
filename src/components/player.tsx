import { useIsMobile, usePlayer, useSignedInQuery, useView } from "@/hooks";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { TRANSITION, TRANSITION_REVEAL, TRANSITION_SWAP } from "@/lib/motion";
import type { QueueSource } from "@/lib/music-kit/playback";
import { isPlaylistType } from "@/lib/music-kit/playlists";
import { songSourceQuery } from "@/lib/music-kit/song-source";
import type { RepeatMode } from "@/lib/music-kit/player-state";
import { cn } from "@/lib/utils";
import {
  Loading03Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  Playlist03Icon,
  PreviousIcon,
  RepeatIcon,
  RepeatOne02Icon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ArtworkImage } from "./artwork";
import { PlayerProgress } from "./player-progress";
import { PlayerVolume } from "./player-volume";
import { Button } from "./ui/button";

const ARTWORK_SIZE = 64;

// The room the artwork, the text and the bar take, when the viewport gives it.
// It sits on the column itself, so a narrow viewport can take room back from it
// and the text inside truncates instead of spilling out of the bar.
const META_WIDTH = 256;

// The room the bar needs at the end of the scrolled content.
export const PLAYER_SPACE = 96;

const HIDDEN = { opacity: 0, y: 16, scale: 0.97, filter: "blur(2px)" };
const SHOWN = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
const NO_TRANSITION = { duration: 0 } as const;

const BLURRED = { opacity: 0, filter: "blur(2px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };

const ICON_HIDDEN = { opacity: 0, scale: 0.96, filter: "blur(2px)" };
const ICON_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const ART_HIDDEN = { opacity: 0, scale: 0.96, filter: "blur(2px)" };
const ART_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const BAR_GAP = 16;

const GROUP_COLLAPSED = { width: 0, opacity: 0, filter: "blur(2px)" };
const GROUP_EXPANDED = { width: "auto", opacity: 1, filter: "blur(0px)" };

const ROW_COLLAPSED = { height: 0, opacity: 0, filter: "blur(2px)" };
const ROW_EXPANDED = { height: "auto", opacity: 1, filter: "blur(0px)" };

const GROUP_AT_START = { ...GROUP_COLLAPSED, marginInlineStart: 0 };
const GROUP_AFTER_START = { ...GROUP_EXPANDED, marginInlineStart: BAR_GAP };
const GROUP_AT_END = { ...GROUP_COLLAPSED, marginInlineEnd: 0 };
const GROUP_BEFORE_END = { ...GROUP_EXPANDED, marginInlineEnd: BAR_GAP };

const FADED = { opacity: 0 };
const OPAQUE = { opacity: 1 };

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";

const REPEAT_LABELS: Record<RepeatMode, string> = {
  off: "Repeat off",
  queue: "Repeat the queue",
  song: "Repeat the song",
};

// the album or the playlist the queue was built from. A queue with none of its own,
// such as one kept before the app held on to it, falls back to the album the song is on.
function usePlayingFrom(): QueueSource | undefined {
  const { source, nowPlaying } = usePlayer();
  const song = nowPlaying?.playId ?? nowPlaying?.id;
  const { data: found } = useSignedInQuery(songSourceQuery(source ? undefined : song));

  return source ?? found ?? undefined;
}

function sourceLabel(source?: QueueSource): string | undefined {
  if (!source) {
    return undefined;
  }

  return isPlaylistType(source.type) ? "Show the playlist" : "Show the album";
}

// opens the album or the playlist the queue was built from. A queue with no source,
// such as one built before the app kept it, stays as plain text.
function PlayingFrom({
  className,
  hoverClassName,
  label,
  children,
}: {
  className?: string;
  hoverClassName?: string;
  label?: string;
  children: ReactNode;
}) {
  const source = usePlayingFrom();
  const { view, open } = useView();

  if (!source) {
    return <div className={className}>{children}</div>;
  }

  const isShown = view.name === "detail" && view.type === source.type && view.id === source.id;

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(className, hoverClassName, "cursor-pointer rounded-sm text-left", FOCUS_RING)}
      onClick={() => {
        if (!isShown) {
          open({ name: "detail", type: source.type, id: source.id });
        }
      }}
    >
      {children}
    </button>
  );
}

function PlayButton({ size = "icon" }: { size?: "icon" | "icon-lg" }) {
  const { isPlaying, isLoading, toggle } = usePlayer();
  const prefersReducedMotion = useReducedMotion();

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size={size}
      aria-label={isLoading ? "Stop loading" : isPlaying ? "Pause" : "Play"}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={isLoading ? "loading" : isPlaying ? "pause" : "play"}
          initial={ICON_HIDDEN}
          animate={ICON_SHOWN}
          exit={ICON_HIDDEN}
          transition={prefersReducedMotion ? NO_TRANSITION : TRANSITION}
        >
          <HugeiconsIcon
            icon={isLoading ? Loading03Icon : isPlaying ? PauseIcon : PlayIcon}
            size={16}
            strokeWidth={2}
            className={cn(isLoading && "animate-spin")}
          />
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}

function NextButton({ size = "icon-xs" }: { size?: "icon-xs" | "icon-lg" }) {
  const { canSkipNext, next } = usePlayer();

  return (
    <Button
      onClick={next}
      disabled={!canSkipNext}
      variant="ghost"
      size={size}
      aria-label="Next song"
    >
      <HugeiconsIcon icon={NextIcon} size={16} strokeWidth={2} />
    </Button>
  );
}

export function Player() {
  const { nowPlaying, isShuffled, repeat, canSkipPrevious, toggleShuffle, cycleRepeat, previous } =
    usePlayer();
  const source = usePlayingFrom();
  const status = useAuthStatus();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // the bar belongs to the person who signed in, so it goes with them and does not wait
  // for MusicKit to let the queue go
  const isShown = Boolean(nowPlaying) && status !== "signed-out";

  const hidden = prefersReducedMotion ? FADED : HIDDEN;
  const shown = prefersReducedMotion ? OPAQUE : SHOWN;
  const blurred = prefersReducedMotion ? FADED : BLURRED;
  const sharp = prefersReducedMotion ? OPAQUE : SHARP;
  const artHidden = prefersReducedMotion ? FADED : ART_HIDDEN;
  const artShown = prefersReducedMotion ? OPAQUE : ART_SHOWN;

  const openTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_REVEAL;
  const closeTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION;
  const swapTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_SWAP;
  const shapeTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION;

  return (
    <AnimatePresence>
      {nowPlaying && isShown && (
        <div
          key="player"
          className="absolute inset-x-0 bottom-0 flex justify-center p-2 pointer-events-none"
        >
          <motion.div
            className="min-w-0"
            initial={hidden}
            animate={{ ...shown, transition: openTransition }}
            exit={{ ...hidden, transition: closeTransition }}
          >
            <div
              className={cn(
                "pointer-events-auto",
                "flex items-center max-w-full",
                isMobile ? "pl-4 pr-4 py-1" : "px-4 pt-0 pb-0",
                "bg-neutral-100 dark:bg-neutral-950",
                "border border-neutral-50 dark:border-neutral-800",
                "rounded-full",
                "select-none",
              )}
            >
              <AnimatePresence initial={false}>
                {!isMobile && (
                  <motion.div
                    key="controls"
                    className="shrink-0 overflow-hidden"
                    initial={GROUP_AT_END}
                    animate={GROUP_BEFORE_END}
                    exit={GROUP_AT_END}
                    transition={shapeTransition}
                  >
                    <div className="flex items-center w-max">
                      <Button
                        onClick={toggleShuffle}
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Shuffle"
                        aria-pressed={isShuffled}
                      >
                        <HugeiconsIcon
                          icon={ShuffleIcon}
                          size={16}
                          strokeWidth={2}
                          className={cn(
                            "transition-opacity",
                            isShuffled ? "opacity-100" : "opacity-40",
                          )}
                        />
                      </Button>
                      <Button
                        onClick={previous}
                        disabled={!canSkipPrevious}
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Previous song"
                      >
                        <HugeiconsIcon icon={PreviousIcon} size={16} strokeWidth={2} />
                      </Button>
                      <PlayButton />
                      <NextButton />
                      <Button
                        onClick={cycleRepeat}
                        variant="ghost"
                        size="icon-xs"
                        aria-label={REPEAT_LABELS[repeat]}
                        aria-pressed={repeat !== "off"}
                      >
                        <HugeiconsIcon
                          icon={repeat === "song" ? RepeatOne02Icon : RepeatIcon}
                          size={16}
                          strokeWidth={2}
                          className={cn(
                            "transition-opacity",
                            repeat === "off" ? "opacity-40" : "opacity-100",
                          )}
                        />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex flex-col min-w-0" style={{ width: META_WIDTH }}>
                <div
                  className={cn("flex items-center gap-2 pt-2 min-w-0", isMobile ? "pb-2" : "pb-0")}
                >
                  <PlayingFrom
                    className="relative size-8 shrink-0"
                    hoverClassName="transition-transform hover:scale-105"
                    label={sourceLabel(source)}
                  >
                    <AnimatePresence initial={false}>
                      <motion.div
                        key={nowPlaying.artwork?.url ?? "no-artwork"}
                        data-slot="player-artwork"
                        className="absolute inset-0"
                        initial={artHidden}
                        animate={artShown}
                        exit={artHidden}
                        transition={swapTransition}
                      >
                        <ArtworkImage
                          artwork={nowPlaying.artwork}
                          size={ARTWORK_SIZE}
                          iconSize={16}
                          className="size-8 rounded-sm"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </PlayingFrom>

                  <div className="flex flex-col grow min-w-0">
                    <PlayingFrom className="relative min-w-0" hoverClassName="hover:underline">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={nowPlaying.name}
                          className="block truncate text-xs font-bold"
                          initial={blurred}
                          animate={sharp}
                          exit={blurred}
                          transition={swapTransition}
                        >
                          {nowPlaying.name}
                        </motion.span>
                      </AnimatePresence>
                    </PlayingFrom>
                    <div className="relative min-w-0">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={nowPlaying.artist?.name ?? "no-artist"}
                          className="block truncate text-xs text-neutral-500 dark:text-neutral-400"
                          initial={blurred}
                          animate={sharp}
                          exit={blurred}
                          transition={swapTransition}
                        >
                          {nowPlaying.artist?.name}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {!isMobile && (
                    <motion.div
                      key="progress"
                      className="overflow-hidden"
                      initial={ROW_COLLAPSED}
                      animate={ROW_EXPANDED}
                      exit={ROW_COLLAPSED}
                      transition={shapeTransition}
                    >
                      <PlayerProgress
                        songId={nowPlaying.id}
                        durationInMillis={nowPlaying.durationInMillis}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence initial={false}>
                {isMobile ? (
                  <motion.div
                    key="compact-controls"
                    className="shrink-0 overflow-hidden"
                    initial={GROUP_AT_START}
                    animate={GROUP_AFTER_START}
                    exit={GROUP_AT_START}
                    transition={shapeTransition}
                  >
                    <div className="flex items-center w-max">
                      <PlayButton size="icon-lg" />
                      <NextButton size="icon-lg" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="queue"
                    className="shrink-0 overflow-hidden"
                    initial={GROUP_AT_START}
                    animate={GROUP_AFTER_START}
                    exit={GROUP_AT_START}
                    transition={shapeTransition}
                  >
                    <div className="flex items-center w-max">
                      <Button variant="ghost" size="icon" aria-label="Queue">
                        <HugeiconsIcon icon={Playlist03Icon} size={16} strokeWidth={2} />
                      </Button>
                      <PlayerVolume />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
