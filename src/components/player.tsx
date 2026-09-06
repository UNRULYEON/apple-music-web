import { usePlayer } from "@/hooks";
import { TRANSITION, TRANSITION_REVEAL, TRANSITION_SWAP } from "@/lib/motion";
import type { RepeatMode } from "@/lib/player/queue";
import { cn } from "@/lib/utils";
import {
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
import { ArtworkImage } from "./artwork";
import { Button } from "./ui/button";

const ARTWORK_SIZE = 64;

// The room the artwork and the text take, when the viewport gives it.
const META_WIDTH = 256;

// The room the bar needs at the end of the scrolled content.
export const PLAYER_SPACE = 72;

const HIDDEN = { opacity: 0, y: 16, scale: 0.97, filter: "blur(2px)" };
const SHOWN = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
const NO_TRANSITION = { duration: 0 } as const;

const BLURRED = { opacity: 0, filter: "blur(2px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };

const ICON_HIDDEN = { opacity: 0, scale: 0.96, filter: "blur(2px)" };
const ICON_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const ART_HIDDEN = { opacity: 0, scale: 0.96, filter: "blur(2px)" };
const ART_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const FADED = { opacity: 0 };
const OPAQUE = { opacity: 1 };

const REPEAT_LABELS: Record<RepeatMode, string> = {
  off: "Repeat off",
  queue: "Repeat the queue",
  song: "Repeat the song",
};

export function Player() {
  const {
    nowPlaying,
    isPlaying,
    isShuffled,
    repeat,
    toggle,
    toggleShuffle,
    cycleRepeat,
    previous,
    next,
  } = usePlayer();
  const prefersReducedMotion = useReducedMotion();

  const hidden = prefersReducedMotion ? FADED : HIDDEN;
  const shown = prefersReducedMotion ? OPAQUE : SHOWN;
  const blurred = prefersReducedMotion ? FADED : BLURRED;
  const sharp = prefersReducedMotion ? OPAQUE : SHARP;
  const artHidden = prefersReducedMotion ? FADED : ART_HIDDEN;
  const artShown = prefersReducedMotion ? OPAQUE : ART_SHOWN;

  const openTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_REVEAL;
  const closeTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION;
  const swapTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_SWAP;
  const iconTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION;

  return (
    <AnimatePresence>
      {nowPlaying && (
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
                "flex items-center gap-4 px-4 py-2 max-w-full",
                "bg-neutral-100 dark:bg-neutral-950",
                "border border-neutral-100/10",
                "rounded-full",
                "select-none",
              )}
            >
              <div className="flex items-center shrink-0">
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
                    className={cn("transition-opacity", isShuffled ? "opacity-100" : "opacity-40")}
                  />
                </Button>
                <Button onClick={previous} variant="ghost" size="icon-xs">
                  <HugeiconsIcon icon={PreviousIcon} size={16} strokeWidth={2} />
                </Button>
                <Button onClick={toggle} variant="ghost" size="icon">
                  <AnimatePresence mode="popLayout">
                    {!isPlaying && (
                      <motion.div
                        key="player-pause"
                        initial={ICON_HIDDEN}
                        animate={ICON_SHOWN}
                        exit={ICON_HIDDEN}
                        transition={iconTransition}
                      >
                        <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={2} />
                      </motion.div>
                    )}
                    {isPlaying && (
                      <motion.div
                        key="player-play"
                        initial={ICON_HIDDEN}
                        animate={ICON_SHOWN}
                        exit={ICON_HIDDEN}
                        transition={iconTransition}
                      >
                        <HugeiconsIcon icon={PauseIcon} size={16} strokeWidth={2} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
                <Button onClick={next} variant="ghost" size="icon-xs">
                  <HugeiconsIcon icon={NextIcon} size={16} strokeWidth={2} />
                </Button>
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
              <div
                className="flex items-center gap-2 min-w-0"
                style={{ width: META_WIDTH, maxWidth: META_WIDTH }}
              >
                <div className="relative size-8 shrink-0">
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
                </div>

                <div className="flex flex-col grow min-w-0">
                  <div className="relative min-w-0">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={nowPlaying.name}
                        className="block truncate text-sm font-bold"
                        initial={blurred}
                        animate={sharp}
                        exit={blurred}
                        transition={swapTransition}
                      >
                        {nowPlaying.name}
                      </motion.span>
                    </AnimatePresence>
                  </div>
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
              <div className="shrink-0">
                <Button variant="ghost" size="icon">
                  <HugeiconsIcon icon={Playlist03Icon} size={16} strokeWidth={2} />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
